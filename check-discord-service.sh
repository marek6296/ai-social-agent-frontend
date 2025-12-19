#!/bin/bash
cd discord-bot-service
echo "🔍 Kontrolujem Discord Bot Service..."
echo ""

# Check if service is running
if pgrep -f "tsx.*index.ts" > /dev/null; then
    echo "✅ Service beží"
    echo ""
    echo "Posledné logy (ak existujú):"
    echo "---"
    # Try to get output from running process (this might not work perfectly)
    ps aux | grep "tsx.*index" | grep -v grep | head -2
else
    echo "❌ Service NEBEŽÍ"
    echo ""
    echo "Spusti service pomocou:"
    echo "  cd discord-bot-service"
    echo "  npm run dev"
fi
