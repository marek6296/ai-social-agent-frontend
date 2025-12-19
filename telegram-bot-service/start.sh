#!/bin/bash

# Telegram Bot Service Startup Script

# Check if another instance is running
if pgrep -f "telegram-bot-service" > /dev/null; then
    echo "⚠️  Another instance of Telegram Bot Service is already running!"
    echo "   Please stop it first before starting a new instance."
    exit 1
fi

# Change to the service directory
cd "$(dirname "$0")"

# Build the service
echo "🔨 Building Telegram Bot Service..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

# Start the service
echo "🚀 Starting Telegram Bot Service..."
node dist/index.js

