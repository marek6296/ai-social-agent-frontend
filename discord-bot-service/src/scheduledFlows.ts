import { Client } from 'discord.js';
import { supabase } from './supabase';
import { loadFlowsForBot, executeFlowActions } from './flowProcessor';

// Track scheduled flow executions
const scheduledExecutions = new Map<string, number>(); // flowId -> last execution timestamp

export async function processScheduledFlows(client: Client, botId: string) {
  try {
    const flows = await loadFlowsForBot(botId);
    
    for (const flow of flows) {
      if (flow.trigger_type !== 'scheduled') continue;
      if (!flow.enabled) continue;
      
      const config = flow.trigger_config || {};
      const scheduleType = config.schedule_type || 'time'; // 'time' or 'interval'
      
      const now = Date.now();
      const lastExecuted = scheduledExecutions.get(flow.id);
      let shouldExecute = false;
      
      // Interval-based scheduling
      if (scheduleType === 'interval') {
        const intervalMinutes = config.interval_minutes || 60; // Default: 1 hour
        
        if (!lastExecuted) {
          // First execution - execute immediately
          console.log(`⏰ Scheduled flow "${flow.name}" (interval: every ${intervalMinutes} min) - first execution`);
          shouldExecute = true;
        } else {
          // Check if interval has passed
          const intervalMs = intervalMinutes * 60 * 1000;
          const timeSinceLastExecution = now - lastExecuted;
          
          if (timeSinceLastExecution >= intervalMs) {
            console.log(`⏰ Scheduled flow "${flow.name}" triggered (interval: every ${intervalMinutes} min)`);
            shouldExecute = true;
          } else {
            continue; // Interval not yet reached
          }
        }
      } 
      // Time-based scheduling (specific time each day, or one-time with date)
      else {
        const time = config.time; // HH:MM format
        const date = config.date; // YYYY-MM-DD format (optional, for one-time scheduling)
        const days = config.days || []; // Array of day numbers (1-7, Mon-Sun)
        
        if (!time) continue;
        
        const nowDate = new Date(now);
        const currentTime = `${String(nowDate.getHours()).padStart(2, '0')}:${String(nowDate.getMinutes()).padStart(2, '0')}`;
        const currentDate = nowDate.toISOString().split('T')[0]; // YYYY-MM-DD
        
        // Check if it's the right time (within same minute)
        if (currentTime !== time) continue;
        
        // If date is specified (one-time scheduling), check if it's the right date
        if (date) {
          if (currentDate !== date) continue;
          // For one-time scheduling, check if we already executed
          const currentMinute = nowDate.getTime() - (nowDate.getSeconds() * 1000 + nowDate.getMilliseconds());
          if (lastExecuted && lastExecuted >= currentMinute) {
            continue; // Already executed this minute
          }
          console.log(`⏰ Scheduled flow "${flow.name}" triggered at ${time} on ${date}`);
          shouldExecute = true;
        } else {
          // Recurring daily scheduling
          const currentDay = nowDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
          const adjustedDay = currentDay === 0 ? 7 : currentDay; // Convert to 1-7 (Mon-Sun)
          
          // Check if it's the right day (if days are specified)
          if (days.length > 0 && !days.includes(adjustedDay)) continue;
          
          // Check if we already executed this flow in this minute (prevent duplicates)
          const currentMinute = nowDate.getTime() - (nowDate.getSeconds() * 1000 + nowDate.getMilliseconds());
          
          if (lastExecuted && lastExecuted >= currentMinute) {
            continue; // Already executed this minute
          }
          
          console.log(`⏰ Scheduled flow "${flow.name}" triggered at ${time}`);
          shouldExecute = true;
        }
      }
      
      // Execute flow actions only if shouldExecute is true
      if (!shouldExecute) continue;
      
      // For scheduled flows, we need to find a channel to send to
      // Try to get the first channel from the first action, or use system channel
      let targetChannel = null;
      
      if (flow.actions && flow.actions.length > 0) {
        // Check all message actions (send_message, send_embed, send_buttons, etc.) for channel_id
        const firstMessageAction = flow.actions.find((a: any) => 
          (a.type === 'send_message' || a.type === 'send_embed' || a.type === 'send_buttons' || a.type === 'send_select_menu' || a.type === 'ping_role') && a.config?.channel_id
        );
        
        if (firstMessageAction?.config?.channel_id) {
          try {
            const channel = await client.channels.fetch(firstMessageAction.config.channel_id);
            if (channel && ('send' in channel)) {
              targetChannel = channel as any;
            }
          } catch (error) {
            console.error(`Error fetching channel for scheduled flow ${flow.id}:`, error);
          }
        }
      }
      
      // If no channel found, try to find system channel from any guild
      if (!targetChannel) {
        for (const guild of client.guilds.cache.values()) {
          if (guild.systemChannel) {
            targetChannel = guild.systemChannel;
            break;
          }
        }
      }
      
      if (targetChannel) {
        await executeFlowActions(flow, null, client, undefined, targetChannel);
        // Mark as executed AFTER successful execution
        scheduledExecutions.set(flow.id, now);
        console.log(`✅ Executed scheduled flow "${flow.name}"`);
      } else {
        console.error(`❌ No channel found for scheduled flow ${flow.id} - cannot execute actions`);
        // Don't mark as executed if we failed to find a channel, so it can retry
      }
    }
  } catch (error) {
    console.error(`Error processing scheduled flows for bot ${botId}:`, error);
  }
}

// Clean up old execution records (older than 1 hour)
export function cleanupScheduledExecutions() {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  for (const [flowId, timestamp] of scheduledExecutions.entries()) {
    if (timestamp < oneHourAgo) {
      scheduledExecutions.delete(flowId);
    }
  }
}

