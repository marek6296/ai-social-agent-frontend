#!/bin/bash
# Script to check Discord bot service logs

echo "🔍 Kontrolujem Discord Bot Service logy..."
echo ""

# Check if service is running
if pgrep -f "tsx.*index.ts" > /dev/null; then
    echo "✅ Service beží"
    echo ""
    echo "Pozri sa do terminálu, kde beží 'npm run dev' pre logy"
    echo ""
    echo "Alebo skús reštartovať service v novom termináli:"
    echo "  cd discord-bot-service"
    echo "  npm run dev"
    echo ""
    echo "Mal by si vidieť:"
    echo "  🚀 Starting Discord Bot Service..."
    echo "  📋 Found X bot(s) in database, Y active"
    echo "  🔄 Attempting to login bot..."
    echo "  ✅ Bot is online! (ak sa pripojil)"
    echo "  ❌ Failed to login bot... (ak sa nepripojil)"
else
    echo "❌ Service NEBEŽÍ"
    echo ""
    echo "Spusti service:"
    echo "  cd discord-bot-service"
    echo "  npm run dev"
fi


