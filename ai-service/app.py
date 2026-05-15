from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import PyPDF2
import json
import requests
import base64
import io
import html
from dotenv import load_dotenv
import pypdfium2 as pdfium
from urllib.parse import quote

load_dotenv()

app = Flask(__name__)
CORS(app, origins=['http://localhost:5000'])

# Ollama configuration
OLLAMA_BASE_URL = os.getenv('OLLAMA_BASE_URL', 'https://ollama.com/api').rstrip('/')
OLLAMA_API_KEY = os.getenv('OLLAMA_API_KEY', '').strip()
OLLAMA_TEXT_MODEL = os.getenv('OLLAMA_TEXT_MODEL', 'gpt-oss:120b')
OLLAMA_VISION_MODEL = os.getenv('OLLAMA_VISION_MODEL', 'qwen2.5-vl:72b-instruct')
OLLAMA_IMAGE_MODEL = os.getenv('OLLAMA_IMAGE_MODEL', OLLAMA_TEXT_MODEL)
OLLAMA_TIMEOUT = int(os.getenv('OLLAMA_TIMEOUT', '300'))


def ollama_headers():
    headers = {'Content-Type': 'application/json'}
    if OLLAMA_API_KEY:
        headers['Authorization'] = f'Bearer {OLLAMA_API_KEY}'
    return headers


def clean_json_response(text):
    result = text.strip()
    if result.startswith('```json'):
        result = result[7:]
    if result.startswith('```'):
        result = result[3:]
    if result.endswith('```'):
        result = result[:-3]
    return result.strip()


def extract_json_from_text(text):
    cleaned = clean_json_response(text)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        import re
        match = re.search(r'\{[\s\S]*\}', cleaned)
        if match:
            return json.loads(match.group(0))
        raise


def ollama_chat(messages, model=OLLAMA_TEXT_MODEL, temperature=0.5, num_predict=8192):
    payload = {
        'model': model,
        'messages': messages,
        'stream': False,
        'options': {
            'temperature': temperature,
            'num_predict': num_predict
        }
    }

    response = requests.post(
        f'{OLLAMA_BASE_URL}/chat',
        headers=ollama_headers(),
        json=payload,
        timeout=OLLAMA_TIMEOUT
    )
    response.raise_for_status()
    data = response.json()

    message = data.get('message', {})
    content = message.get('content', '')
    if not content:
        raise Exception(f'Ollama returned an empty response: {data}')
    return content


def ollama_extract_text_from_image_bytes(image_bytes, prompt, model=OLLAMA_VISION_MODEL):
    payload = {
        'model': model,
        'messages': [
            {
                'role': 'user',
                'content': prompt,
                'images': [base64.b64encode(image_bytes).decode('utf-8')]
            }
        ],
        'stream': False,
        'options': {
            'temperature': 0.0,
            'num_predict': 4096
        }
    }

    response = requests.post(
        f'{OLLAMA_BASE_URL}/chat',
        headers=ollama_headers(),
        json=payload,
        timeout=OLLAMA_TIMEOUT
    )
    response.raise_for_status()
    data = response.json()
    message = data.get('message', {})
    content = message.get('content', '')
    if not content:
        raise Exception(f'Ollama vision model returned an empty response: {data}')
    return content

# Image generation configuration
# Build readable SVG infographics from Ollama-generated visual briefs.
def _wrap_text_lines(text, max_chars=44, max_lines=4):
    words = (text or '').split()
    lines = []
    current = []

    for word in words:
        candidate = ' '.join(current + [word]).strip()
        if len(candidate) <= max_chars:
            current.append(word)
        else:
            if current:
                lines.append(' '.join(current))
            current = [word]
            if len(lines) >= max_lines:
                break

    if current and len(lines) < max_lines:
        lines.append(' '.join(current))

    return lines


def _build_card_svg_fallback(card_data):
    title = html.escape((card_data.get('title') or 'Study Card')[:180])
    category = html.escape((card_data.get('category') or 'Learning Topic')[:80])
    summary = (card_data.get('summary') or card_data.get('content') or '')[:420]
    key_points = card_data.get('keyPoints') or []

    if not key_points:
        key_points = _wrap_text_lines(summary, max_chars=60, max_lines=3)
    else:
        key_points = [str(kp)[:120] for kp in key_points[:4]]

    title_lines = _wrap_text_lines(title, max_chars=34, max_lines=3)
    summary_lines = _wrap_text_lines(summary, max_chars=56, max_lines=5)

    bullet_rows = []
    y = 375
    for kp in key_points:
        kp_lines = _wrap_text_lines(kp, max_chars=52, max_lines=2)
        for i, line in enumerate(kp_lines):
            prefix = '• ' if i == 0 else '  '
            bullet_rows.append(
                f"<text x='52' y='{y}' font-size='21' fill='#E8ECFF'>{html.escape(prefix + line)}</text>"
            )
            y += 28
            if y > 560:
                break
        if y > 560:
            break

    title_svg = ''.join(
        f"<text x='50' y='{110 + idx * 40}' font-size='34' font-weight='700' fill='#FFFFFF'>{html.escape(line)}</text>"
        for idx, line in enumerate(title_lines)
    )
    summary_svg = ''.join(
        f"<text x='52' y='{270 + idx * 28}' font-size='21' fill='#DCE4FF'>{html.escape(line)}</text>"
        for idx, line in enumerate(summary_lines)
    )
    bullets_svg = ''.join(bullet_rows)

    svg = f"""
<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'>
  <defs>
    <linearGradient id='bg' x1='0%' y1='0%' x2='100%' y2='100%'>
      <stop offset='0%' stop-color='#1E3A8A'/>
      <stop offset='50%' stop-color='#2563EB'/>
      <stop offset='100%' stop-color='#0EA5E9'/>
    </linearGradient>
  </defs>
  <rect width='800' height='600' fill='url(#bg)'/>
  <rect x='34' y='32' width='732' height='536' rx='24' fill='rgba(9, 16, 44, 0.55)' stroke='rgba(255,255,255,0.25)' stroke-width='2'/>
  <text x='50' y='66' font-size='19' font-weight='700' fill='#C7D2FE'>EXPLANATORY LEARNING CARD</text>
  <text x='570' y='66' font-size='18' fill='#BFDBFE'>Category: {category}</text>
  {title_svg}
  <line x1='50' y1='222' x2='748' y2='222' stroke='rgba(255,255,255,0.3)' stroke-width='2'/>
  {summary_svg}
  <text x='50' y='348' font-size='22' font-weight='700' fill='#F8FAFC'>Key learning points</text>
  {bullets_svg}
</svg>
""".strip()

    return f"data:image/svg+xml;utf8,{quote(svg)}"


def _generate_visual_brief_with_ollama(card_data):
    title = (card_data.get('title') or 'Study Card').strip()
    category = (card_data.get('category') or 'Learning Topic').strip()
    summary = (card_data.get('summary') or card_data.get('content') or '').strip()
    key_points = card_data.get('keyPoints') or []
    key_points_text = '\n'.join([f"- {str(kp)}" for kp in key_points[:6]])

    prompt = f"""Create a visual teaching brief for an educational infographic.

Topic title: {title}
Category: {category}
Summary:
{summary[:900]}

Key points:
{key_points_text if key_points_text else '- Generate key points from the summary'}

Return ONLY valid JSON:
{{
  "title": "short readable title (max 80 chars)",
  "category": "short category (max 30 chars)",
  "summary": "2-3 concise explanatory lines (max 240 chars)",
  "keyPoints": [
    "point 1",
    "point 2",
    "point 3",
    "point 4"
  ]
}}"""

    result = ollama_chat(
        [
            {
                "role": "system",
                "content": (
                    "You are an educational visual designer. "
                    "Return compact, concrete, student-friendly text that can be rendered into a readable infographic. "
                    "Output valid JSON only."
                )
            },
            {"role": "user", "content": prompt}
        ],
        model=OLLAMA_IMAGE_MODEL,
        temperature=0.35,
        num_predict=1400
    )

    brief = extract_json_from_text(result)
    clean_brief = {
        'title': str(brief.get('title') or title)[:180],
        'category': str(brief.get('category') or category)[:80],
        'summary': str(brief.get('summary') or summary)[:420],
        'keyPoints': brief.get('keyPoints') or key_points or []
    }

    if not isinstance(clean_brief['keyPoints'], list):
        clean_brief['keyPoints'] = [str(clean_brief['keyPoints'])]

    clean_brief['keyPoints'] = [str(point)[:120] for point in clean_brief['keyPoints'][:4]]
    return clean_brief


def generate_ai_image(card_data):
    """Generate readable, topic-specific infographic images using Ollama."""
    try:
        fallback_url = _build_card_svg_fallback(card_data)
        visual_brief = _generate_visual_brief_with_ollama(card_data)
        svg_image = _build_card_svg_fallback(visual_brief)
        print(f"Generated Ollama SVG infographic for: {visual_brief.get('title', 'card')}")
        return {'primary': svg_image, 'fallback': fallback_url}
        
    except Exception as e:
        print(f"Ollama image generation error: {e}")
        fallback_url = _build_card_svg_fallback(card_data)
        return {'primary': fallback_url, 'fallback': fallback_url}

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
        
        # If no text extracted (image-based PDF), use Ollama vision OCR
        if len(text.strip()) < 10:
            sys.stderr.write("🖼️  Text extraction yielded minimal content - PDF appears to be image-based\n")
            sys.stderr.write("🔍 Rendering PDF pages for Ollama OCR...\n")
            sys.stderr.flush()
            
            try:
                doc = pdfium.PdfDocument(file_path)
                images = []
                for page_index in range(min(len(doc), 10)):
                    page = doc.get_page(page_index)
                    bitmap = page.render(scale=2)
                    pil_image = bitmap.to_pil()
                    image_buffer = io.BytesIO()
                    pil_image.save(image_buffer, format='PNG')
                    images.append(image_buffer.getvalue())

                sys.stderr.write(f"✅ Rendered {len(images)} pages with PyMuPDF\n")
                sys.stderr.flush()
                
                text = ""
                for i, image_bytes in enumerate(images):
                    sys.stderr.write(f"🔍 Running OCR on page {i+1}/{len(images)}...\n")
                    sys.stderr.flush()
                    
                    page_text = ollama_extract_text_from_image_bytes(
                        image_bytes,
                        'Extract all readable text from this PDF page. Return plain text only and preserve headings, bullet points, and line breaks where possible.'
                    )
                    text += f"\n--- Page {i+1} ---\n{page_text}\n"
                    
                    if i == 0:
                        sys.stderr.write(f"📖 First page OCR extracted {len(page_text)} characters\n")
                        sys.stderr.write(f"Preview: {page_text[:200]}\n")
                        sys.stderr.flush()
                
                sys.stderr.write(f"✅ Total OCR extracted text length: {len(text.strip())} characters\n")
                sys.stderr.flush()
                
            except Exception as ocr_error:
                sys.stderr.write(f"❌ OCR extraction failed: {str(ocr_error)}\n")
                sys.stderr.write("📋 Ensure Ollama is running and the vision model is available.\n")
                sys.stderr.flush()
                raise Exception(f"Image-based PDF detected but OCR failed using Ollama vision. Error: {str(ocr_error)}")
            
    except Exception as e:
        import sys
        sys.stderr.write(f"❌ PDF extraction error: {str(e)}\n")
        sys.stderr.flush()
        raise Exception(f"PDF extraction failed: {str(e)}")
    return text

def extract_text_from_image(file_path):
    """Extract text from image using Ollama vision OCR (supports handwritten notes)"""
    text = ""
    try:
        with open(file_path, 'rb') as file:
            image_bytes = file.read()

        text = ollama_extract_text_from_image_bytes(
            image_bytes,
            'Extract all readable text from this image. Return plain text only, preserving line breaks and headings where possible.'
        )
        print(f"OCR extracted {len(text)} characters from image")
        
    except Exception as e:
        raise Exception(f"OCR extraction failed: {str(e)}. Make sure Ollama and the vision model are available.")
    
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
    """Generate study cards using Ollama - focus on quality from start of content"""
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
            result = ollama_chat(
                [
                    {"role": "system", "content": f"You are an expert educational content creator. CRITICAL: Return EXACTLY {cards_to_generate} cards. Create comprehensive, detailed learning cards with substantial text content (200-400 words) that students can READ and LEARN from. Include detailed explanations, examples, step-by-step breakdowns, formulas, and practical applications. Focus on educational depth and clarity. Return only valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                model=OLLAMA_TEXT_MODEL,
                temperature=0.5,
                num_predict=16000
            )
            result = clean_json_response(result)

            try:
                cards_data = extract_json_from_text(result)
            except json.JSONDecodeError as e:
                import sys
                sys.stderr.write(f"❌ JSON parsing error: {e}\n")
                sys.stderr.write(f"📄 Raw response preview (first 500 chars):\n{result[:500]}\n")
                sys.stderr.write(f"📄 Raw response end (last 500 chars):\n{result[-500:]}\n")
                sys.stderr.flush()
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
                        fallback_url = _build_card_svg_fallback(card)
                        return {'primary': fallback_url, 'fallback': fallback_url}
                
                # Use ThreadPoolExecutor for parallel image generation (max 8 concurrent for speed)
                sys.stderr.write(f"🚀 Starting parallel image generation for {len(new_cards)} cards...\n")
                sys.stderr.flush()
                
                with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
                    image_assets = list(executor.map(generate_image_for_card, enumerate(new_cards)))
                
                # Assign generated image URLs to cards
                for i, card in enumerate(new_cards):
                    card['imageUrl'] = image_assets[i]['primary']
                    card['fallbackImageUrl'] = image_assets[i]['fallback']
                
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

        result = ollama_chat(
            [
                {"role": "system", "content": "You are a creative educational experience designer who crafts inspiring, visual learning journeys. Use emojis, vivid language, and create memorable phase names. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            model=OLLAMA_TEXT_MODEL,
            temperature=0.8,
            num_predict=3000
        )
        roadmap_data = extract_json_from_text(result)
        
        # Generate roadmap phase images via Ollama visual briefs
        roadmap = roadmap_data.get('roadmap', {})
        if 'phases' in roadmap:
            for phase in roadmap['phases']:
                try:
                    phase_card_data = {
                        'title': phase.get('phaseName', 'Learning Phase'),
                        'category': f"Roadmap - {topic}",
                        'summary': phase.get('description', ''),
                        'keyPoints': (phase.get('learningObjectives') or [])[:3] + (phase.get('tips') or [])[:2]
                    }

                    phase_image = generate_ai_image(phase_card_data)
                    phase['imageUrl'] = phase_image['primary']
                    phase['fallbackImageUrl'] = phase_image['fallback']
                    print(f"Generated Ollama roadmap image for phase: {phase.get('phaseName', 'Phase')}")
                    
                except Exception as e:
                    print(f"Failed to generate phase image: {e}")
                    phase_card_data = {
                        'title': phase.get('phaseName', 'Learning Phase'),
                        'category': f"Roadmap - {topic}",
                        'summary': phase.get('description', ''),
                        'keyPoints': phase.get('learningObjectives', [])
                    }
                    fallback_url = _build_card_svg_fallback(phase_card_data)
                    phase['imageUrl'] = fallback_url
                    phase['fallbackImageUrl'] = fallback_url
        
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
    print(f'🧠 Ollama text model: {OLLAMA_TEXT_MODEL}')
    print(f'🎨 Ollama image model: {OLLAMA_IMAGE_MODEL}')
    print(f'👁️  Ollama vision model: {OLLAMA_VISION_MODEL}')
    print('📸 OCR Support: Enabled via Ollama vision')
    print(f'\n{"=" * 60}\n')
    
    app.run(host='0.0.0.0', port=5001, debug=True)
