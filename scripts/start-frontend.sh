#!/usr/bin/env bash
set -euo pipefail

# Starts the frontend (Vite dev server)
# Usage: ./scripts/start-frontend.sh

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$BASE_DIR/frontend"

echo "Starting frontend in $PWD"
npm run dev
