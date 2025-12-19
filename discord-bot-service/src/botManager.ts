import { Client, GatewayIntentBits, Message, TextChannel, ThreadChannel, GuildMember, Interaction, ButtonInteraction } from 'discord.js';
import { supabase } from './supabase';
import { decryptToken } from './encryption';
import { DiscordBot, BotInstance } from './types';
import { processMessage } from './messageHandler';
import { loadFlowsForBot, checkFlowTrigger, checkFlowConditions, executeFlowActions } from './flowProcessor';

const botInstances = new Map<string, BotInstance>();

// Global tracking to prevent duplicate message processing across all bot instances
// Key: messageId-botId, Value: timestamp
const globalHandlerProcessedMessages = new Map<string, number>();

// Global tracking at Discord.js event level - prevents duplicate handler calls
// Key: Discord message ID (unique across all servers), Value: timestamp
const globalDiscordMessageIds = new Map<string, number>();

// CRITICAL: Global processing lock - prevents concurrent processing of the same message
// This is a Set of message keys that are currently being processed
const processingLocks = new Set<string>();

export async function loadBotsFromDatabase(): Promise<DiscordBot[]> {
  try {
    // Load ALL bots (not just active) to handle status changes
    // Also load bots with status 'error' to retry them
    const { data: bots, error } = await supabase
      .from('discord_bots')
      .select('*')
      .or('bot_type.eq.custom,bot_type.eq.shared');

    if (error) {
      console.error('Error loading bots from database:', error);
      return [];
    }

    return (bots || []) as DiscordBot[];
  } catch (error) {
    console.error('Unexpected error loading bots:', error);
    return [];
  }
}

// Track initialization attempts to prevent concurrent initializations
const initializingBots = new Set<string>();

export async function initializeBot(botData: DiscordBot): Promise<boolean> {
  // CRITICAL: Prevent concurrent initializations of the same bot
  if (initializingBots.has(botData.id)) {
    console.log(`⚠️ Bot ${botData.bot_name} (${botData.id}) is already being initialized, skipping duplicate`);
    return false;
  }
  
  initializingBots.add(botData.id);
  
  try {
    // If bot already exists, destroy old client first to prevent duplicate event handlers
    if (botInstances.has(botData.id)) {
      const instance = botInstances.get(botData.id)!;
      if (instance.isConnected && instance.client && instance.client.isReady()) {
        console.log(`✅ Bot ${botData.bot_name} (${botData.id}) already connected and ready`);
        initializingBots.delete(botData.id);
        return true;
      }
      // Destroy old client if it exists but isn't connected
      if (instance.client) {
        try {
          console.log(`Removing all listeners and destroying old client for bot ${botData.bot_name} (${botData.id})`);
          instance.client.removeAllListeners();
          instance.client.destroy();
          console.log(`Destroyed old client for bot ${botData.bot_name} (${botData.id})`);
        } catch (error) {
          console.error(`Error destroying old client for bot ${botData.bot_name}:`, error);
        }
      }
      botInstances.delete(botData.id);
    }

    // Decrypt token (or use plain text if not encrypted)
    // decryptToken will return plain text if decryption fails or token is not encrypted
    let decryptedToken = decryptToken(botData.bot_token);
    
    // If decryption returned empty string, use original token (might be plain text)
    if (!decryptedToken || decryptedToken.trim() === '') {
      decryptedToken = botData.bot_token;
    }
    
    if (!decryptedToken || decryptedToken.trim() === '') {
      console.error(`❌ Invalid or empty token for bot ${botData.bot_name} (${botData.id})`);
      await updateBotStatus(botData.id, 'error');
      return false;
    }
    
    // Check if token looks like a Discord bot token
    // Discord tokens MUST contain dots and be 50-100 characters long
    // If token doesn't look valid, it's likely corrupted/encrypted with wrong key
    const looksValid = decryptedToken.includes('.') && 
                       decryptedToken.length >= 50 && 
                       decryptedToken.length <= 100 &&
                       /^[A-Za-z0-9._-]+$/.test(decryptedToken);
    
    if (!looksValid) {
      console.error(`❌ Token format is invalid for bot ${botData.bot_name} (${botData.id})`);
      console.error(`   Token length: ${decryptedToken.length}, contains dot: ${decryptedToken.includes('.')}`);
      console.error(`   Token appears to be corrupted or encrypted with wrong key.`);
      console.error(`   ⚠️  ACTION REQUIRED: User must enter a new token in the bot settings page.`);
      await updateBotStatus(botData.id, 'error');
      return false;
    }

    // Create Discord client
    // Note: GuildMembers intent is privileged and requires "Server Members Intent" in Developer Portal
    // Enable it at: https://discord.com/developers/applications -> Your Bot -> Bot -> Privileged Gateway Intents
    // We try without it first - if needed, user can enable it in Developer Portal
    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        // GuildMembers intent is optional - welcome flows will work only if this intent is enabled in Developer Portal
        // Uncomment next line if you have enabled "Server Members Intent" in Developer Portal:
        // GatewayIntentBits.GuildMembers,
      ],
    });

    // Message handler function - defined separately to allow removal
    const messageHandler = async (message: Message) => {
      // CRITICAL: Use atomic check-and-set pattern with processingLocks Set
      // This prevents ANY concurrent processing of the same message
      const lockKey = `discord-${message.id}`;
      
      // ATOMIC check: if already processing, return immediately
      if (processingLocks.has(lockKey)) {
        console.log(`🚫 PROCESSING LOCK: Message ${message.id} already being processed, skipping...`);
        return;
      }
      
      // ATOMIC set: mark as processing IMMEDIATELY
      processingLocks.add(lockKey);
      
      try {
        // CRITICAL: Track at Discord message ID level FIRST (before any other checks)
        // Discord message IDs are unique globally, so this catches ALL duplicates
        const discordMessageId = message.id;
        const now = Date.now();
        
        // CRITICAL: Check and mark SYNCHRONOUSLY to prevent race conditions
        const lastProcessedDiscord = globalDiscordMessageIds.get(discordMessageId);
        if (lastProcessedDiscord && (now - lastProcessedDiscord) < 10000) { // 10 second window
          console.log(`🚫 DISCORD MESSAGE ID duplicate prevented: ${discordMessageId} (processed ${now - lastProcessedDiscord}ms ago)`);
          return;
        }
        
        // Mark as processed IMMEDIATELY (synchronously)
        globalDiscordMessageIds.set(discordMessageId, now);
        
        // Clean up old entries (keep only last 2000)
        if (globalDiscordMessageIds.size > 2000) {
          const firstEntry = globalDiscordMessageIds.keys().next().value;
          if (firstEntry) {
            globalDiscordMessageIds.delete(firstEntry);
          }
        }
        
        // Ignore bot messages
        if (message.author.bot) {
          console.log(`⏭️ Ignoring bot message from ${message.author.tag} (message ${message.id})`);
          return;
        }
        
        // CRITICAL: Use GLOBAL tracking to prevent duplicate handler execution across ALL bot instances
        const handlerKey = `${message.id}-${botData.id}`;
        const lastProcessed = globalHandlerProcessedMessages.get(handlerKey);
        
        // CRITICAL: Check and mark SYNCHRONOUSLY to prevent race conditions
        if (lastProcessed && (now - lastProcessed) < 10000) { // Increased to 10 seconds for better protection
          console.log(`⚠️ GLOBAL Handler duplicate prevented for message ${message.id} (processed ${now - lastProcessed}ms ago)`);
          return;
        }
        
        // Mark as processed IMMEDIATELY (synchronously)
        globalHandlerProcessedMessages.set(handlerKey, now);
        
        console.log(`🎯 Handler called for message ${message.id} from ${message.author.tag} (bot: ${botData.bot_name})`);
        
        // Clean up old entries (keep only last 1000)
        if (globalHandlerProcessedMessages.size > 1000) {
          const firstEntry = globalHandlerProcessedMessages.keys().next().value;
          if (firstEntry) {
            globalHandlerProcessedMessages.delete(firstEntry);
          }
        }
      
        // Get fresh bot data from database
        const { data: freshBotData } = await supabase
          .from('discord_bots')
          .select('*')
          .eq('id', botData.id)
          .single();
        
        if (!freshBotData) return;
        
        const freshBot = freshBotData as DiscordBot;
        
        // Process message
        await processMessage(message, freshBot, client);
      } finally {
        // CRITICAL: Always release the processing lock, even if there's an error or early return
        processingLocks.delete(lockKey);
      }
    };

    // Remove existing listeners to prevent duplicates
    const messageListenerCountBefore = client.listenerCount('messageCreate');
    if (messageListenerCountBefore > 0) {
      console.log(`⚠️ WARNING: Found ${messageListenerCountBefore} existing messageCreate listeners, removing...`);
    }
    client.removeAllListeners('ready');
    client.removeAllListeners('messageCreate');
    client.removeAllListeners('guildMemberAdd');
    client.removeAllListeners('interactionCreate');
    client.removeAllListeners('error');
    client.removeAllListeners('disconnect');

    // Set up event handlers
    client.once('ready', async () => {
      console.log(`✅ Bot ${botData.bot_name} (${botData.id}) is online!`);
      console.log(`   Logged in as: ${client.user?.tag}`);
      console.log(`   Bot ID: ${client.user?.id}`);
      
      // Update status in database
      await updateBotStatus(botData.id, 'active');
      
      const instance = botInstances.get(botData.id);
      if (instance) {
        instance.isConnected = true;
      }
    });

    client.on('messageCreate', messageHandler);
    const messageListenerCountAfter = client.listenerCount('messageCreate');
    console.log(`📌 Registered messageCreate handler for bot ${botData.bot_name} (${botData.id}). Total listeners: ${messageListenerCountAfter}`);
    if (messageListenerCountAfter > 1) {
      console.error(`❌ ERROR: Multiple messageCreate listeners detected for bot ${botData.bot_name}! This will cause duplicate responses.`);
      console.error(`   Bot ID: ${botData.id}`);
      console.error(`   Client ID: ${client.user?.id || 'N/A'}`);
    }

    // Handle member join events (for welcome flows)
    const memberJoinHandler = async (member: GuildMember) => {
      try {
        console.log(`👤 Member joined: ${member.user.tag} in guild ${member.guild.name}`);
        
        // Get fresh bot data
        const { data: freshBotData } = await supabase
          .from('discord_bots')
          .select('*')
          .eq('id', botData.id)
          .single();
        
        if (!freshBotData) return;
        
        const freshBot = freshBotData as DiscordBot;
        
        // Load flows for this bot
        const flows = await loadFlowsForBot(botData.id);
        
        // Find welcome flows (trigger_type === 'member_join')
        for (const flow of flows) {
          if (flow.trigger_type !== 'member_join') continue;
          
          // Check conditions
          // Create a dummy message for condition checking (we'll need to adapt this)
          // For now, just check if conditions pass
          const conditions = flow.conditions || {};
          let conditionsPass = true;
          
          if (conditions.require_roles && Array.isArray(conditions.require_roles) && conditions.require_roles.length > 0) {
            if (!member.roles.cache.some(role => conditions.require_roles.includes(role.id))) {
              conditionsPass = false;
            }
          }
          
          if (conditions.ignored_role && member.roles.cache.has(conditions.ignored_role)) {
            conditionsPass = false;
          }
          
          if (!conditionsPass) continue;
          
          // Execute flow actions
          console.log(`✅ Welcome flow "${flow.name}" matched for member ${member.user.tag}`);
          
          // Find target channel (use system channel or first available)
          let targetChannel: TextChannel | undefined;
          if (flow.actions && flow.actions.length > 0) {
            // Try to find channel from first send_message action
            const firstMessageAction = flow.actions.find((a: any) => a.type === 'send_message');
            if (firstMessageAction?.config?.channel_id) {
              const channel = await client.channels.fetch(firstMessageAction.config.channel_id);
              if (channel instanceof TextChannel) {
                targetChannel = channel;
              }
            }
          }
          
          // Fallback to system channel
          if (!targetChannel) {
            targetChannel = member.guild.systemChannel || undefined;
          }
          
          await executeFlowActions(flow, null, client, member, targetChannel);
        }
      } catch (error) {
        console.error(`Error handling member join for bot ${botData.bot_name}:`, error);
      }
    };
    
    client.on('guildMemberAdd', memberJoinHandler);
    console.log(`📌 Registered guildMemberAdd handler for bot ${botData.bot_name} (${botData.id})`);

    // Handle template button interactions
    async function handleTemplateButton(buttonInteraction: ButtonInteraction, botId: string, client: Client) {
      try {
        const customId = buttonInteraction.customId;
        
        // Handle poll votes (poll:{template_id}:page:{page_name}:option:{index})
        if (customId.startsWith('poll:')) {
          const parts = customId.split(':');
          if (parts.length >= 6 && parts[0] === 'poll') {
            const templateId = parts[1];
            const pageName = parts[3];
            const optionIndex = parseInt(parts[5], 10);
            
            // Get template
            const { data: template } = await supabase
              .from('discord_message_templates')
              .select('*')
              .eq('id', templateId)
              .single();
            
            if (!template || !template.pages_json) return false;
            
            const pages = template.pages_json as any[];
            const currentPageIndex = template.current_page_index || 0;
            const currentPage = pages[currentPageIndex] || pages[0];
            
            if (!currentPage?.components?.poll) return false;
            
            const poll = currentPage.components.poll;
            if (optionIndex < 0 || optionIndex >= poll.options.length) return false;
            
            // Get published message
            const { data: published } = await supabase
              .from('discord_published_messages')
              .select('*')
              .eq('message_id', buttonInteraction.message.id)
              .maybeSingle();
            
            if (!published) return false;
            
            // Check if user already voted (if not allowMultiple)
            if (!poll.allowMultiple) {
              const { data: existingVote } = await supabase
                .from('discord_message_state')
                .select('*')
                .eq('published_message_id', published.id)
                .eq('user_id', buttonInteraction.user.id)
                .maybeSingle();
              
              if (existingVote) {
                // Update existing vote
                await supabase
                  .from('discord_message_state')
                  .update({
                    status: optionIndex.toString(),
                    data_json: { option: poll.options[optionIndex], voted_at: new Date().toISOString() },
                    updated_at: new Date().toISOString(),
                  })
                  .eq('id', existingVote.id);
              } else {
                // Create new vote
                await supabase
                  .from('discord_message_state')
                  .insert({
                    template_id,
                    published_message_id: published.id,
                    message_id: buttonInteraction.message.id,
                    user_id: buttonInteraction.user.id,
                    status: optionIndex.toString(),
                    data_json: { option: poll.options[optionIndex], voted_at: new Date().toISOString() },
                  });
              }
            } else {
              // Allow multiple votes - just add new vote
              await supabase
                .from('discord_message_state')
                .upsert({
                  template_id,
                  published_message_id: published.id,
                  message_id: buttonInteraction.message.id,
                  user_id: buttonInteraction.user.id,
                  status: optionIndex.toString(),
                  data_json: { option: poll.options[optionIndex], voted_at: new Date().toISOString() },
                }, {
                  onConflict: 'published_message_id,user_id',
                });
            }
            
            // Get vote counts for each option
            const { data: allVotes } = await supabase
              .from('discord_message_state')
              .select('status')
              .eq('published_message_id', published.id);
            
            const voteCounts: Record<number, number> = {};
            poll.options.forEach((_, idx) => {
              voteCounts[idx] = 0;
            });
            
            if (allVotes) {
              allVotes.forEach((vote) => {
                const idx = parseInt(vote.status || '0', 10);
                if (!isNaN(idx) && idx >= 0 && idx < poll.options.length) {
                  voteCounts[idx] = (voteCounts[idx] || 0) + 1;
                }
              });
            }
            
            // Build updated embed with results
            const { EmbedBuilder } = await import('discord.js');
            const embed = new EmbedBuilder();
            
            if (currentPage.embed.title) embed.setTitle(currentPage.embed.title);
            
            let description = currentPage.embed.description || '';
            if (poll.question) {
              description += `\n\n**${poll.question}**`;
            }
            
            // Add results if showResults is enabled
            if (poll.showResults !== false) {
              const totalVotes = Object.values(voteCounts).reduce((sum, count) => sum + count, 0);
              description += `\n\n📊 **Výsledky** (${totalVotes} hlasov):\n`;
              
              poll.options.forEach((option, idx) => {
                const count = voteCounts[idx] || 0;
                const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                const barLength = 20;
                const filled = Math.round((count / Math.max(totalVotes, 1)) * barLength);
                const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
                description += `\n${option}: ${count} (${percentage}%)\n\`${bar}\``;
              });
            }
            
            embed.setDescription(description);
            
            if (currentPage.embed.color) {
              const color = typeof currentPage.embed.color === 'string' && currentPage.embed.color.startsWith('#')
                ? parseInt(currentPage.embed.color.replace('#', ''), 16)
                : currentPage.embed.color;
              embed.setColor(color);
            }
            
            if (currentPage.embed.footer) embed.setFooter({ text: currentPage.embed.footer });
            
            // Update message embed
            await buttonInteraction.deferReply({ ephemeral: true });
            await buttonInteraction.editReply({ content: `✅ Hlas za "${poll.options[optionIndex]}" zaznamenaný!` });
            
            // Update the original message with results
            const message = buttonInteraction.message;
            if (message.editable) {
              await message.edit({ embeds: [embed] });
            }
            
            return true;
          }
        }
        
        // Parse custom_id format: tpl:{template_id}:page:{page_name}:btn:{button_id}
        let templateId: string | null = null;
        let pageName: string | null = null;
        let buttonId: string | null = null;
        
        if (customId.startsWith('tpl:')) {
          const parts = customId.split(':');
          if (parts.length >= 6 && parts[0] === 'tpl') {
            templateId = parts[1];
            pageName = parts[3];
            buttonId = parts.slice(5).join(':'); // In case button_id contains colons
          }
        }
        
        // Find action by template_id and button_id (custom_id in DB is just buttonId)
        let action: any = null;
        if (templateId && buttonId) {
          // Try to find action by template_id and custom_id (which is buttonId)
          const { data: actionsData } = await supabase
            .from('discord_template_actions')
            .select('*, discord_message_templates!inner(*)')
            .eq('template_id', templateId)
            .eq('custom_id', buttonId) // custom_id in DB is the button ID
            .maybeSingle();
          action = actionsData;
        }
        
        // Fallback: try to find by full custom_id (backward compatibility for old format)
        if (!action) {
          const { data: actionData } = await supabase
            .from('discord_template_actions')
            .select('*, discord_message_templates!inner(*)')
            .eq('custom_id', customId)
            .maybeSingle();
          action = actionData;
          if (action) {
            templateId = action.template_id;
          }
        }
        
        if (!action) {
          console.log(`No template action found for button ${customId}`);
          return false; // Not a template button, continue with flow handling
        }
        
        const { action_type, action_payload_json, template_id } = action;
        const payload = action_payload_json || {};
        
        // Log interaction
        await supabase.from('discord_template_interactions').insert({
          template_id,
          custom_id: customId,
          user_id: buttonInteraction.user.id,
          action_type,
        });
        
        // Defer reply if not already done
        if (!buttonInteraction.replied && !buttonInteraction.deferred) {
          await buttonInteraction.deferReply({ ephemeral: payload.ephemeral !== false });
        }
        
        switch (action_type) {
          case 'reply':
            const replyContent = payload.content || '✅ Spracované!';
            if (buttonInteraction.deferred) {
              await buttonInteraction.editReply({ content: replyContent });
            }
            break;
            
          case 'assign_role':
            if (buttonInteraction.member && payload.role_id) {
              const role = buttonInteraction.guild?.roles.cache.get(payload.role_id);
              if (role) {
                await (buttonInteraction.member as GuildMember).roles.add(role);
                await buttonInteraction.editReply({ content: `✅ Rola ${role.name} pridaná!` });
              }
            }
            break;
            
          case 'remove_role':
            if (buttonInteraction.member && payload.role_id) {
              const role = buttonInteraction.guild?.roles.cache.get(payload.role_id);
              if (role) {
                await (buttonInteraction.member as GuildMember).roles.remove(role);
                await buttonInteraction.editReply({ content: `✅ Rola ${role.name} odobratá!` });
              }
            }
            break;
            
          case 'save_to_db':
            const { data: publishedMsg } = await supabase
              .from('discord_published_messages')
              .select('*')
              .eq('message_id', buttonInteraction.message.id)
              .maybeSingle();
            
            if (publishedMsg) {
              await supabase.from('discord_message_state').upsert({
                template_id,
                published_message_id: publishedMsg.id,
                message_id: buttonInteraction.message.id,
                user_id: buttonInteraction.user.id,
                status: payload.status,
                data_json: payload.data || {},
              });
              await buttonInteraction.editReply({ content: '✅ Uložené!' });
            }
            break;
            
          case 'event_join':
          case 'event_leave':
          case 'event_maybe':
          case 'event_decline':
            // Event RSVP actions - save status and optionally manage roles
            const { data: publishedEvent } = await supabase
              .from('discord_published_messages')
              .select('*')
              .eq('message_id', buttonInteraction.message.id)
              .maybeSingle();
            
            if (publishedEvent) {
              const status = 
                actionType === 'event_join' ? 'going' : 
                actionType === 'event_leave' ? 'no' : 
                actionType === 'event_decline' ? 'no' :
                'maybe';
              
              // Save RSVP status
              await supabase.from('discord_message_state').upsert({
                template_id,
                published_message_id: publishedEvent.id,
                message_id: buttonInteraction.message.id,
                user_id: buttonInteraction.user.id,
                status: status,
                data_json: { action_type: actionType, timestamp: new Date().toISOString() },
              });
              
              // Optionally manage role
              if (payload.role_id && buttonInteraction.member && buttonInteraction.guild) {
                const role = buttonInteraction.guild.roles.cache.get(payload.role_id);
                if (role) {
                  const member = buttonInteraction.member as GuildMember;
                  if (actionType === 'event_join') {
                    await member.roles.add(role);
                  } else if (actionType === 'event_leave' || actionType === 'event_decline') {
                    await member.roles.remove(role);
                  }
                  // For 'maybe', don't add/remove role (or implement custom logic)
                }
              }
              
              // Send response message
              const responseMessage = payload.response_message || 
                (actionType === 'event_join' ? '✅ Príhlásil si sa na event!' :
                 actionType === 'event_leave' ? '❌ Odhlásil si sa z eventu.' :
                 actionType === 'event_decline' ? '❌ Zaznamenali sme, že sa nezúčastníš.' :
                 '❓ Zaznamenali sme, že možno prídeš.');
              
              await buttonInteraction.editReply({ content: responseMessage });
            }
            break;
            
          case 'edit_message':
            // Edit the message to show different page
            const messageId = buttonInteraction.message.id;
            const { data: published } = await supabase
              .from('discord_published_messages')
              .select('*')
              .eq('message_id', messageId)
              .maybeSingle();
            
            if (published) {
              const pageIndex = payload.page_index || 0;
              const { data: template } = await supabase
                .from('discord_message_templates')
                .select('*')
                .eq('id', template_id)
                .single();
              
              if (template) {
                const pages = template.pages_json || [];
                const newPage = pages[pageIndex];
                
                if (newPage) {
                  // Build embed and components from new page
                  const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = await import('discord.js');
                  
                  // Build embed
                  const embed = new EmbedBuilder();
                  if (newPage.embed.title) embed.setTitle(newPage.embed.title);
                  if (newPage.embed.description) embed.setDescription(newPage.embed.description);
                  if (newPage.embed.color) {
                    const color = typeof newPage.embed.color === 'string' && newPage.embed.color.startsWith('#')
                      ? parseInt(newPage.embed.color.replace('#', ''), 16)
                      : newPage.embed.color;
                    embed.setColor(color);
                  }
                  if (newPage.embed.thumbnail) embed.setThumbnail(newPage.embed.thumbnail);
                  if (newPage.embed.image) embed.setImage(newPage.embed.image);
                  if (newPage.embed.footer) embed.setFooter({ text: newPage.embed.footer });
                  
                  if (newPage.embed.fields) {
                    for (const field of newPage.embed.fields) {
                      if (field.name && field.value) {
                        embed.addFields({
                          name: field.name,
                          value: field.value,
                          inline: field.inline || false,
                        });
                      }
                    }
                  }
                  
                  // Build components
                  const components: any[] = [];
                  if (newPage.components?.buttons && newPage.components.buttons.length > 0) {
                    const buttons = newPage.components.buttons.map((btn: any) => {
                      let style: ButtonStyle;
                      switch (btn.style) {
                        case 'success': style = ButtonStyle.Success; break;
                        case 'danger': style = ButtonStyle.Danger; break;
                        case 'secondary': style = ButtonStyle.Secondary; break;
                        case 'link': style = ButtonStyle.Link; break;
                        default: style = ButtonStyle.Primary;
                      }
                      
                      // Generate custom_id in format: tpl:{template_id}:page:{page_name}:btn:{button_id}
                      const pageName = newPage.name || `page${pageIndex}`;
                      const buttonCustomId = `tpl:${template_id}:page:${pageName}:btn:${btn.id}`;
                      
                      const button = new ButtonBuilder()
                        .setCustomId(buttonCustomId)
                        .setLabel(btn.label)
                        .setStyle(style);
                      
                      if (btn.emoji) button.setEmoji(btn.emoji);
                      if (btn.url && style === ButtonStyle.Link) button.setURL(btn.url);
                      
                      return button;
                    });
                    
                    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);
                    components.push(row);
                  }
                  
                  // Edit the message
                  const channel = await client.channels.fetch(published.channel_id);
                  if (channel && 'messages' in channel) {
                    const message = await channel.messages.fetch(messageId);
                    await message.edit({
                      embeds: [embed],
                      components: components,
                    });
                    
                    // Update current_page_index
                    await supabase
                      .from('discord_published_messages')
                      .update({ current_page_index: pageIndex })
                      .eq('id', published.id);
                    
                    await buttonInteraction.editReply({ content: '✅ Stránka zmenená!' });
                  }
                }
              }
            }
            break;
            
          case 'open_modal':
            // Open modal form
            const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder: ModalActionRowBuilder } = await import('discord.js');
            const modal = new ModalBuilder()
              .setCustomId(payload.modal_id || `modal_${Date.now()}`)
              .setTitle(payload.title || 'Form');
            
            const inputs = (payload.fields || []).map((field: any) => {
              const textInput = new TextInputBuilder()
                .setCustomId(field.id)
                .setLabel(field.label)
                .setStyle(TextInputStyle[field.style === 'paragraph' ? 'Paragraph' : 'Short'])
                .setRequired(field.required || false);
              if (field.placeholder) textInput.setPlaceholder(field.placeholder);
              return new ModalActionRowBuilder<TextInputBuilder>().addComponents(textInput);
            });
            
            modal.addComponents(...inputs);
            await buttonInteraction.showModal(modal);
            break;
            
          case 'open_url':
            // URL buttons handle this automatically via Discord
            // Just acknowledge
            await buttonInteraction.editReply({ content: '✅ Otváram URL...' });
            break;
            
          case 'create_ticket':
            // Create a private ticket channel
            if (buttonInteraction.guild && buttonInteraction.member) {
              const member = buttonInteraction.member as GuildMember;
              const categoryId = payload.category_id || null;
              
              // Find or create ticket category
              let category = categoryId ? buttonInteraction.guild.channels.cache.get(categoryId) : null;
              if (!category && categoryId) {
                category = await buttonInteraction.guild.channels.fetch(categoryId).catch(() => null);
              }
              
              // Create ticket channel
              const channelName = payload.channel_name || `ticket-${member.user.username.toLowerCase().slice(0, 20)}`;
              const ticketChannel = await buttonInteraction.guild.channels.create({
                name: channelName,
                type: 0, // TextChannel
                parent: category?.id || undefined,
                permissionOverwrites: [
                  {
                    id: buttonInteraction.guild.id,
                    deny: ['ViewChannel'],
                  },
                  {
                    id: member.id,
                    allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
                  },
                  ...(payload.support_roles && Array.isArray(payload.support_roles) 
                    ? payload.support_roles.map((roleId: string) => ({
                        id: roleId,
                        allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'ManageMessages'],
                      }))
                    : []),
                ],
              });
              
              // Send welcome message in ticket channel
              const welcomeMessage = payload.welcome_message || `Vitaj v tickete, ${member}! Ako ti môžem pomôcť?`;
              await ticketChannel.send(welcomeMessage);
              
              await buttonInteraction.editReply({ 
                content: `✅ Ticket vytvorený: ${ticketChannel}`,
                ephemeral: true 
              });
            }
            break;
        }
        
        return true; // Handled as template button
      } catch (error) {
        console.error('Error handling template button:', error);
        return false;
      }
    }

    // Handle button interactions (for RSVP, events, templates, etc.)
    const interactionHandler = async (interaction: Interaction) => {
      try {
        if (!interaction.isButton()) return;
        
        const buttonInteraction = interaction as ButtonInteraction;
        console.log(`🔘 Button clicked: ${buttonInteraction.customId} by ${buttonInteraction.user.tag}`);
        
        // Try template button handling first
        const handled = await handleTemplateButton(buttonInteraction, botData.id, client);
        if (handled) return; // Template button handled, skip flow handling
        
        // Get fresh bot data
        const { data: freshBotData } = await supabase
          .from('discord_bots')
          .select('*')
          .eq('id', botData.id)
          .single();
        
        if (!freshBotData) return;
        
        const freshBot = freshBotData as DiscordBot;
        
        // Load flows for this bot
        const flows = await loadFlowsForBot(botData.id);
        
        // Find flows with button_click trigger that match this button ID
        for (const flow of flows) {
          if (flow.trigger_type !== 'button_click') continue;
          
          const buttonId = flow.trigger_config?.button_id;
          if (!buttonId || buttonId !== buttonInteraction.customId) continue;
          
          // Check conditions
          const conditionsPass = checkFlowConditions(flow, null, buttonInteraction.member as GuildMember || undefined);
          if (!conditionsPass) continue;
          
          // Acknowledge the interaction first (required by Discord)
          if (buttonInteraction.deferred || buttonInteraction.replied) {
            // Already handled
          } else {
            await buttonInteraction.deferReply({ ephemeral: true });
          }
          
          // Execute flow actions
          console.log(`✅ Button flow "${flow.name}" matched for button ${buttonInteraction.customId}`);
          await executeFlowActions(flow, null, client, buttonInteraction.member as GuildMember || undefined, buttonInteraction.channel as TextChannel || undefined);
          
          // If no reply was sent, send a default acknowledgment
          if (!buttonInteraction.replied) {
            await buttonInteraction.editReply({ content: '✅ Spracované!' });
          }
          
          break; // Only handle first matching flow
        }
      } catch (error) {
        console.error(`Error handling interaction for bot ${botData.bot_name}:`, error);
        if (interaction.isButton() && !interaction.replied && !interaction.deferred) {
          try {
            await interaction.reply({ content: '❌ Chyba pri spracovaní', ephemeral: true });
          } catch (e) {
            // Ignore if already replied
          }
        }
      }
    };
    
    client.on('interactionCreate', interactionHandler);
    console.log(`📌 Registered interactionCreate handler for bot ${botData.bot_name} (${botData.id})`);

    client.on('error', async (error: Error) => {
      console.error(`❌ Error in bot ${botData.bot_name} (${botData.id}):`, error);
      console.error(`   Error message: ${error.message}`);
      console.error(`   Error stack: ${error.stack}`);
      
      // Only set to error if it's a critical error
      // Some errors might be recoverable
      if (error.message.includes('token') || error.message.includes('Invalid') || error.message.includes('Unauthorized')) {
        await updateBotStatus(botData.id, 'error');
      }
      
      const instance = botInstances.get(botData.id);
      if (instance) {
        instance.isConnected = false;
      }
    });

    client.on('disconnect', async () => {
      console.log(`⚠️ Bot ${botData.bot_name} (${botData.id}) disconnected`);
      
      const instance = botInstances.get(botData.id);
      if (instance) {
        instance.isConnected = false;
      }
      
      // Only set to inactive if bot was previously active
      // Don't change status if it's already error
      const { data: currentBot } = await supabase
        .from('discord_bots')
        .select('status')
        .eq('id', botData.id)
        .single();
      
      if (currentBot && currentBot.status === 'active') {
        await updateBotStatus(botData.id, 'inactive');
      }
    });

    // Store instance
    botInstances.set(botData.id, {
      bot: botData,
      client,
      isConnected: false,
    });

    // Login to Discord
    try {
      console.log(`🔄 Attempting to login bot ${botData.bot_name} (${botData.id})...`);
      console.log(`   Currently running bot instances: ${botInstances.size}`);
      console.log(`   Bot IDs in instances: ${Array.from(botInstances.keys()).join(', ')}`);
      await client.login(decryptedToken);
      // Note: 'ready' event will be fired if login succeeds
      initializingBots.delete(botData.id);
      return true;
    } catch (loginError: any) {
      console.error(`❌ Failed to login bot ${botData.bot_name} (${botData.id}):`, loginError);
      console.error(`   Error message: ${loginError?.message || 'Unknown error'}`);
      console.error(`   Error code: ${loginError?.code || 'N/A'}`);
      await updateBotStatus(botData.id, 'error');
      botInstances.delete(botData.id);
      initializingBots.delete(botData.id);
      return false;
    }
  } catch (error) {
    console.error(`Error initializing bot ${botData.bot_name} (${botData.id}):`, error);
    await updateBotStatus(botData.id, 'error');
    initializingBots.delete(botData.id);
    return false;
  }
}

export async function shutdownBot(botId: string): Promise<void> {
  const instance = botInstances.get(botId);
  if (instance) {
    try {
      await instance.client.destroy();
      await updateBotStatus(botId, 'inactive');
      botInstances.delete(botId);
      console.log(`Bot ${botId} shut down successfully`);
    } catch (error) {
      console.error(`Error shutting down bot ${botId}:`, error);
    }
  }
}

export async function updateBotStatus(botId: string, status: 'active' | 'inactive' | 'error'): Promise<void> {
  try {
    await supabase
      .from('discord_bots')
      .update({ 
        status,
        last_active_at: status === 'active' ? new Date().toISOString() : undefined,
        updated_at: new Date().toISOString()
      })
      .eq('id', botId);
  } catch (error) {
    console.error(`Error updating bot status for ${botId}:`, error);
  }
}

export function getBotInstance(botId: string): BotInstance | undefined {
  return botInstances.get(botId);
}

export function getAllBotInstances(): BotInstance[] {
  return Array.from(botInstances.values());
}

