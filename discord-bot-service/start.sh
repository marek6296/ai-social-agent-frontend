#!/bin/bash

# Check if service is already running
if ps aux | grep -i "tsx.*src/index" | grep -v grep > /dev/null; then
  echo "❌ Discord Bot Service už beží!"
  echo ""
  echo "Bežiace procesy:"
  ps aux | grep -i "tsx.*src/index" | grep -v grep
  echo ""
  echo "Ak chceš spustiť novú inštanciu, najprv zastav existujúce procesy:"
  echo "  pkill -f 'tsx.*discord-bot-service'"
  exit 1
fi

echo "🚀 Spúšťam Discord Bot Service..."
cd "$(dirname "$0")"
tsx src/index.ts


