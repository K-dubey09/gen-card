# Card Maker - Installation & Setup

## 🎯 What This Does

Complete card maker app with:
- ✅ User authentication (login/register)
- ✅ OpenAI API integration (your key included)
- ✅ Credit system (10 free credits on signup)
- ✅ Stripe payment integration
- ✅ Transaction history
- ✅ Generate study cards from PDFs/text

## 🚀 Installation (3 Steps)

### Step 1: Install Dependencies
```cmd
pip install -r requirements.txt
```

### Step 2: Get Stripe Keys (for payments)
1. Go to https://stripe.com → Sign up
2. Visit https://dashboard.stripe.com/test/apikeys
3. Copy your keys

### Step 3: Update Stripe Keys

**In `pricing.html` (line 147):**
```javascript
const stripe = Stripe('pk_test_YOUR_PUBLISHABLE_KEY_HERE');
```

**In `app.py` or `.env`:**
```python
stripe.api_key = 'sk_test_YOUR_SECRET_KEY_HERE'
```

## ▶️ Run the App

**Option 1: Double-click**
```
start.bat
```

**Option 2: Command line**
```cmd
python app.py
```

Then visit: **http://localhost:5000**

## 📝 First Use

1. **Register** → Create account (get 10 free credits)
2. **Dashboard** → Upload PDF or paste text
3. **Generate** → Create cards (1 credit = 5 cards)
4. **Buy Credits** → When you run out

## 💳 Credit Packages

- Starter: 50 credits ($4.99) → 250 cards
- Basic: 100 credits ($8.99) → 500 cards  
- Pro: 250 credits ($19.99) → 1,250 cards
- Premium: 500 credits ($34.99) → 2,500 cards

## 🧪 Test Payments

Use Stripe test card:
- Card: `4242 4242 4242 4242`
- Date: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

## 📁 What's Included

```
Project Card maker/
├── app.py                 # Backend with auth & payments
├── start.bat              # Quick start script
├── requirements.txt       # Dependencies
├── .env                   # API keys (your OpenAI key included)
├── SETUP_GUIDE.md        # Detailed documentation
├── templates/
│   ├── login.html        # Login page
│   ├── register.html     # Registration
│   ├── dashboard.html    # Main app
│   ├── pricing.html      # Buy credits
│   └── transactions.html # History
└── static/
    ├── style.css         # Styles
    ├── auth.css          # Auth styles
    └── script.js         # Frontend logic
```

## ⚙️ Features

### Authentication
- Secure login/register
- Password hashing
- Session management
- Protected routes

### Credits System
- 10 free credits on signup
- 1 credit = 5 cards
- Buy credits via Stripe
- Track all transactions

### Card Generation
- Upload PDF or TXT files
- Paste text directly
- AI extracts key info (GPT-4o-mini)
- Categorized by importance
- Export as JSON or text
- Print-ready format

### Payment Integration
- Secure Stripe checkout
- Multiple package options
- Instant credit delivery
- Transaction history

## 🔐 Security

- ✅ Password hashing (Werkzeug)
- ✅ Session management
- ✅ Protected API routes
- ✅ SQL injection prevention
- ✅ Secure payment (Stripe PCI)

## 🐛 Troubleshooting

**"Module not found" errors:**
```cmd
pip install flask flask-sqlalchemy openai PyPDF2 stripe
```

**"Database error":**
```cmd
del cardmaker.db
python app.py
```

**"Payment failed":**
- Check Stripe keys are correct
- Use test mode keys for development
- Verify test card number

**"Insufficient credits":**
- Go to `/pricing` page
- Buy more credits
- Or use test Stripe payment

## 💡 Quick Tips

1. **Free Credits**: New users get 10 credits (50 cards)
2. **Credit Calculation**: Cards ÷ 5 = Credits needed
3. **Test Payments**: Use Stripe test cards in test mode
4. **Export**: Save cards as JSON or text file
5. **Filter**: View cards by priority (high/medium/low)

## 📊 System Requirements

- Python 3.8+
- Windows/Mac/Linux
- Internet connection
- Modern web browser
- OpenAI API access ✅ (already included)
- Stripe account (for payments)

## 🎓 How It Works

1. **User registers** → Gets 10 free credits
2. **Uploads document** → PDF or text file
3. **AI analyzes** → GPT-4o-mini extracts key info
4. **Cards generated** → Organized by topic & importance
5. **Credits deducted** → 1 credit per 5 cards
6. **Need more?** → Buy credits via Stripe

## 📞 Support

**Common Issues:**

❓ "Can't login" → Check username/password, try register
❓ "No credits" → Visit /pricing to buy more  
❓ "Cards not generating" → Check file format (PDF/TXT)
❓ "Payment error" → Verify Stripe keys, use test card

**Database Reset:**
```cmd
del cardmaker.db
python app.py
```

## 🎉 You're Ready!

1. Run: `python app.py`
2. Open: http://localhost:5000
3. Register account
4. Start generating cards!

**Your OpenAI API key is already configured in the `.env` file!**

---

Need detailed docs? See **SETUP_GUIDE.md**
