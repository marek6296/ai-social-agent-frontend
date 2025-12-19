import dotenv from 'dotenv';
import { loadBotsFromDatabase, initializeBot, shutdownBot, getAllBotInstances } from './botManager';
import { acquireLock } from './singleton';
import { processScheduledFlows, cleanupScheduledExecutions } from './scheduledFlows';

dotenv.config();

// Check if another instance is already running
if (!acquireLock()) {
  console.error('❌ Cannot start: Another instance is already running!');
  process.exit(1);
}

let isShuttingDown = false;
let refreshInterval: NodeJS.Timeout | null = null;

async function startService() {
  console.log('🚀 Starting Discord Bot Service...');
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

  if (!process.env.DISCORD_BOT_TOKEN_ENCRYPTION_KEY) {
    console.warn('⚠️  Missing DISCORD_BOT_TOKEN_ENCRYPTION_KEY - tokens must be plain text');
  }

  // Load and initialize bots
  await loadAndInitializeBots();

  // Set up periodic refresh (every 30 seconds for faster detection during development)
  refreshInterval = setInterval(async () => {
    if (!isShuttingDown) {
      console.log('🔄 Refreshing bots from database...');
      await loadAndInitializeBots();
      
      // Process scheduled flows for all active bots
      const instances = getAllBotInstances();
      for (const instance of instances) {
        if (instance.isConnected && instance.client && instance.client.isReady()) {
          await processScheduledFlows(instance.client, instance.bot.id);
        }
      }
      
      // Clean up old scheduled execution records
      cleanupScheduledExecutions();
    }
  }, 30 * 1000); // 30 seconds for faster testing - handles both time-based and interval-based flows

  // Handle graceful shutdown
  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);

  console.log('✅ Discord Bot Service is running!');
  console.log('   Press Ctrl+C to stop');
}

async function loadAndInitializeBots() {
  try {
    const bots = await loadBotsFromDatabase();
    const activeBots = bots.filter(bot => bot.status === 'active');
    console.log(`📋 Found ${bots.length} bot(s) in database, ${activeBots.length} active`);

    // Get currently running bots
    const { getAllBotInstances } = await import('./botManager');
    const runningInstances = getAllBotInstances();
    const runningBotIds = new Set(runningInstances.map(inst => inst.bot.id));

    // Initialize active bots that aren't running
    for (const bot of activeBots) {
      if (!runningBotIds.has(bot.id)) {
        try {
          const success = await initializeBot(bot);
          if (success) {
            console.log(`✅ Initialized bot: ${bot.bot_name} (${bot.id})`);
          } else {
            console.log(`❌ Failed to initialize bot: ${bot.bot_name} (${bot.id})`);
          }
        } catch (error) {
          console.error(`Error initializing bot ${bot.bot_name}:`, error);
        }
      }
    }

    // Shutdown inactive bots that are running
    for (const instance of runningInstances) {
      const bot = bots.find(b => b.id === instance.bot.id);
      if (!bot || bot.status !== 'active') {
        console.log(`🛑 Shutting down inactive bot: ${instance.bot.bot_name} (${instance.bot.id})`);
        await shutdownBot(instance.bot.id);
      }
    }
  } catch (error) {
    console.error('Error loading bots:', error);
  }
}

async function gracefulShutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log('\n🛑 Shutting down Discord Bot Service...');

  if (refreshInterval) {
    clearInterval(refreshInterval);
  }

  // Shutdown all bots
  const { getAllBotInstances } = await import('./botManager');
  const instances = getAllBotInstances();
  
  for (const instance of instances) {
    await shutdownBot(instance.bot.id);
  }

  console.log('✅ Shutdown complete');
  process.exit(0);
}

// Start the service
startService().catch((error) => {
  console.error('Fatal error starting service:', error);
  process.exit(1);
});

