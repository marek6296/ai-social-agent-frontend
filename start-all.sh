#!/bin/bash

# Script to start both Next.js app and Discord Bot Service

echo "🚀 Spúšťam Next.js aplikáciu a Discord Bot Service..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "discord-bot-service" ]; then
    echo "❌ Chyba: Musíš byť v hlavnom adresári projektu"
    echo "   cd /Users/marek/ai-social-agent-frontend"
    exit 1
fi

# Start Next.js app in background
echo "📱 Spúšťam Next.js aplikáciu na pozadí..."
npm run dev > /tmp/nextjs.log 2>&1 &
NEXTJS_PID=$!

# Wait a moment for Next.js to start
sleep 3

# Start Discord Bot Service (foreground)
echo "🤖 Spúšťam Discord Bot Service..."
echo ""
cd discord-bot-service
npm run dev

# When Discord Bot Service stops, also stop Next.js
echo ""
echo "🛑 Zastavujem Next.js aplikáciu..."
kill $NEXTJS_PID 2>/dev/null


