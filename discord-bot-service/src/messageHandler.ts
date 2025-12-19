import { Message, TextChannel, ThreadChannel, Client } from 'discord.js';
import { DiscordBot } from './types';
import { generateAIResponse } from './aiClient';
import { supabase } from './supabase';
import { loadFlowsForBot, checkFlowTrigger, checkFlowConditions, executeFlowActions } from './flowProcessor';

const conversationHistory = new Map<string, Array<{ role: string; content: string }>>();
const MAX_HISTORY = 10;

// Track processed messages to prevent duplicate responses
const processedMessages = new Set<string>();

// Track sent replies to prevent duplicate sends
const sentReplies = new Map<string, number>(); // messageId -> timestamp
const REPLY_DEBOUNCE_MS = 5000; // 5 seconds

// Track last response time per channel for cooldown
const lastResponseTime = new Map<string, number>(); // channelId -> timestamp

// Track ongoing sends to prevent concurrent sends for the same message
const sendingMessages = new Set<string>(); // messageId -> in progress

// Track actual sent message IDs from Discord to prevent duplicates
const sentDiscordMessageIds = new Set<string>(); // Discord message ID -> to track actual sends

// Promise cache for sends - prevents duplicate sends by reusing the same promise
const sendingPromises = new Map<string, Promise<any>>(); // messageId -> Promise<Message>

export async function processMessage(
  message: Message,
  bot: DiscordBot,
  client: Client
): Promise<void> {
  // CRITICAL: Check and mark as processed IMMEDIATELY (synchronously, before any async operations)
  // This must be done BEFORE any async operations to prevent race conditions
  const messageKey = `${message.id}-${bot.id}`;
  if (processedMessages.has(messageKey)) {
    console.log(`⚠️ processMessage duplicate prevented for message ${message.id} (already in processedMessages)`);
    return;
  }
  
  // Mark as processed IMMEDIATELY (synchronously) to prevent race conditions
  processedMessages.add(messageKey);
  
  // Clean up old processed messages (keep only last 1000)
  if (processedMessages.size > 1000) {
    const firstEntry = processedMessages.values().next().value;
    if (firstEntry) {
      processedMessages.delete(firstEntry);
    }
  }

  try {

    // Check if auto reply is enabled
    if (bot.auto_reply_enabled === false) {
      return;
    }

    // Ignore if message is in ignored channel
    if (bot.ignored_channels && bot.ignored_channels.includes(message.channel.id)) {
      return;
    }

    // Check if message is in allowed channel (if specified)
    if (bot.allowed_channels && bot.allowed_channels.length > 0) {
      if (!bot.allowed_channels.includes(message.channel.id)) {
        return;
      }
    }

    // FIRST: Check flows (they have priority over basic settings)
    const flows = await loadFlowsForBot(bot.id);
    console.log(`🔍 Checking ${flows.length} flows for message ${message.id}`);
    
    let flowMatched = false;
    
    for (const flow of flows) {
      // Determine trigger type
      const isMentioned = message.mentions.has(client.user!);
      const triggerType = isMentioned ? 'mention' : 'new_message';
      
      console.log(`  Checking flow "${flow.name}" (trigger: ${flow.trigger_type}, type: ${triggerType})`);
      
      // Check if trigger matches
      if (!checkFlowTrigger(flow, message, triggerType)) {
        console.log(`    ❌ Trigger does not match`);
        continue;
      }
      
      // Check conditions
      const member = message.member || (await message.guild?.members.fetch(message.author.id));
      if (!checkFlowConditions(flow, message, member || undefined)) {
        console.log(`    ❌ Conditions do not match`);
        continue;
      }
      
      // Execute flow actions
      console.log(`✅ Flow "${flow.name}" matched for message ${message.id}`);
      flowMatched = true;
      await executeFlowActions(flow, message, client, member || undefined);
      
      // Only execute first matching flow (sorted by priority)
      break;
    }

    // If flow matched, skip basic AI response
    if (flowMatched) {
      return;
    }

    // Check if we should respond
    let shouldRespond = false;

    // Check if bot is mentioned
    const isMentioned = message.mentions.has(client.user!);
    
    // Debug logging
    console.log(`🔍 Response check for message ${message.id}:`, {
      isMentioned,
      respond_to_mentions: bot.respond_to_mentions,
      respond_to_all_messages: bot.respond_to_all_messages,
      auto_reply_enabled: bot.auto_reply_enabled,
    });
    
    if (isMentioned && bot.respond_to_mentions !== false) {
      shouldRespond = true;
      console.log(`✅ Should respond: mentioned and respond_to_mentions enabled`);
    }

    // Check if we should respond to all messages (ONLY if not already mentioned)
    if (!isMentioned && bot.respond_to_all_messages === true) {
      shouldRespond = true;
      console.log(`✅ Should respond: respond_to_all_messages enabled`);
    }

    // Check if message is in thread
    const isInThread = message.channel instanceof ThreadChannel;
    if (isInThread && bot.respond_in_threads === false) {
      shouldRespond = false;
    }

    if (!shouldRespond) {
      return;
    }

    // Check message cooldown (per channel)
    const cooldownSeconds = bot.message_cooldown_seconds || 5;
    const channelId = message.channel.id;
    const lastResponse = lastResponseTime.get(channelId);
    const cooldownNow = Date.now();
    
    if (lastResponse && (cooldownNow - lastResponse) < (cooldownSeconds * 1000)) {
      const remainingSeconds = Math.ceil((cooldownSeconds * 1000 - (cooldownNow - lastResponse)) / 1000);
      console.log(`⏸️ Cooldown active for channel ${channelId}, ${remainingSeconds}s remaining`);
      return;
    }
    
    // Update last response time
    lastResponseTime.set(channelId, cooldownNow);
    
    // Clean up old entries (keep only last 100 channels)
    if (lastResponseTime.size > 100) {
      const firstEntry = lastResponseTime.keys().next().value;
      if (firstEntry) {
        lastResponseTime.delete(firstEntry);
      }
    }

    // Check if AI is enabled (response_mode === 'ai' or ai_enabled === true)
    const isAIEnabled = bot.response_mode === 'ai' || bot.ai_enabled === true;
    
    if (!isAIEnabled) {
      console.log(`⚠️ AI is disabled for bot ${bot.bot_name} (response_mode: ${bot.response_mode}, ai_enabled: ${bot.ai_enabled}). Skipping AI response.`);
      return;
    }

    // Get conversation history for this channel
    const historyKey = `${bot.id}-${message.channel.id}`;
    const history = conversationHistory.get(historyKey) || [];

    // Generate AI response
    console.log(`🔵 Calling generateAIResponse for message ${message.id}`);
    const reply = await generateAIResponse(message.content, bot, history, message.id);
    console.log(`🟢 Received AI response for message ${message.id}: ${reply ? reply.substring(0, 50) + '...' : 'null'}`);
    
    if (!reply) {
      console.error(`Failed to generate response for bot ${bot.bot_name}`);
      return;
    }

    // Update conversation history
    history.push(
      { role: 'user', content: message.content },
      { role: 'assistant', content: reply }
    );
    
    // Keep only last MAX_HISTORY messages
    if (history.length > MAX_HISTORY * 2) {
      history.splice(0, history.length - MAX_HISTORY * 2);
    }
    
    conversationHistory.set(historyKey, history);

    // CRITICAL: Final check before sending - prevent duplicate sends using Promise caching
    const sentReplyKey = `${message.id}-${bot.id}`;
    const now = Date.now();
    
    // Check if already sending (use Promise cache to prevent concurrent sends)
    if (sendingPromises.has(sentReplyKey)) {
      console.log(`⚠️ Send promise already exists for message ${message.id}, waiting for existing send...`);
      try {
        await sendingPromises.get(sentReplyKey);
        console.log(`✅ Existing send completed for message ${message.id}`);
      } catch (error) {
        console.error(`❌ Error in existing send for message ${message.id}:`, error);
      }
      return; // Return early - existing promise will handle the send
    }
    
    // Check if already sent recently (CRITICAL: check BEFORE marking as sending)
    const lastSentTime = sentReplies.get(sentReplyKey);
    if (lastSentTime && (now - lastSentTime) < REPLY_DEBOUNCE_MS) {
      console.log(`⚠️ Duplicate send prevented for message ${message.id} (sent ${now - lastSentTime}ms ago)`);
      return;
    }
    
    // CRITICAL: Mark as sending IMMEDIATELY and SYNCHRONOUSLY (before creating promise) to prevent race condition
    sentReplies.set(sentReplyKey, now);
    
    // CRITICAL: Also mark in sendingMessages Set (additional protection)
    if (sendingMessages.has(sentReplyKey)) {
      console.log(`⚠️ Message ${message.id} already marked as sending, skipping...`);
      return;
    }
    sendingMessages.add(sentReplyKey);
    
    // Send reply
    const channel = message.channel as TextChannel | ThreadChannel;
    
    let replyText = reply;
    if (bot.mention_in_reply === true) {
      replyText = `${message.author} ${reply}`;
    }

    console.log(`📤 Sending reply for message ${message.id} from bot ${bot.bot_name}`);
    console.log(`   Reply text length: ${replyText.length} chars`);
    console.log(`   Reply text preview: ${replyText.substring(0, 100)}...`);
    
    // Create promise for send operation
    const sendPromise = (async () => {
      try {
        const sendStartTime = Date.now();
        const sentMessage = await channel.send(replyText);
        const sendDuration = Date.now() - sendStartTime;
        const sentMessageId = sentMessage.id;
        
        console.log(`✅ Reply sent for message ${message.id}, Discord message ID: ${sentMessageId} (took ${sendDuration}ms)`);
        console.log(`   Sent message content: ${sentMessage.content.substring(0, 100)}...`);
        
        // Track the actual Discord message ID to detect duplicates
        if (sentDiscordMessageIds.has(sentMessageId)) {
          console.error(`❌ ERROR: Duplicate Discord message ID detected! ${sentMessageId} was already sent!`);
        } else {
          sentDiscordMessageIds.add(sentMessageId);
          
          // Clean up old entries (keep only last 1000)
          if (sentDiscordMessageIds.size > 1000) {
            const firstEntry = sentDiscordMessageIds.values().next().value;
            if (firstEntry) {
              sentDiscordMessageIds.delete(firstEntry);
            }
          }
        }
        
        return sentMessage;
      } catch (error) {
        // On error, remove from sentReplies so it can be retried
        console.error(`❌ Error sending message ${message.id}:`, error);
        sentReplies.delete(sentReplyKey);
        sendingMessages.delete(sentReplyKey);
        throw error;
      } finally {
        // Always remove from cache and sendingMessages, even if send fails
        sendingPromises.delete(sentReplyKey);
        sendingMessages.delete(sentReplyKey);
      }
    })();
    
    // Cache the promise IMMEDIATELY (before await) to prevent race condition
    sendingPromises.set(sentReplyKey, sendPromise);
    
    // Wait for the send to complete
    await sendPromise;

    // Update message count
    await incrementMessageCount(bot.id);

    // Log message to database
    await logMessage(bot.id, message.channel.id, message.author.id, message.content, reply, bot.user_id);
  } catch (error) {
    console.error(`Error processing message for bot ${bot.bot_name}:`, error);
    // On error, remove from processedMessages so it can be retried
    processedMessages.delete(messageKey);
  }
}

async function incrementMessageCount(botId: string): Promise<void> {
  try {
    const { data: bot } = await supabase
      .from('discord_bots')
      .select('messages_this_month, total_messages')
      .eq('id', botId)
      .single();

    if (bot) {
      await supabase
        .from('discord_bots')
        .update({
          messages_this_month: (bot.messages_this_month || 0) + 1,
          total_messages: (bot.total_messages || 0) + 1,
          last_active_at: new Date().toISOString(),
        })
        .eq('id', botId);
    }
  } catch (error) {
    console.error('Error incrementing message count:', error);
  }
}

async function logMessage(
  botId: string,
  channelId: string,
  userId: string,
  question: string,
  answer: string,
  botUserId: string
): Promise<void> {
  try {
    await supabase.from('chat_logs').insert({
      owner_user_id: botUserId, // user_id from discord_bots table
      question,
      answer,
      category: 'Discord',
      // Add Discord-specific metadata if needed
    });
  } catch (error) {
    console.error('Error logging message:', error);
    // Don't throw - logging failure shouldn't break the bot
  }
}

