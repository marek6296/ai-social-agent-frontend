"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processMessage = processMessage;
const supabase_1 = require("./supabase");
const aiClient_1 = require("./aiClient");
// Track processed messages to prevent duplicates
const processedMessages = new Set();
const MESSAGE_DEBOUNCE_MS = 2000; // 2 seconds
// Track last response time per chat for cooldown
const lastResponseTime = new Map(); // chatId -> timestamp
async function processMessage(ctx, bot, telegraf) {
    if (!ctx.message || !('text' in ctx.message) || !ctx.chat) {
        return;
    }
    const message = ctx.message;
    const messageText = message.text;
    const chatId = String(ctx.chat.id);
    const userId = String(ctx.from?.id || '');
    const username = ctx.from?.username || '';
    // Skip if message is a command (handled by commandHandler)
    if (messageText.startsWith('/')) {
        return;
    }
    // Prevent duplicate processing
    const messageKey = `${chatId}-${userId}-${message.message_id}`;
    if (processedMessages.has(messageKey)) {
        return;
    }
    processedMessages.add(messageKey);
    // Clean up old entries
    if (processedMessages.size > 1000) {
        const firstEntry = processedMessages.values().next().value;
        if (firstEntry) {
            processedMessages.delete(firstEntry);
        }
    }
    // Check access mode
    if (bot.access_mode === 'whitelist' && bot.allowed_users && bot.allowed_users.length > 0) {
        const userIdStr = userId;
        const usernameStr = username ? `@${username}` : '';
        if (!bot.allowed_users.includes(userIdStr) && !bot.allowed_users.includes(usernameStr)) {
            return;
        }
    }
    // Check chat type
    const chatType = ctx.chat.type === 'private' ? 'private' :
        ctx.chat.type === 'group' || ctx.chat.type === 'supergroup' ? 'group' :
            'channel';
    if (!bot.allowed_chat_types.includes(chatType)) {
        return;
    }
    // Check if bot should respond only on mention (for groups)
    if (chatType !== 'private' && bot.respond_only_on_mention) {
        // Check if bot is mentioned via entities
        const isMentioned = ctx.message.entities?.some(e => e.type === 'mention' ||
            (e.type === 'text_mention' && e.user?.id === ctx.botInfo?.id)) || false;
        if (!isMentioned) {
            return;
        }
    }
    // Check cooldown
    const cooldownSeconds = bot.cooldown_seconds || 1;
    const lastResponse = lastResponseTime.get(chatId);
    const now = Date.now();
    if (lastResponse && (now - lastResponse) < cooldownSeconds * 1000) {
        return;
    }
    lastResponseTime.set(chatId, now);
    // Check anti-spam
    if (bot.anti_spam_enabled) {
        // TODO: Implement anti-spam logic (message limit per user)
    }
    // Check blocked keywords
    if (bot.blocked_keywords && bot.blocked_keywords.length > 0) {
        const lowerMessage = messageText.toLowerCase();
        if (bot.blocked_keywords.some(keyword => lowerMessage.includes(keyword.toLowerCase()))) {
            return;
        }
    }
    // Check blocked links
    if (bot.blocked_links && ctx.message.entities?.some(e => e.type === 'url')) {
        return;
    }
    console.log(`💬 Processing message from user ${userId} in chat ${chatId}: ${messageText.substring(0, 50)}...`);
    // Handle response based on mode
    if (bot.response_mode === 'rules') {
        // Rules mode: only respond to commands or specific triggers
        // For now, just log the message
        console.log(`📝 Rules mode: message logged but not responding`);
    }
    else if (bot.response_mode === 'ai') {
        // AI mode: generate AI response
        try {
            const aiResponse = await (0, aiClient_1.generateAIResponse)(messageText, bot, userId, chatId);
            if (aiResponse) {
                // Add response delay if configured
                if (bot.response_delay_ms > 0) {
                    await new Promise(resolve => setTimeout(resolve, bot.response_delay_ms));
                }
                await ctx.reply(aiResponse);
                lastResponseTime.set(chatId, Date.now());
            }
        }
        catch (error) {
            console.error(`Error generating AI response:`, error);
            if (bot.fallback_message) {
                await ctx.reply(bot.fallback_message);
            }
        }
    }
    // Log message
    try {
        await supabase_1.supabase
            .from('telegram_bot_logs')
            .insert({
            bot_id: bot.id,
            event_type: 'message',
            user_id: userId,
            username: username,
            chat_id: chatId,
            chat_type: chatType,
            message_text: messageText,
            status: 'success',
        });
        // Update bot statistics
        await supabase_1.supabase
            .from('telegram_bots')
            .update({
            total_messages: (bot.total_messages || 0) + 1,
            messages_today: (bot.messages_today || 0) + 1,
            last_activity: new Date().toISOString(),
        })
            .eq('id', bot.id);
    }
    catch (error) {
        console.error('Error logging message:', error);
    }
}
async function getBotUsername(bot) {
    // Try to get bot username from Telegram API
    // For now, return empty string - this will be improved
    return '';
}
//# sourceMappingURL=messageHandler.js.map