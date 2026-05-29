# Project Card Maker

A study-card generator and viewer that extracts text (from files or text input), generates explanatory study cards, and produces creative mind-map style images for each card using Ollama. Includes a robust SVG fallback renderer when an image model isn't available.

Services
- `ai-service` — Python Flask microservice (port 5001) that extracts text, builds visual briefs via Ollama, and returns `imageUrl` (data URI SVG or generated image) for each card.
- `backend` — Node/Express API and database (Postgres + Prisma) for storing cards, users, and blobs.
- `frontend` — React (Vite) SPA that shows cards, opens fullscreen mind-map viewer, and persists PASETO auth tokens.

Quick start
1. Configure environment variables (see `ai-service/README.md` and `backend/.env.example` for guidance).
2. Start services (scripts provided):
```bash
./scripts/start-ai-service.sh
./scripts/start-backend.sh
./scripts/start-frontend.sh
# or run all together
./scripts/start-all.sh
```

AI image generation notes
- The `ai-service` requests a structured visual brief from Ollama including `central`, `branches` (`label` and `nodes`), `tagline`, `subtitle`, `callout`, and `summary`.
- If Ollama omits fields, the service normalizes and falls back to a built SVG mind-map (`data:image/svg+xml;utf8,...`).

Testing the AI endpoint (quick)
```bash
curl -s -X POST http://localhost:5001/generate-cards \
  -H 'Content-Type: application/json' \
  -d '{"text":"Photosynthesis overview: light reactions and Calvin cycle","num_cards":4}' | jq
```

Where the response contains `cards` with `imageUrl` (primary) and `fallbackImageUrl`.

Development notes
- Ollama: set `OLLAMA_BASE_URL`, `OLLAMA_API_KEY` (if applicable), `OLLAMA_IMAGE_MODEL`, `OLLAMA_TEXT_MODEL`, `OLLAMA_VISION_MODEL` in `ai-service/.env` or your environment.
- Storage: configure `STORAGE_BACKEND=filesystem` or `db` in backend `.env` to control where blobs are stored.
- Auth: uses PASETO tokens. See `backend/utils/pasetoAuth.js` and the backend `auth` routes for configuring admin/unlimited tokens.

Where to find more
- `ai-service/README.md` — detailed ai-service docs and test commands.
- `docs/IMAGE_GUIDE.md` — details on the mind-map JSON fields and how the SVG fallback is structured.

If you want, I can run the AI pipeline end-to-end now and post sample output images. Which would you prefer?
