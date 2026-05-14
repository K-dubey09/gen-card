import os
import json
from datetime import datetime
from functools import wraps
from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from flask_sqlalchemy import SQLAlchemy
import PyPDF2
from openai import OpenAI
import stripe

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///cardmaker.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max file size

# Ensure upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

db = SQLAlchemy(app)

# Initialize OpenAI client with your API key
client = OpenAI(api_key="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")

# Initialize Stripe (add your Stripe keys)
stripe.api_key = os.environ.get('STRIPE_SECRET_KEY', 'sk_test_your_stripe_key')

# Database Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    credits = db.Column(db.Integer, default=10)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    type = db.Column(db.String(20), nullable=False)  # 'purchase', 'usage', 'bonus'
    amount = db.Column(db.Integer, nullable=False)
    description = db.Column(db.String(200))
    payment_id = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class CardGeneration(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    cards_generated = db.Column(db.Integer, nullable=False)
    credits_used = db.Column(db.Integer, nullable=False)
    file_name = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Credit packages
CREDIT_PACKAGES = {
    'starter': {'credits': 50, 'price': 499, 'price_display': '$4.99'},
    'basic': {'credits': 100, 'price': 899, 'price_display': '$8.99'},
    'pro': {'credits': 250, 'price': 1999, 'price_display': '$19.99'},
    'premium': {'credits': 500, 'price': 3499, 'price_display': '$34.99'},
}

# Decorator for login required
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Login required', 'redirect': '/login'}), 401
        return f(*args, **kwargs)
    return decorated_function

def calculate_credits_needed(num_cards):
    """Calculate credits needed based on number of cards"""
    return max(1, num_cards // 5)  # 1 credit per 5 cards

def extract_text_from_pdf(pdf_path):
    """Extract text content from PDF file"""
    text = ""
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
    except Exception as e:
        print(f"Error extracting PDF: {e}")
    return text

def extract_text_from_txt(txt_path):
    """Extract text from plain text file"""
    try:
        with open(txt_path, 'r', encoding='utf-8') as file:
            return file.read()
    except Exception as e:
        print(f"Error reading text file: {e}")
        return ""

def chunk_text(text, chunk_size=8000):
    """Split large text into manageable chunks"""
    words = text.split()
    chunks = []
    current_chunk = []
    current_size = 0
    
    for word in words:
        current_size += len(word) + 1
        if current_size > chunk_size:
            chunks.append(' '.join(current_chunk))
            current_chunk = [word]
            current_size = len(word)
        else:
            current_chunk.append(word)
    
    if current_chunk:
        chunks.append(' '.join(current_chunk))
    
    return chunks

def generate_cards_with_ai(text_content, num_cards=10):
    """Generate information cards using AI model"""
    
    # Split text into chunks if too large
    chunks = chunk_text(text_content, chunk_size=6000)
    all_cards = []
    
    for idx, chunk in enumerate(chunks[:3]):  # Process first 3 chunks to avoid token limits
        try:
            prompt = f"""Analyze the following text and extract the most important information. 
Create {num_cards // len(chunks[:3])} concise information cards. Each card should:
1. Have a clear title (topic/concept)
2. Include 2-4 key points or facts
3. Be brief and easy to understand
4. Focus on the most important information

Format your response as a JSON array of objects with this structure:
[
  {{
    "title": "Card Title",
    "content": "Key point 1\\nKey point 2\\nKey point 3",
    "category": "Category name",
    "importance": "high/medium/low"
  }}
]

Text to analyze:
{chunk}

Return only valid JSON, no additional text."""

            response = client.chat.completions.create(
                model="gpt-4o-mini",  # Using efficient model for cost-effectiveness
                messages=[
                    {"role": "system", "content": "You are an expert at extracting and summarizing key information from educational content. Always respond with valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=2000
            )
            
            # Parse AI response
            cards_json = response.choices[0].message.content.strip()
            
            # Remove markdown code blocks if present
            if cards_json.startswith("```json"):
                cards_json = cards_json[7:]
            if cards_json.startswith("```"):
                cards_json = cards_json[3:]
            if cards_json.endswith("```"):
                cards_json = cards_json[:-3]
            
            cards = json.loads(cards_json.strip())
            all_cards.extend(cards)
            
        except Exception as e:
            print(f"Error generating cards for chunk {idx}: {e}")
            # Fallback: create a simple card with the error
            all_cards.append({
                "title": f"Section {idx + 1}",
                "content": chunk[:500] + "...",
                "category": "General",
                "importance": "medium"
            })
    
    return all_cards[:num_cards]

# Routes - Authentication
@app.route('/')
def index():
    """Render the main page"""
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))

@app.route('/register', methods=['GET', 'POST'])
def register():
    """User registration"""
    if request.method == 'GET':
        return render_template('register.html')
    
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    
    if not username or not email or not password:
        return jsonify({'error': 'All fields are required'}), 400
    
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already exists'}), 400
    
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 400
    
    user = User(username=username, email=email, credits=10)
    user.set_password(password)
    db.session.add(user)
    
    transaction = Transaction(
        user=user,
        type='bonus',
        amount=10,
        description='Welcome bonus - 10 free credits'
    )
    db.session.add(transaction)
    db.session.commit()
    
    session['user_id'] = user.id
    session['username'] = user.username
    
    return jsonify({'success': True, 'redirect': '/dashboard'})

@app.route('/login', methods=['GET', 'POST'])
def login():
    """User login"""
    if request.method == 'GET':
        return render_template('login.html')
    
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    user = User.query.filter_by(username=username).first()
    
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid username or password'}), 401
    
    session['user_id'] = user.id
    session['username'] = user.username
    
    return jsonify({'success': True, 'redirect': '/dashboard'})

@app.route('/logout')
def logout():
    """User logout"""
    session.clear()
    return redirect(url_for('login'))

@app.route('/dashboard')
@login_required
def dashboard():
    """User dashboard"""
    user = User.query.get(session['user_id'])
    return render_template('dashboard.html', user=user)

@app.route('/upload', methods=['POST'])
@login_required
def upload_file():
    """Handle file upload and generate cards"""
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    num_cards = int(request.form.get('num_cards', 10))
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    user = User.query.get(session['user_id'])
    credits_needed = calculate_credits_needed(num_cards)
    
    if user.credits < credits_needed:
        return jsonify({
            'error': f'Insufficient credits. Need {credits_needed} credits, you have {user.credits}',
            'show_recharge': True
        }), 400
    
    # Check file extension
    allowed_extensions = {'pdf', 'txt'}
    file_ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
    
    if file_ext not in allowed_extensions:
        return jsonify({'error': 'Only PDF and TXT files are supported'}), 400
    
    try:
        # Save uploaded file
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Extract text based on file type
        if file_ext == 'pdf':
            text_content = extract_text_from_pdf(filepath)
        else:
            text_content = extract_text_from_txt(filepath)
        
        if not text_content or len(text_content.strip()) < 100:
            return jsonify({'error': 'Could not extract sufficient text from file'}), 400
        
        # Generate cards using AI
        cards = generate_cards_with_ai(text_content, num_cards)
        
        # Deduct credits
        user.credits -= credits_needed
        
        # Record transaction
        transaction = Transaction(
            user_id=user.id,
            type='usage',
            amount=-credits_needed,
            description=f'Generated {len(cards)} cards from {filename}'
        )
        db.session.add(transaction)
        
        # Record card generation
        card_gen = CardGeneration(
            user_id=user.id,
            cards_generated=len(cards),
            credits_used=credits_needed,
            file_name=filename
        )
        db.session.add(card_gen)
        db.session.commit()
        
        # Clean up uploaded file
        os.remove(filepath)
        
        return jsonify({
            'success': True,
            'cards': cards,
            'total_cards': len(cards),
            'credits_used': credits_needed,
            'credits_remaining': user.credits
        })
        
    except Exception as e:
        print(f"Error processing file: {e}")
        return jsonify({'error': f'Error processing file: {str(e)}'}), 500

@app.route('/generate-from-text', methods=['POST'])
@login_required
def generate_from_text():
    """Generate cards from direct text input"""
    
    data = request.get_json()
    text_content = data.get('text', '')
    num_cards = data.get('num_cards', 10)
    
    if not text_content or len(text_content.strip()) < 100:
        return jsonify({'error': 'Please provide at least 100 characters of text'}), 400
    
    user = User.query.get(session['user_id'])
    credits_needed = calculate_credits_needed(num_cards)
    
    if user.credits < credits_needed:
        return jsonify({
            'error': f'Insufficient credits. Need {credits_needed} credits, you have {user.credits}',
            'show_recharge': True
        }), 400
    
    try:
        cards = generate_cards_with_ai(text_content, num_cards)
        
        # Deduct credits
        user.credits -= credits_needed
        
        # Record transaction
        transaction = Transaction(
            user_id=user.id,
            type='usage',
            amount=-credits_needed,
            description=f'Generated {len(cards)} cards from text input'
        )
        db.session.add(transaction)
        
        # Record card generation
        card_gen = CardGeneration(
            user_id=user.id,
            cards_generated=len(cards),
            credits_used=credits_needed
        )
        db.session.add(card_gen)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'cards': cards,
            'total_cards': len(cards),
            'credits_used': credits_needed,
            'credits_remaining': user.credits
        })
    except Exception as e:
        print(f"Error generating cards: {e}")
        return jsonify({'error': f'Error generating cards: {str(e)}'}), 500

# Routes - Payment & Credits
@app.route('/pricing')
@login_required
def pricing():
    """Show pricing page"""
    user = User.query.get(session['user_id'])
    return render_template('pricing.html', packages=CREDIT_PACKAGES, user=user)

@app.route('/create-payment-intent', methods=['POST'])
@login_required
def create_payment_intent():
    """Create Stripe payment intent"""
    data = request.get_json()
    package = data.get('package')
    
    if package not in CREDIT_PACKAGES:
        return jsonify({'error': 'Invalid package'}), 400
    
    package_info = CREDIT_PACKAGES[package]
    
    try:
        intent = stripe.PaymentIntent.create(
            amount=package_info['price'],
            currency='usd',
            metadata={
                'user_id': session['user_id'],
                'package': package,
                'credits': package_info['credits']
            }
        )
        
        return jsonify({
            'clientSecret': intent.client_secret,
            'credits': package_info['credits']
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/confirm-payment', methods=['POST'])
@login_required
def confirm_payment():
    """Confirm payment and add credits"""
    data = request.get_json()
    payment_intent_id = data.get('payment_intent_id')
    package = data.get('package')
    
    if package not in CREDIT_PACKAGES:
        return jsonify({'error': 'Invalid package'}), 400
    
    try:
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        
        if intent.status == 'succeeded':
            package_info = CREDIT_PACKAGES[package]
            user = User.query.get(session['user_id'])
            
            user.credits += package_info['credits']
            
            transaction = Transaction(
                user_id=user.id,
                type='purchase',
                amount=package_info['credits'],
                description=f'Purchased {package.title()} package',
                payment_id=payment_intent_id
            )
            db.session.add(transaction)
            db.session.commit()
            
            return jsonify({
                'success': True,
                'credits_added': package_info['credits'],
                'total_credits': user.credits
            })
        else:
            return jsonify({'error': 'Payment not completed'}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/transactions')
@login_required
def transactions():
    """View transaction history"""
    user = User.query.get(session['user_id'])
    user_transactions = Transaction.query.filter_by(user_id=user.id).order_by(Transaction.created_at.desc()).all()
    return render_template('transactions.html', transactions=user_transactions, user=user)

@app.route('/api/user-info')
@login_required
def user_info():
    """Get current user info"""
    user = User.query.get(session['user_id'])
    return jsonify({
        'username': user.username,
        'email': user.email,
        'credits': user.credits
    })

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        print("=" * 60)
        print("📚 CARD MAKER WITH AUTHENTICATION & PAYMENTS")
        print("=" * 60)
        print("\n✅ Database initialized")
        print("🔐 Authentication: Enabled")
        print("💳 Payment: Stripe Integration")
        print("🎁 New users get 10 free credits")
        print("\n📊 Credit System:")
        print("   - 1 credit = 5 cards")
        print("   - Check /pricing for packages")
        print("\n🌐 Visit: http://localhost:5000")
        print("=" * 60 + "\n")
    
    app.run(debug=True, port=5000)
