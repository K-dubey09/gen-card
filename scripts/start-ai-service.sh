#!/usr/bin/env bash
set -euo pipefail

# Starts the Python ai-service inside its virtualenv if present
# Usage: ./scripts/start-ai-service.sh

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$BASE_DIR/ai-service"

echo "Starting ai-service in $PWD"

if [ -f "venv/bin/activate" ]; then
  # Activate virtualenv if it exists
  # shellcheck disable=SC1091
  source venv/bin/activate
  echo "Activated venv"
fi

python app.py
