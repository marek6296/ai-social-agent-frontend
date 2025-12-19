import dotenv from 'dotenv';
import { loadBotsFromDatabase, initializeBot, shutdownBot, getAllBotInstances } from './botManager';

dotenv.config();

let isShuttingDown = false;
let refreshInterval: NodeJS.Timeout | null = null;

async function startService() {
  console.log('🚀 Starting Telegram Bot Service...');
  console.log('=====================================');

  // Validate environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL');
    process.exit(1);
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  Missing OPENAI_API_KEY - AI responses will not work');
  }

  // Load and initialize bots
  await loadAndInitializeBots();

  // Set up periodic refresh (every 30 seconds)
  refreshInterval = setInterval(async () => {
    if (!isShuttingDown) {
      console.log('🔄 Refreshing bots from database...');
      await loadAndInitializeBots();
    }
  }, 30000);

  console.log('✅ Telegram Bot Service is running!');
  console.log('   Press Ctrl+C to stop');
}

async function loadAndInitializeBots() {
  try {
    const bots = await loadBotsFromDatabase();
    console.log(`📦 Loaded ${bots.length} active bot(s) from database`);

    for (const bot of bots) {
      const instance = getAllBotInstances().find(i => i.bot.id === bot.id);
      
      if (instance && instance.isConnected) {
        // Bot already initialized and connected, skip
        continue;
      }

      console.log(`🔧 Initializing bot: ${bot.bot_name} (${bot.id})`);
      await initializeBot(bot);
    }

    // Shutdown bots that are no longer active
    const activeBotIds = new Set(bots.map(b => b.id));
    const allInstances = getAllBotInstances();
    
    for (const instance of allInstances) {
      if (!activeBotIds.has(instance.bot.id)) {
        console.log(`🛑 Shutting down inactive bot: ${instance.bot.bot_name} (${instance.bot.id})`);
        await shutdownBot(instance.bot.id);
      }
    }
  } catch (error) {
    console.error('❌ Error in loadAndInitializeBots:', error);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  await gracefulShutdown();
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  await gracefulShutdown();
});

async function gracefulShutdown() {
  isShuttingDown = true;

  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }

  const instances = getAllBotInstances();
  console.log(`🛑 Shutting down ${instances.length} bot instance(s)...`);

  for (const instance of instances) {
    await shutdownBot(instance.bot.id);
  }

  console.log('✅ Shutdown complete');
  process.exit(0);
}

// Start the service
startService().catch((error) => {
  console.error('❌ Fatal error starting service:', error);
  process.exit(1);
});

