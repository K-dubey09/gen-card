Scripts to start services for development.

Files:
- start-backend.sh — start Node backend (npm run dev)
- start-frontend.sh — start Vite frontend (npm run dev)
- start-ai-service.sh — start Python ai-service (activates ai-service/venv if present)
- start-all.sh — start all three in background, write logs to scripts/logs and pid files

Make scripts executable:

  chmod +x scripts/*.sh

Then run:

  ./scripts/start-backend.sh
  ./scripts/start-frontend.sh
  ./scripts/start-ai-service.sh

Or start everything in background:

  ./scripts/start-all.sh
