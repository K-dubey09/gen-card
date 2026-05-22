#!/usr/bin/env bash
set -euo pipefail

# Starts backend, frontend and ai-service concurrently and writes logs to scripts/logs
# Usage: ./scripts/start-all.sh

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$BASE_DIR/scripts/logs"
mkdir -p "$LOG_DIR"

echo "Starting backend..."
(cd "$BASE_DIR/backend" && nohup bash -lc 'npx prisma generate && npx prisma migrate deploy && npm run dev' > "$LOG_DIR/backend.log" 2>&1 & echo $! > "$LOG_DIR/backend.pid")
sleep 1

echo "Starting frontend..."
(cd "$BASE_DIR/frontend" && nohup npm run dev > "$LOG_DIR/frontend.log" 2>&1 & echo $! > "$LOG_DIR/frontend.pid")
sleep 1

echo "Starting ai-service..."
(
  cd "$BASE_DIR/ai-service"
  if [ -f "venv/bin/activate" ]; then
    nohup bash -lc 'source venv/bin/activate && python app.py' > "$LOG_DIR/ai-service.log" 2>&1 & echo $! > "$LOG_DIR/ai-service.pid"
  else
    nohup python app.py > "$LOG_DIR/ai-service.log" 2>&1 & echo $! > "$LOG_DIR/ai-service.pid"
  fi
)

echo "Started all services. Logs:"
echo "  Backend: $LOG_DIR/backend.log (pid: $(cat "$LOG_DIR/backend.pid" 2>/dev/null || echo 'N/A'))"
echo "  Frontend: $LOG_DIR/frontend.log (pid: $(cat "$LOG_DIR/frontend.pid" 2>/dev/null || echo 'N/A'))"
echo "  AI Service: $LOG_DIR/ai-service.log (pid: $(cat "$LOG_DIR/ai-service.pid" 2>/dev/null || echo 'N/A'))"

echo "To stop a service: kill \\$(cat $LOG_DIR/backend.pid)"
