# ai-service

This Flask microservice extracts text (from PDFs/images/text), builds a structured visual brief via Ollama, and returns generated images or an SVG fallback for study cards.

Run locally
```bash
cd ai-service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

Environment variables
- `OLLAMA_BASE_URL` — base URL for Ollama (e.g. `http://localhost:11434`)
- `OLLAMA_API_KEY` — API key if your Ollama deployment requires it
- `OLLAMA_TEXT_MODEL` — text/chat model name
- `OLLAMA_IMAGE_MODEL` — image/creative model name
- `OLLAMA_VISION_MODEL` — vision/OCR model name

Endpoints
- `POST /generate-cards` — Accepts a multipart `file` upload or JSON `{ "text": "...", "num_cards": 5 }`. Returns `cards` array; each card includes `imageUrl` (data URI or image URL) and `fallbackImageUrl`.
- `POST /generate-roadmap` — Accepts roadmap JSON and returns phases with `imageUrl` fields.

Testing examples
Generate cards from text:
```bash
curl -X POST http://localhost:5001/generate-cards \
  -H 'Content-Type: application/json' \
  -d '{"text":"Photosynthesis summary: light reactions and Calvin cycle","num_cards":3}' | jq
```

Upload a PDF (multipart form):
```bash
curl -X POST http://localhost:5001/generate-cards \
  -F file=@notes.pdf \
  -F num_cards=6
```

Notes
- The service prefers Ollama for both text and vision. If Ollama is unavailable, the service still produces a readable SVG mind-map fallback (`data:image/svg+xml;utf8,...`).
- The visual brief returned by Ollama contains `central` and `branches` (each branch has `label` and `nodes`) which are rendered as branch circles with child captions in the SVG fallback.
