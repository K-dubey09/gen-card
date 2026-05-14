from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from openai import OpenAI
import PyPDF2
import json
import requests
from dotenv import load_dotenv
from PIL import Image
import pytesseract
import io
from pdf2image import convert_from_path

load_dotenv()

app = Flask(__name__)
CORS(app, origins=['http://localhost:5000'])

# OpenAI Client
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

# Tesseract path (update if needed for your system)
# For Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki
# Set path or add to system PATH
try:
    # Try conda environment first
    conda_prefix = os.environ.get('CONDA_PREFIX', '')
    conda_tesseract_paths = [
        os.path.join(conda_prefix, 'Library', 'bin', 'tesseract.exe') if conda_prefix else None,
        r'C:\Users\HP\miniforge3\Library\bin\tesseract.exe',
        r'C:\ProgramData\miniforge3\Library\bin\tesseract.exe',
        r'C:\Users\HP\anaconda3\Library\bin\tesseract.exe',
        r'C:\ProgramData\anaconda3\Library\bin\tesseract.exe',
    ]
    
    # Try standalone installations
    standalone_paths = [
        r'C:\Program Files\Tesseract-OCR\tesseract.exe',
        r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe'
    ]
    
    all_paths = [p for p in conda_tesseract_paths if p] + standalone_paths
    
    tesseract_found = False
    for path in all_paths:
        if os.path.exists(path):
            pytesseract.pytesseract.tesseract_cmd = path
            print(f"✅ Found Tesseract at: {path}")
            
            # Set TESSDATA_PREFIX for conda installation
            tessdata_dir = os.path.join(os.path.dirname(path), '..', 'share', 'tessdata')
            if os.path.exists(tessdata_dir):
                os.environ['TESSDATA_PREFIX'] = os.path.abspath(tessdata_dir)
                print(f"✅ Set TESSDATA_PREFIX to: {os.environ['TESSDATA_PREFIX']}")
            
            tesseract_found = True
            break
    
    if not tesseract_found:
        print("⚠️  Warning: Tesseract not found in common locations")
        print("Please install Tesseract OCR: https://github.com/UB-Mannheim/tesseract/wiki")
except Exception as e:
    print(f"Warning: Tesseract path not set: {e}")
    print("Please install Tesseract OCR: https://github.com/UB-Mannheim/tesseract/wiki")

# Image generation configuration
# Set to False to use free Pollinations.ai instead of DALL-E (saves API costs)
USE_DALLE = os.getenv('USE_DALLE', 'false').lower() == 'true'

def generate_ai_image(card_data, use_dalle=USE_DALLE):
    """Generate AI image using DALL-E or free alternative based on card content"""
    try:
        # Create a detailed image prompt from card data
        title = card_data.get('title', '').replace('🚀', '').replace('💡', '').replace('⚡', '').strip()
        category = card_data.get('category', '').replace('📚', '').replace('💻', '').replace('🔬', '').strip()
        summary = card_data.get('summary', '')[:100]  # Limit summary length
        
        # Create detailed prompt for professional educational image with creative elements
        image_prompt = f"Professional educational infographic about {category}: {title}. {summary}. Blend of creative cartoon elements with professional design, knowledge flow diagrams, text annotations, icons, arrows showing concepts. High quality, modern, engaging, suitable for serious learning. Digital illustration with written content and visual explanations."
        
        print(f"Generating image with prompt: {image_prompt}")
        
        if use_dalle:
            try:
                # Generate image using DALL-E 3
                response = client.images.generate(
                    model="dall-e-3",
                    prompt=image_prompt,
                    size="1024x1024",
                    quality="standard",
                    n=1,
                )
                
                image_url = response.data[0].url
                print(f"Successfully generated DALL-E image: {image_url}")
                return image_url
            except Exception as dalle_error:
                print(f"DALL-E failed, trying alternative: {dalle_error}")
                use_dalle = False
        
        if not use_dalle:
            # Use Pollinations.ai - Free AI image generation API
            # Clean prompt for URL encoding
            clean_prompt = image_prompt.replace(' ', '%20').replace(',', '%2C')[:200]
            image_url = f"https://image.pollinations.ai/prompt/{clean_prompt}?width=800&height=600&nologo=true&enhance=true"
            print(f"Using Pollinations.ai image: {image_url}")
            return image_url
        
    except Exception as e:
        print(f"AI image generation error: {e}")
        # Fallback to placeholder with card title
        title_text = card_data.get('title', 'Study Card')[:30].replace(' ', '+')
        return f"https://placehold.co/800x600/667eea/white?text={title_text}"

def extract_text_from_pdf(file_path):
    """Extract text from PDF file (handles both text-based and image-based PDFs)"""
    text = ""
    try:
        import sys
        sys.stderr.write(f"📄 Opening PDF: {file_path}\n")
        sys.stderr.flush()
        
        # First, try extracting text normally
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            num_pages = len(pdf_reader.pages)
            sys.stderr.write(f"📚 PDF has {num_pages} pages\n")
            sys.stderr.flush()
            
            for i, page in enumerate(pdf_reader.pages):
                page_text = page.extract_text()
                text += page_text
                if i == 0:
                    sys.stderr.write(f"📖 First page extracted {len(page_text)} characters\n")
                    sys.stderr.write(f"Preview: {page_text[:200]}\n")
                    sys.stderr.flush()
            
            sys.stderr.write(f"✅ Total extracted text length: {len(text.strip())} characters\n")
            sys.stderr.flush()
        
        # If no text extracted (image-based PDF), use OCR
        if len(text.strip()) < 10:
            sys.stderr.write("🖼️  Text extraction yielded minimal content - PDF appears to be image-based\n")
            sys.stderr.write("🔍 Converting PDF pages to images for OCR...\n")
            sys.stderr.flush()
            
            try:
                # Try common poppler paths on Windows
                import os
                conda_prefix = os.environ.get('CONDA_PREFIX', '')
                poppler_paths = [
                    os.path.join(conda_prefix, 'Library', 'bin') if conda_prefix else None,
                    r'C:\Users\HP\miniforge3\Library\bin',
                    r'C:\ProgramData\miniforge3\Library\bin',
                    r'C:\Users\HP\anaconda3\Library\bin',
                    r'C:\ProgramData\anaconda3\Library\bin',
                    r'C:\poppler\Library\bin',
                    r'C:\Program Files\poppler\Library\bin',
                    r'C:\poppler-24.08.0\Library\bin',
                    None  # Will try system PATH
                ]
                
                # Filter out None values
                poppler_paths = [p for p in poppler_paths if p]
                
                images = None
                for poppler_path in poppler_paths:
                    try:
                        if poppler_path:
                            sys.stderr.write(f"Trying poppler path: {poppler_path}\n")
                            sys.stderr.flush()
                            # Limit to first 10 pages for faster processing
                            images = convert_from_path(file_path, dpi=200, first_page=1, last_page=10, poppler_path=poppler_path)
                        else:
                            sys.stderr.write("Trying poppler from system PATH\n")
                            sys.stderr.flush()
                            images = convert_from_path(file_path, dpi=200, first_page=1, last_page=10)
                        sys.stderr.write(f"✅ Successfully converted {len(images)} pages using poppler\n")
                        sys.stderr.flush()
                        break
                    except Exception as path_error:
                        sys.stderr.write(f"⚠️  Failed with this path: {str(path_error)}\n")
                        sys.stderr.flush()
                        continue
                
                if not images:
                    raise Exception("Poppler not found in any common location")
                    
                sys.stderr.write(f"✅ Converted {len(images)} pages to images\n")
                sys.stderr.flush()
                
                text = ""
                for i, image in enumerate(images):
                    sys.stderr.write(f"🔍 Running OCR on page {i+1}/{len(images)}...\n")
                    sys.stderr.flush()
                    
                    # Use pytesseract to extract text
                    page_text = pytesseract.image_to_string(image, lang='eng')
                    text += f"\n--- Page {i+1} ---\n{page_text}\n"
                    
                    if i == 0:
                        sys.stderr.write(f"📖 First page OCR extracted {len(page_text)} characters\n")
                        sys.stderr.write(f"Preview: {page_text[:200]}\n")
                        sys.stderr.flush()
                
                sys.stderr.write(f"✅ Total OCR extracted text length: {len(text.strip())} characters\n")
                sys.stderr.flush()
                
            except Exception as ocr_error:
                sys.stderr.write(f"❌ OCR extraction failed: {str(ocr_error)}\n")
                sys.stderr.write("📋 Please install Poppler: https://github.com/oschwartz10612/poppler-windows/releases/\n")
                sys.stderr.write("📋 See ai-service/setup_poppler.md for instructions\n")
                sys.stderr.flush()
                raise Exception(f"Image-based PDF detected but OCR failed. Install Poppler for image extraction. Error: {str(ocr_error)}")
            
    except Exception as e:
        import sys
        sys.stderr.write(f"❌ PDF extraction error: {str(e)}\n")
        sys.stderr.flush()
        raise Exception(f"PDF extraction failed: {str(e)}")
    return text

def extract_text_from_image(file_path):
    """Extract text from image using OCR (supports handwritten notes)"""
    text = ""
    try:
        # Open image
        image = Image.open(file_path)
        
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Perform OCR with config for better handwriting recognition
        # PSM 6 = Assume a single uniform block of text
        # PSM 3 = Fully automatic page segmentation (default)
        custom_config = r'--oem 3 --psm 3'
        text = pytesseract.image_to_string(image, config=custom_config)
        
        # If text is too short, try with different PSM mode
        if len(text.strip()) < 50:
            print("Trying alternative OCR configuration...")
            custom_config = r'--oem 3 --psm 6'
            text = pytesseract.image_to_string(image, config=custom_config)
        
        print(f"OCR extracted {len(text)} characters from image")
        
    except Exception as e:
        raise Exception(f"OCR extraction failed: {str(e)}. Make sure Tesseract is installed.")
    
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
    """Generate study cards using OpenAI API - focus on quality from start of content"""
    all_cards = []
    
    # For quality focus, use beginning of text only (don't spread across entire document)
    # Take first portion based on requested cards (more cards = more content needed)
    max_content_length = min(15000, num_cards * 1500)  # ~1500 chars per card for quality
    focused_text = text[:max_content_length]
    
    print(f"Generating exactly {num_cards} cards from beginning of content ({len(focused_text)} characters)")
    
    # Calculate API calls needed (max 10 cards per call for quality)
    max_cards_per_call = 10
    total_calls_needed = (num_cards + max_cards_per_call - 1) // max_cards_per_call
    
    call_count = 0
    
    while len(all_cards) < num_cards and call_count < total_calls_needed:
        # Calculate exactly how many cards to generate in this call
        remaining_cards = num_cards - len(all_cards)
        cards_to_generate = min(max_cards_per_call, remaining_cards)
        
        print(f"API Call {call_count + 1}/{total_calls_needed}: Requesting EXACTLY {cards_to_generate} cards (Current total: {len(all_cards)}/{num_cards})")
        
        # Use focused text for all calls to maintain quality and consistency
        prompt = f"""You MUST create EXACTLY {cards_to_generate} study cards - no more, no less.

Analyze this educational content from the BEGINNING and create EXACTLY {cards_to_generate} high-quality study cards covering the most important concepts in order.

CRITICAL: Return EXACTLY {cards_to_generate} cards in the JSON array. Count them carefully.

These cards are for READING and LEARNING - include comprehensive, detailed text content:

- Title: Clear, descriptive heading (10-15 words) that tells exactly what the card covers
- Category: The subject area (Science, History, Math, Programming, Art, Business, etc.)
- Content: DETAILED explanation (200-400 words minimum) covering:
  * Clear definition/explanation of the concept
  * Step-by-step breakdown if applicable
  * Real-world examples and applications
  * How it works or why it matters
  * Important formulas, code, or key information
  * Common mistakes or misconceptions to avoid
  Write in clear, educational language that students can read and understand deeply.

- KeyPoints: Array of 5-7 detailed bullet points (not just phrases - full sentences):
  * Each point should be a complete, informative statement
  * Include specific details, numbers, examples
  * Cover different aspects: definition, application, importance, tips
  
- Summary: Comprehensive 3-4 sentence conclusion that reinforces key learning points

- Importance: Rating from 1-5 (5 being most critical)
- Color: Choose theme colors (blue, green, purple, orange, red, teal, pink, indigo)
- ImageKeyword: Keyword for visual aid

Focus on creating cards that students can READ, STUDY, and LEARN FROM - not just glance at.
Include enough detail that someone could learn the concept just from reading the card.

Return ONLY valid JSON with EXACTLY {cards_to_generate} cards in this format:
{{
  "cards": [
    {{
      "title": "Comprehensive Topic Title with Clear Description",
      "category": "Subject Area",
      "content": "Detailed 200-400 word explanation covering the concept thoroughly with examples, step-by-step breakdowns, formulas, code snippets, real-world applications, and important details that students need to understand and remember. Include specific information that makes this card valuable for learning.",
      "keyPoints": [
        "First key point as a complete, informative sentence with specific details and examples that add real value",
        "Second important aspect explained thoroughly with context and why it matters for understanding",
        "Third critical detail that includes specific information, numbers, or examples students should remember",
        "Fourth learning point with practical application or real-world relevance explained clearly",
        "Fifth essential concept with additional context, tips, or common mistakes to avoid",
        "Sixth supporting detail that deepens understanding with examples or connections",
        "Seventh reinforcing point that ties concepts together or provides study tips"
      ],
      "summary": "Comprehensive 3-4 sentence summary that reinforces the main learning objectives, highlights the most critical information, explains practical applications, and helps students remember the key concepts covered in this card.",
      "importance": 4,
      "color": "purple",
      "imageKeyword": "educational visual keyword"
    }}
  ]
}}

Content to analyze:
{focused_text[:4000]}"""

        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": f"You are an expert educational content creator. CRITICAL: Return EXACTLY {cards_to_generate} cards. Create comprehensive, detailed learning cards with substantial text content (200-400 words) that students can READ and LEARN from. Include detailed explanations, examples, step-by-step breakdowns, formulas, and practical applications. Focus on educational depth and clarity. Return only valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.5,
                max_tokens=16000  # Increased from 4000 to handle 10 detailed cards
            )
            
            result = response.choices[0].message.content.strip()
            
            # Try to parse JSON - handle markdown code blocks
            if result.startswith('```json'):
                result = result[7:]
            if result.startswith('```'):
                result = result[3:]
            if result.endswith('```'):
                result = result[:-3]
            result = result.strip()
            
            # Try to parse JSON
            try:
                cards_data = json.loads(result)
            except json.JSONDecodeError as e:
                import sys
                sys.stderr.write(f"❌ JSON parsing error: {e}\n")
                sys.stderr.write(f"📄 Raw response preview (first 500 chars):\n{result[:500]}\n")
                sys.stderr.write(f"📄 Raw response end (last 500 chars):\n{result[-500:]}\n")
                sys.stderr.flush()
                
                # Try to fix common JSON issues
                # Attempt 1: Find JSON object in response
                import re
                json_match = re.search(r'\{[\s\S]*\}', result)
                if json_match:
                    sys.stderr.write("🔧 Attempting to extract JSON from response...\n")
                    sys.stderr.flush()
                    try:
                        result = json_match.group(0)
                        cards_data = json.loads(result)
                        sys.stderr.write("✅ Successfully extracted and parsed JSON!\n")
                        sys.stderr.flush()
                    except:
                        sys.stderr.write("❌ JSON extraction failed\n")
                        sys.stderr.flush()
                        raise e
                else:
                    raise e
            
            if 'cards' in cards_data:
                new_cards = cards_data['cards'][:cards_to_generate]  # Enforce exact count
                
                print(f"AI returned {len(cards_data['cards'])} cards, using exactly {len(new_cards)}")
                
                # Generate AI images for each card in parallel
                import concurrent.futures
                import sys
                
                def generate_image_for_card(card_with_index):
                    idx, card = card_with_index
                    try:
                        sys.stderr.write(f"🖼️  Generating image {idx+1}/{len(new_cards)}...\n")
                        sys.stderr.flush()
                        return generate_ai_image(card)
                    except Exception as e:
                        sys.stderr.write(f"❌ Failed to generate image for card {idx+1}: {e}\n")
                        sys.stderr.flush()
                        return f"https://placehold.co/800x600/667eea/white?text={card.get('title', 'Card')[:20]}"
                
                # Use ThreadPoolExecutor for parallel image generation (max 8 concurrent for speed)
                sys.stderr.write(f"🚀 Starting parallel image generation for {len(new_cards)} cards...\n")
                sys.stderr.flush()
                
                with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
                    image_urls = list(executor.map(generate_image_for_card, enumerate(new_cards)))
                
                # Assign generated image URLs to cards
                for i, card in enumerate(new_cards):
                    card['imageUrl'] = image_urls[i]
                
                sys.stderr.write(f"✅ All images generated!\n")
                sys.stderr.flush()
                
                all_cards.extend(new_cards)
                print(f"Successfully generated {len(new_cards)} cards with images. Total: {len(all_cards)}/{num_cards}")
        
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
        except Exception as e:
            print(f"API error: {e}")
        
        call_count += 1
        
        # Stop if we have exact number
        if len(all_cards) >= num_cards:
            break
    
    # Return EXACTLY the requested number of cards
    final_cards = all_cards[:num_cards]
    print(f"Final: Returning exactly {len(final_cards)} cards as requested")
    
    # If we failed to generate any cards, raise an error
    if len(final_cards) == 0:
        import sys
        sys.stderr.write("❌ CRITICAL: Failed to generate any cards!\n")
        sys.stderr.flush()
        raise Exception("Failed to generate any cards. The AI response may have had JSON formatting issues.")
    
    return final_cards

@app.route('/generate-roadmap', methods=['POST'])
def generate_roadmap():
    """Generate a learning roadmap with connected cards"""
    try:
        data = request.get_json()
        cards = data.get('cards', [])
        topic = data.get('topic', 'Learning Path')
        
        if not cards or len(cards) == 0:
            return jsonify({'error': 'No cards provided'}), 400
        
        # Generate roadmap structure using AI
        cards_summary = "\n".join([
            f"{i+1}. {card.get('title', '')} - {card.get('category', '')} (Importance: {card.get('importance', 0)})"
            for i, card in enumerate(cards)
        ])
        
        prompt = f"""Based on these study cards, create a CREATIVE and VISUALLY STUNNING learning roadmap for: "{topic}"

Cards:
{cards_summary}

Create an engaging, memorable learning roadmap with:
1. Creative phase names with emojis (e.g., 🌱 Foundation Phase, 🚀 Mastery Phase)
2. Logical progression from basics to advanced
3. Clear dependencies showing learning prerequisites and knowledge flow
4. Step-by-step learning sequence without time constraints
5. Actionable, inspiring learning tips with emojis
6. Visual keywords for each phase (for finding stunning images)
7. Color themes that match the learning mood (blue=foundational, green=growth, purple=advanced, orange=creative, red=challenging, teal=technical, pink=innovative, indigo=mastery)

Return ONLY valid JSON in this exact format:
{{
  "roadmap": {{
    "title": "🎯 Creative Learning Roadmap Title with emoji",
    "description": "Inspiring overview that motivates the learner with clear learning flow",
    "totalPhases": "Number of learning phases",
    "phases": [
      {{
        "phaseNumber": 1,
        "phaseName": "🌱 Creative Phase Name",
        "description": "Engaging description of what you'll master in this phase with clear learning objectives",ription of what you'll master in this phase with clear learning objectives",
        "color": "blue",
        "icon": "🌱",
        "imageKeyword": "professional educational infographic seedling growth learning knowledge flow",
        "cardIndices": [0, 1, 2],
        "learningObjectives": [
          "Clear objective 1",
          "Clear objective 2"
        ],
        "tips": [
          "💡 Practical tip with emoji",
          "⚡ Another actionable insight"
        ]
      }}
    ],
    "connections": [
      {{
        "from": 0,
        "to": 1,
        "type": "builds upon",
        "description": "How this phase connects to next"
      }}
    ]
  }}
}}"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a creative educational experience designer who crafts inspiring, visual learning journeys. Use emojis, vivid language, and create memorable phase names. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.8,
            max_tokens=3000
        )
        
        result = response.choices[0].message.content.strip()
        
        # Clean JSON markers
        if result.startswith('```json'):
            result = result[7:]
        if result.startswith('```'):
            result = result[3:]
        if result.endswith('```'):
            result = result[:-3]
        
        result = result.strip()
        roadmap_data = json.loads(result)
        
        # Generate AI images for each phase
        roadmap = roadmap_data.get('roadmap', {})
        if 'phases' in roadmap:
            for phase in roadmap['phases']:
                try:
                    # Create image prompt for phase
                    phase_name = phase.get('phaseName', '').replace('🌱', '').replace('🚀', '').replace('💡', '').strip()
                    phase_desc = phase.get('description', '')[:100]
                    
                    image_prompt = f"Professional educational infographic for learning phase: {phase_name}. {phase_desc}. Blend of creative cartoon elements with professional diagrams, knowledge flow arrows, text annotations, concept illustrations. High quality, modern, engaging learning visual with written explanations."
                    
                    print(f"Generating phase image: {image_prompt}")
                    
                    # Try DALL-E first, fallback to free API
                    try:
                        response = client.images.generate(
                            model="dall-e-3",
                            prompt=image_prompt,
                            size="1024x1024",
                            quality="standard",
                            n=1,
                        )
                        phase['imageUrl'] = response.data[0].url
                        print(f"Generated DALL-E phase image: {phase['imageUrl']}")
                    except Exception as dalle_error:
                        print(f"DALL-E failed for phase, using Pollinations: {dalle_error}")
                        clean_prompt = image_prompt.replace(' ', '%20').replace(',', '%2C')[:200]
                        phase['imageUrl'] = f"https://image.pollinations.ai/prompt/{clean_prompt}?width=800&height=600&nologo=true&enhance=true"
                        print(f"Using Pollinations.ai for phase: {phase['imageUrl']}")
                    
                except Exception as e:
                    print(f"Failed to generate phase image: {e}")
                    phase_text = phase.get('phaseName', 'Phase')[:30].replace(' ', '+')
                    phase['imageUrl'] = f"https://placehold.co/800x600/{phase.get('color', '667eea')}/white?text={phase_text}"
        
        return jsonify({
            'success': True,
            'roadmap': roadmap,
            'cards': cards
        })
    
    except json.JSONDecodeError as e:
        print(f"JSON parsing error: {e}")
        return jsonify({'error': 'Failed to parse roadmap data'}), 500
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/generate-cards', methods=['POST'])
def generate_cards():
    """Generate cards from file or text"""
    try:
        import sys
        sys.stderr.write("="*60 + "\n")
        sys.stderr.write("🔍 GENERATE-CARDS REQUEST RECEIVED\n")
        sys.stderr.write(f"📋 Content-Type: {request.content_type}\n")
        sys.stderr.write(f"📁 request.files keys: {list(request.files.keys())}\n")
        sys.stderr.write(f"📝 request.form keys: {list(request.form.keys())}\n")
        sys.stderr.write(f"🔢 request.is_json: {request.is_json}\n")
        sys.stderr.write(f"📊 request.content_length: {request.content_length}\n")
        sys.stderr.write("="*60 + "\n")
        sys.stderr.flush()
        
        # Check if file upload
        if 'file' in request.files:
            file = request.files['file']
            num_cards_param = request.form.get('num_cards', '10')
            num_cards = int(num_cards_param)
            print(f"="*60)
            print(f"RECEIVED REQUEST: num_cards parameter = '{num_cards_param}'")
            print(f"PARSED: num_cards = {num_cards} (type: {type(num_cards)})")
            print(f"FILE: {file.filename}")
            print(f"="*60)
            
            # Save temporarily
            temp_path = os.path.join('temp', file.filename)
            os.makedirs('temp', exist_ok=True)
            file.save(temp_path)
            
            # Extract text based on file type
            file_ext = os.path.splitext(file.filename)[1].lower()
            
            if file_ext == '.pdf':
                text = extract_text_from_pdf(temp_path)
            elif file_ext in ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.gif']:
                # Use OCR for images (handwritten notes)
                print(f"Processing image with OCR: {file.filename}")
                text = extract_text_from_image(temp_path)
                print(f"OCR Result preview: {text[:200]}...")
            else:
                # Text files
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
            import sys
            sys.stderr.write("❌ ERROR: No file or text provided\n")
            sys.stderr.write(f"📁 request.files: {dict(request.files)}\n")
            sys.stderr.write(f"📝 request.form: {dict(request.form)}\n")
            sys.stderr.write(f"🔢 request.is_json: {request.is_json}\n")
            sys.stderr.flush()
            return jsonify({'error': 'No file or text provided'}), 400
        
        import sys
        sys.stderr.write(f"✅ Extracted text length: {len(text)} characters\n")
        sys.stderr.write(f"📄 Text preview (first 300 chars): {text[:300]}\n")
        sys.stderr.flush()
        
        if not text or len(text.strip()) < 10:
            import sys
            sys.stderr.write(f"❌ TEXT TOO SHORT ERROR\n")
            sys.stderr.write(f"📏 Text length: {len(text)} chars\n")
            sys.stderr.write(f"📏 Stripped length: {len(text.strip())} chars\n")
            sys.stderr.flush()
            return jsonify({'error': f'Text extraction failed or text too short ({len(text)} characters extracted). Minimum 10 characters required.'}), 400
        
        # Generate cards
        cards = generate_cards_with_ai(text, num_cards)
        
        print(f"="*60)
        print(f"GENERATED: {len(cards)} cards (requested: {num_cards})")
        print(f"="*60)
        
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
    print('📸 OCR Support: Enabled (Handwritten notes supported)')
    print(f'\n{"=" * 60}\n')
    
    app.run(host='0.0.0.0', port=5001, debug=True)
