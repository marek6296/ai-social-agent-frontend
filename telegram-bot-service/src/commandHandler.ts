import { Context } from 'telegraf';
import { Telegraf } from 'telegraf';
import { TelegramBot } from './types';
import { supabase } from './supabase';

// Track command executions to prevent duplicates
const processedCommands = new Set<string>();
const COMMAND_DEBOUNCE_MS = 2000; // 2 seconds

// Track cooldowns per user per command
const userCommandCooldowns = new Map<string, number>(); // key: userId-command, value: timestamp

export async function processCommand(
  ctx: Context,
  bot: TelegramBot,
  telegraf: Telegraf
): Promise<void> {
  if (!ctx.message || !('text' in ctx.message) || !ctx.chat) {
    return;
  }

  const message = ctx.message;
  const chatId = String(ctx.chat.id);
  const userId = String(ctx.from?.id || '');
  const username = ctx.from?.username || '';
  const commandText = message.text.split(' ')[0]; // e.g., "/start"
  const commandName = commandText.replace('/', ''); // e.g., "start"

  // Prevent duplicate processing
  const commandKey = `${chatId}-${userId}-${commandText}-${Date.now()}`;
  if (processedCommands.has(commandKey)) {
    return;
  }
  processedCommands.add(commandKey);

  // Clean up old entries
  if (processedCommands.size > 1000) {
    const firstEntry = processedCommands.values().next().value;
    if (firstEntry) {
      processedCommands.delete(firstEntry);
    }
  }

  console.log(`📝 Command received: ${commandText} from user ${userId} in chat ${chatId}`);

  // Check access mode
  if (bot.access_mode === 'whitelist' && bot.allowed_users && bot.allowed_users.length > 0) {
    const userIdStr = userId;
    const usernameStr = username ? `@${username}` : '';
    if (!bot.allowed_users.includes(userIdStr) && !bot.allowed_users.includes(usernameStr)) {
      console.log(`🚫 User ${userId} is not in whitelist, ignoring command`);
      return;
    }
  }

  // Check chat type (ctx.chat is already checked above)
  const chatType = ctx.chat!.type === 'private' ? 'private' : 
                   ctx.chat!.type === 'group' || ctx.chat!.type === 'supergroup' ? 'group' : 
                   'channel';
  
  if (!bot.allowed_chat_types.includes(chatType)) {
    console.log(`🚫 Chat type ${chatType} not allowed, ignoring command`);
    return;
  }

  // Load commands from database
  const { data: commands, error } = await supabase
    .from('telegram_bot_commands')
    .select('*')
    .eq('bot_id', bot.id)
    .eq('command_trigger', commandText)
    .order('display_order', { ascending: true });

  if (error) {
    console.error(`Error loading commands for bot ${bot.id}:`, error);
  }

  // Find matching command
  const command = commands && commands.length > 0 ? commands[0] : null;

  if (command) {
    // Check if admin only
    if (command.admin_only && bot.admin_users && bot.admin_users.length > 0) {
      const userIdStr = userId;
      const usernameStr = username ? `@${username}` : '';
      if (!bot.admin_users.includes(userIdStr) && !bot.admin_users.includes(usernameStr)) {
        await ctx.reply('Nemáte oprávnenie na používanie tohto príkazu.');
        return;
      }
    }

    // Check if private chat only
    if (command.private_chat_only && chatType !== 'private') {
      await ctx.reply('Tento príkaz je dostupný len v súkromných správach.');
      return;
    }

    // Check cooldown
    if (command.cooldown_seconds > 0) {
      const cooldownKey = `${userId}-${commandText}`;
      const lastExecution = userCommandCooldowns.get(cooldownKey);
      const now = Date.now();
      if (lastExecution && (now - lastExecution) < command.cooldown_seconds * 1000) {
        const remainingSeconds = Math.ceil((command.cooldown_seconds * 1000 - (now - lastExecution)) / 1000);
        await ctx.reply(`Počkajte ${remainingSeconds} sekúnd pred opätovným použitím tohto príkazu.`);
        return;
      }
      userCommandCooldowns.set(cooldownKey, now);
    }

    // Handle command response
    if (command.command_type === 'text' && command.response_text) {
      let responseText = command.response_text;
      
      // Replace variables
      const firstName = ctx.from?.first_name || 'Používateľ';
      const lastName = ctx.from?.last_name || '';
      const fullName = lastName ? `${firstName} ${lastName}` : firstName;
      
      responseText = responseText.replace(/{first_name}/g, firstName);
      responseText = responseText.replace(/{username}/g, username || 'Používateľ');
      responseText = responseText.replace(/{language}/g, bot.bot_language);
      responseText = responseText.replace(/{time}/g, new Date().toLocaleString('sk-SK'));
      
      // Add response delay if configured
      if (bot.response_delay_ms > 0) {
        await new Promise(resolve => setTimeout(resolve, bot.response_delay_ms));
      }
      
      await ctx.reply(responseText);
    }
  } else {
    // No custom command found, handle built-in commands
    if (commandName === 'start' && bot.module_welcome) {
      // Load welcome template
      const { data: welcomeTemplate } = await supabase
        .from('telegram_bot_templates')
        .select('*')
        .eq('bot_id', bot.id)
        .eq('template_name', 'welcome')
        .single();

      if (welcomeTemplate && welcomeTemplate.template_text) {
        let welcomeText = welcomeTemplate.template_text;
        
        // Replace variables
        const firstName = ctx.from?.first_name || 'Používateľ';
        welcomeText = welcomeText.replace(/{first_name}/g, firstName);
        welcomeText = welcomeText.replace(/{username}/g, username || 'Používateľ');
        welcomeText = welcomeText.replace(/{language}/g, bot.bot_language);
        welcomeText = welcomeText.replace(/{time}/g, new Date().toLocaleString('sk-SK'));

        // Add response delay if configured
        if (bot.response_delay_ms > 0) {
          await new Promise(resolve => setTimeout(resolve, bot.response_delay_ms));
        }

        await ctx.reply(welcomeText);
      }
    } else if (commandName === 'help' && bot.module_help) {
      // Load help template
      const { data: helpTemplate } = await supabase
        .from('telegram_bot_templates')
        .select('*')
        .eq('bot_id', bot.id)
        .eq('template_name', 'help')
        .single();

      if (helpTemplate && helpTemplate.template_text) {
        let helpText = helpTemplate.template_text;
        
        // Replace variables
        const firstName = ctx.from?.first_name || 'Používateľ';
        helpText = helpText.replace(/{first_name}/g, firstName);
        helpText = helpText.replace(/{username}/g, username || 'Používateľ');
        helpText = helpText.replace(/{language}/g, bot.bot_language);
        helpText = helpText.replace(/{time}/g, new Date().toLocaleString('sk-SK'));

        // Add response delay if configured
        if (bot.response_delay_ms > 0) {
          await new Promise(resolve => setTimeout(resolve, bot.response_delay_ms));
        }

        await ctx.reply(helpText);
      } else {
        await ctx.reply('Pomoc: Pošlite mi správu a pokúsim sa vám pomôcť.');
      }
    } else {
      // Unknown command - send fallback message
      if (bot.fallback_message) {
        await ctx.reply(bot.fallback_message);
      }
    }
  }

  // Log command
  try {
    await supabase
      .from('telegram_bot_logs')
      .insert({
        bot_id: bot.id,
        event_type: 'command',
        user_id: userId,
        username: username,
        chat_id: chatId,
        chat_type: chatType,
        message_text: commandText,
        status: 'success',
      });
  } catch (error) {
    console.error('Error logging command:', error);
  }
}

