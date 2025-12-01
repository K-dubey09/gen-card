from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from openai import OpenAI
import PyPDF2
import json
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app, origins=['http://localhost:5000'])

# OpenAI Client
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

def extract_text_from_pdf(file_path):
    """Extract text from PDF file"""
    text = ""
    try:
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                text += page.extract_text()
    except Exception as e:
        raise Exception(f"PDF extraction failed: {str(e)}")
    return text

def chunk_text(text, max_length=10000):
    """Break text into manageable chunks"""
    words = text.split()
    chunks = []
    current_chunk = []
    current_length = 0
    
    for word in words:
        word_length = len(word) + 1
        if current_length + word_length > max_length and current_chunk:
            chunks.append(' '.join(current_chunk))
            current_chunk = []
            current_length = 0
        current_chunk.append(word)
        current_length += word_length
    
    if current_chunk:
        chunks.append(' '.join(current_chunk))
    
    return chunks

def generate_cards_with_ai(text, num_cards=10):
    """Generate study cards using OpenAI API"""
    chunks = chunk_text(text)
    all_cards = []
    cards_per_chunk = max(1, num_cards // len(chunks))
    
    for i, chunk in enumerate(chunks):
        cards_to_generate = cards_per_chunk if i < len(chunks) - 1 else (num_cards - len(all_cards))
        
        if cards_to_generate <= 0:
            break
        
        prompt = f"""Analyze this educational content and create {cards_to_generate} study cards.
Each card should contain:
- Title: A clear, concise heading
- Category: The subject area (e.g., Science, History, Math, etc.)
- Content: Key information, concepts, or facts
- Importance: Rating from 1-5 (5 being most important)

Return ONLY valid JSON in this exact format:
{{
  "cards": [
    {{
      "title": "Card Title",
      "category": "Subject",
      "content": "Detailed information here",
      "importance": 4
    }}
  ]
}}

Content to analyze:
{chunk[:3000]}"""

        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are an expert educational content analyzer. Return only valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=2000
            )
            
            result = response.choices[0].message.content.strip()
            
            # Try to parse JSON
            if result.startswith('```json'):
                result = result[7:]
            if result.startswith('```'):
                result = result[3:]
            if result.endswith('```'):
                result = result[:-3]
            
            result = result.strip()
            cards_data = json.loads(result)
            
            if 'cards' in cards_data:
                all_cards.extend(cards_data['cards'])
        
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
            continue
        except Exception as e:
            print(f"API error: {e}")
            continue
    
    return all_cards[:num_cards]

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'OK', 'service': 'AI Card Generator'})

@app.route('/generate-cards', methods=['POST'])
def generate_cards():
    """Generate cards from file or text"""
    try:
        # Check if file upload
        if 'file' in request.files:
            file = request.files['file']
            num_cards = int(request.form.get('num_cards', 10))
            
            # Save temporarily
            temp_path = os.path.join('temp', file.filename)
            os.makedirs('temp', exist_ok=True)
            file.save(temp_path)
            
            # Extract text
            if file.filename.endswith('.pdf'):
                text = extract_text_from_pdf(temp_path)
            else:
                with open(temp_path, 'r', encoding='utf-8') as f:
                    text = f.read()
            
            # Clean up
            os.remove(temp_path)
        
        # Check if text input
        elif request.is_json:
            data = request.get_json()
            text = data.get('text', '')
            num_cards = int(data.get('num_cards', 10))
        
        else:
            return jsonify({'error': 'No file or text provided'}), 400
        
        if not text or len(text) < 100:
            return jsonify({'error': 'Text too short (minimum 100 characters)'}), 400
        
        # Generate cards
        cards = generate_cards_with_ai(text, num_cards)
        
        if not cards:
            return jsonify({'error': 'Failed to generate cards'}), 500
        
        return jsonify({
            'success': True,
            'cards': cards,
            'count': len(cards)
        })
    
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print('=' * 60)
    print('🤖 AI CARD GENERATOR SERVICE')
    print('=' * 60)
    print('\n🚀 Starting Python AI microservice...')
    print('🔌 Endpoint: http://localhost:5001/generate-cards')
    print('🔑 OpenAI API: Configured')
    print(f'\n{"=" * 60}\n')
    
    app.run(host='0.0.0.0', port=5001, debug=True)
