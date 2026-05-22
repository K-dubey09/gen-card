#!/usr/bin/env bash
set -euo pipefail

# Starts the Node.js backend (development)
# Usage: ./scripts/start-backend.sh

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$BASE_DIR/backend"

echo "Starting backend in $PWD"
npx prisma generate
npx prisma migrate deploy
npm run dev
