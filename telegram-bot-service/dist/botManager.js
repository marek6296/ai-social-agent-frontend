"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadBotsFromDatabase = loadBotsFromDatabase;
exports.initializeBot = initializeBot;
exports.shutdownBot = shutdownBot;
exports.getAllBotInstances = getAllBotInstances;
exports.getBotInstance = getBotInstance;
const telegraf_1 = require("telegraf");
const supabase_1 = require("./supabase");
const encryption_1 = require("./encryption");
const messageHandler_1 = require("./messageHandler");
const commandHandler_1 = require("./commandHandler");
const botInstances = new Map();
// Track initialization attempts to prevent concurrent initializations
const initializingBots = new Set();
async function loadBotsFromDatabase() {
    try {
        // Load active bots
        const { data: bots, error } = await supabase_1.supabase
            .from('telegram_bots')
            .select('*')
            .eq('status', 'active');
        if (error) {
            console.error('Error loading bots from database:', error);
            return [];
        }
        return (bots || []);
    }
    catch (error) {
        console.error('Unexpected error loading bots:', error);
        return [];
    }
}
async function updateBotStatus(botId, status) {
    try {
        await supabase_1.supabase
            .from('telegram_bots')
            .update({ status })
            .eq('id', botId);
    }
    catch (error) {
        console.error(`Error updating bot status for ${botId}:`, error);
    }
}
async function updateConnectionStatus(botId, status) {
    try {
        await supabase_1.supabase
            .from('telegram_bots')
            .update({ connection_status: status })
            .eq('id', botId);
    }
    catch (error) {
        console.error(`Error updating connection status for ${botId}:`, error);
    }
}
async function initializeBot(botData) {
    // Prevent concurrent initializations
    if (initializingBots.has(botData.id)) {
        console.log(`⚠️ Bot ${botData.bot_name} (${botData.id}) is already being initialized, skipping duplicate`);
        return false;
    }
    initializingBots.add(botData.id);
    try {
        // If bot already exists and is connected, skip
        if (botInstances.has(botData.id)) {
            const instance = botInstances.get(botData.id);
            if (instance.isConnected && instance.isInitialized) {
                console.log(`✅ Bot ${botData.bot_name} (${botData.id}) already connected and ready`);
                initializingBots.delete(botData.id);
                return true;
            }
            // Stop old instance if it exists but isn't connected
            if (instance.isConnected) {
                try {
                    console.log(`Stopping old bot instance for ${botData.bot_name} (${botData.id})`);
                    // Telegraf doesn't have a destroy method, but we can stop polling
                    // The instance will be replaced
                }
                catch (error) {
                    console.error(`Error stopping old bot for ${botData.bot_name}:`, error);
                }
            }
            botInstances.delete(botData.id);
        }
        // Decrypt token
        let decryptedToken = (0, encryption_1.decryptToken)(botData.bot_token || '');
        if (!decryptedToken || decryptedToken.trim() === '') {
            console.error(`❌ Invalid or empty token for bot ${botData.bot_name} (${botData.id})`);
            await updateBotStatus(botData.id, 'error');
            await updateConnectionStatus(botData.id, 'error');
            initializingBots.delete(botData.id);
            return false;
        }
        // Check if token looks like a Telegram bot token (format: 123456789:ABCdef...)
        const looksValid = /^[0-9]+:[A-Za-z0-9_-]+$/.test(decryptedToken);
        if (!looksValid) {
            console.error(`❌ Token for bot ${botData.bot_name} (${botData.id}) does not look like a valid Telegram bot token`);
            await updateBotStatus(botData.id, 'error');
            await updateConnectionStatus(botData.id, 'error');
            initializingBots.delete(botData.id);
            return false;
        }
        // Create Telegraf instance
        const bot = new telegraf_1.Telegraf(decryptedToken);
        // Set up error handlers
        bot.catch((err, ctx) => {
            console.error(`❌ Error in bot ${botData.bot_name}:`, err);
            console.error(`   Update:`, ctx.update);
        });
        // Set up message handler
        bot.on('text', async (ctx) => {
            try {
                await (0, messageHandler_1.processMessage)(ctx, botData, bot);
            }
            catch (error) {
                console.error(`Error processing message for bot ${botData.bot_name}:`, error);
            }
        });
        // Set up command handler (handles /start, /help, and custom commands)
        bot.command(/.*/, async (ctx) => {
            try {
                await (0, commandHandler_1.processCommand)(ctx, botData, bot);
            }
            catch (error) {
                console.error(`Error processing command for bot ${botData.bot_name}:`, error);
            }
        });
        // Start bot using long polling
        try {
            if (botData.long_polling_enabled) {
                console.log(`🚀 Starting long polling for bot ${botData.bot_name} (${botData.id})...`);
                bot.launch();
                console.log(`✅ Bot ${botData.bot_name} (${botData.id}) is online!`);
                await updateBotStatus(botData.id, 'active');
                await updateConnectionStatus(botData.id, 'connected');
                // Store instance
                botInstances.set(botData.id, {
                    bot: botData,
                    isConnected: true,
                    isInitialized: true,
                });
            }
            else {
                console.log(`⚠️ Bot ${botData.bot_name} (${botData.id}) has long polling disabled`);
                await updateConnectionStatus(botData.id, 'disconnected');
            }
        }
        catch (error) {
            console.error(`❌ Failed to start bot ${botData.bot_name} (${botData.id}):`, error.message);
            await updateBotStatus(botData.id, 'error');
            await updateConnectionStatus(botData.id, 'error');
            initializingBots.delete(botData.id);
            return false;
        }
        initializingBots.delete(botData.id);
        return true;
    }
    catch (error) {
        console.error(`❌ Error initializing bot ${botData.bot_name} (${botData.id}):`, error.message);
        await updateBotStatus(botData.id, 'error');
        await updateConnectionStatus(botData.id, 'error');
        initializingBots.delete(botData.id);
        return false;
    }
}
async function shutdownBot(botId) {
    const instance = botInstances.get(botId);
    if (instance) {
        console.log(`🛑 Shutting down bot ${instance.bot.bot_name} (${botId})...`);
        botInstances.delete(botId);
        // Note: Telegraf doesn't have a direct shutdown method, but the process will clean up on exit
    }
}
function getAllBotInstances() {
    return Array.from(botInstances.values());
}
function getBotInstance(botId) {
    return botInstances.get(botId);
}
//# sourceMappingURL=botManager.js.map