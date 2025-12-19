import { Message, GuildMember, Client, TextChannel, ThreadChannel } from 'discord.js';
import { supabase } from './supabase';

export interface Flow {
  id: string;
  bot_id: string;
  module: string;
  name: string;
  enabled: boolean;
  priority: number;
  trigger_type: string;
  trigger_config: any;
  conditions: any;
  actions: Array<{
    type: string;
    config: any;
  }>;
  ai_config?: any;
}

// Cache flows per bot
const flowsCache = new Map<string, { flows: Flow[]; timestamp: number }>();
const FLOW_CACHE_TTL = 30000; // 30 seconds

// Invalidate cache for a bot (call this after saving flows)
export function invalidateFlowCache(botId: string) {
  flowsCache.delete(botId);
}

export async function loadFlowsForBot(botId: string): Promise<Flow[]> {
  // Check cache
  const cached = flowsCache.get(botId);
  const now = Date.now();
  if (cached && (now - cached.timestamp) < FLOW_CACHE_TTL) {
    return cached.flows;
  }

  try {
    const { data, error } = await supabase
      .from('discord_bot_flows')
      .select('*')
      .eq('bot_id', botId)
      .eq('enabled', true)
      .order('priority', { ascending: true });

    if (error) {
      console.error(`Error loading flows for bot ${botId}:`, error);
      return [];
    }

    const flows = (data || []) as Flow[];
    flowsCache.set(botId, { flows, timestamp: now });
    return flows;
  } catch (error) {
    console.error(`Unexpected error loading flows for bot ${botId}:`, error);
    return [];
  }
}

export function clearFlowCache(botId?: string) {
  if (botId) {
    flowsCache.delete(botId);
  } else {
    flowsCache.clear();
  }
}

// Check if flow conditions are met
export function checkFlowConditions(
  flow: Flow,
  message: Message,
  member?: GuildMember
): boolean {
  const conditions = flow.conditions || {};

  // Check channels
  if (conditions.channels && Array.isArray(conditions.channels) && conditions.channels.length > 0) {
    if (!conditions.channels.includes(message.channel.id)) {
      return false;
    }
  }

  // Check ignored channels
  if (conditions.ignored_channels && Array.isArray(conditions.ignored_channels)) {
    if (conditions.ignored_channels.includes(message.channel.id)) {
      return false;
    }
  }

  // Check required roles
  if (conditions.require_roles && Array.isArray(conditions.require_roles) && conditions.require_roles.length > 0) {
    if (!member || !member.roles.cache.some(role => conditions.require_roles.includes(role.id))) {
      return false;
    }
  }

  // Check admin only
  if (conditions.admin_only === true) {
    if (!member || !member.permissions.has('Administrator')) {
      return false;
    }
  }

  // Check once per user (cooldown per user)
  if (conditions.once_per_user === true) {
    // This would need to be tracked in a database/cache
    // For now, skip this check
  }

  // Check cooldown
  if (conditions.cooldown_seconds && conditions.cooldown_seconds > 0) {
    // This would need to be tracked per user/channel/server
    // For now, skip this check
  }

  return true;
}

// Check if flow trigger matches
export function checkFlowTrigger(
  flow: Flow,
  message: Message,
  triggerType: 'new_message' | 'mention' | 'member_join' | 'button_click' | 'select_menu' | 'modal_submit'
): boolean {
  switch (flow.trigger_type) {
    case 'new_message':
      return triggerType === 'new_message';
    
    case 'button_click':
      // For button clicks, we need the button ID from trigger_config
      // This will be checked by the interaction handler separately
      return triggerType === 'button_click';
    
    case 'mention':
      return triggerType === 'mention' && message?.mentions.has(message.client.user!);
    
    case 'keyword_match':
      if (triggerType !== 'new_message' && triggerType !== 'mention') return false;
      let keywords = flow.trigger_config?.keywords;
      
      // Handle both string (comma-separated) and array formats
      if (typeof keywords === 'string') {
        keywords = keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
      }
      
      if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
        console.log(`Flow ${flow.id} keyword_match: no valid keywords found`, flow.trigger_config);
        return false;
      }
      
      const messageText = message.content.toLowerCase();
      const matched = keywords.some((keyword: string) => messageText.includes(keyword.toLowerCase()));
      
      if (!matched) {
        console.log(`Flow ${flow.id} keyword_match: no match. Keywords:`, keywords, `Message:`, message.content);
      } else {
        console.log(`Flow ${flow.id} keyword_match: MATCHED! Keywords:`, keywords, `Message:`, message.content);
      }
      
      return matched;
    
    case 'regex_match':
      if (triggerType !== 'new_message' && triggerType !== 'mention') return false;
      const pattern = flow.trigger_config?.pattern;
      if (!pattern) return false;
      try {
        const regex = new RegExp(pattern, 'i');
        return regex.test(message.content);
      } catch (e) {
        console.error(`Invalid regex pattern in flow ${flow.id}:`, pattern);
        return false;
      }
    
    case 'slash_command':
      if (triggerType !== 'new_message') return false;
      const command = flow.trigger_config?.command;
      if (!command) return false;
      return message.content.startsWith(`/${command}`);
    
    case 'member_join':
      return triggerType === 'member_join';
    
    default:
      return false;
  }
}

// Execute flow actions
export async function executeFlowActions(
  flow: Flow,
  message: Message | null,
  client: Client,
  member?: GuildMember,
  channel?: TextChannel | ThreadChannel
): Promise<void> {
  if (!flow.actions || flow.actions.length === 0) {
    console.log(`Flow ${flow.id} has no actions`);
    return;
  }

  for (const action of flow.actions) {
    try {
      await executeAction(action, message, client, member, channel);
    } catch (error) {
      console.error(`Error executing action ${action.type} for flow ${flow.id}:`, error);
      // Continue with next action
    }
  }
}

async function executeAction(
  action: { type: string; config: any },
  message: Message | null,
  client: Client,
  member?: GuildMember,
  defaultChannel?: TextChannel | ThreadChannel
): Promise<void> {
  const config = action.config || {};
  const guild = message?.guild || member?.guild;

  switch (action.type) {
    case 'send_message': {
      const text = config.text || '';
      // Use channel_id from config, or fallback to message channel, or defaultChannel
      const channelId = config.channel_id || message?.channel.id || defaultChannel?.id;
      
      if (!channelId) {
        console.error('send_message action requires channel_id or message/defaultChannel');
        break;
      }
      
      const channel = await client.channels.fetch(channelId);
      
      if (channel instanceof TextChannel || channel instanceof ThreadChannel) {
        // Replace placeholders
        let finalText = text;
        if (member) {
          finalText = finalText.replace(/{user}/g, member.user.username);
          finalText = finalText.replace(/{mention}/g, member.toString());
        } else if (message?.author) {
          finalText = finalText.replace(/{user}/g, message.author.username);
          finalText = finalText.replace(/{mention}/g, message.author.toString());
        }
        if (guild) {
          finalText = finalText.replace(/{server}/g, guild.name);
        }
        
        await channel.send(finalText);
      }
      break;
    }

    case 'send_dm': {
      if (!member) break;
      const text = config.text || '';
      let finalText = text.replace(/{user}/g, member.user.username);
      if (guild) {
        finalText = finalText.replace(/{server}/g, guild.name);
      }
      await member.send(finalText);
      break;
    }

    case 'send_embed': {
      // Use channel_id from config, or fallback to message channel, or defaultChannel
      const channelId = config.channel_id || message?.channel.id || defaultChannel?.id;
      
      if (!channelId) {
        console.error('send_embed action requires channel_id or message/defaultChannel');
        break;
      }
      
      const channel = await client.channels.fetch(channelId);
      
      if (channel instanceof TextChannel || channel instanceof ThreadChannel) {
        const { EmbedBuilder } = await import('discord.js');
        const embed = new EmbedBuilder();
        
        if (config.title) embed.setTitle(config.title);
        if (config.description) {
          let desc = config.description;
          if (member) {
            desc = desc.replace(/{user}/g, member.user.username);
            desc = desc.replace(/{mention}/g, member.toString());
          }
          if (guild) {
            desc = desc.replace(/{server}/g, guild.name);
          }
          embed.setDescription(desc);
        }
        // Handle color (can be hex string like "#22C55E" or number)
        if (config.color) {
          if (typeof config.color === 'string' && config.color.startsWith('#')) {
            embed.setColor(parseInt(config.color.replace('#', ''), 16));
          } else if (typeof config.color === 'number') {
            embed.setColor(config.color);
          }
        }
        
        if (config.image_url) embed.setImage(config.image_url);
        if (config.footer) embed.setFooter({ text: config.footer });
        
        // Handle fields (array of { name, value, inline })
        if (config.fields && Array.isArray(config.fields)) {
          for (const field of config.fields) {
            if (field.name && field.value) {
              embed.addFields({
                name: field.name,
                value: field.value,
                inline: field.inline !== undefined ? field.inline : false,
              });
            }
          }
        }
        
        // Handle timestamp (Discord timestamp format like <t:1234567890:F>)
        // If timestamp is provided, extract the number and set it
        if (config.timestamp) {
          // Extract Unix timestamp from Discord format <t:1234567890:F> or just use number
          const timestampMatch = typeof config.timestamp === 'string' 
            ? config.timestamp.match(/<t:(\d+):[Ff]>|<t:(\d+)>/)
            : null;
          const unixTimestamp = timestampMatch 
            ? parseInt(timestampMatch[1] || timestampMatch[2], 10) 
            : typeof config.timestamp === 'number' 
              ? config.timestamp 
              : parseInt(config.timestamp, 10);
          
          if (!isNaN(unixTimestamp)) {
            embed.setTimestamp(new Date(unixTimestamp * 1000)); // Discord.js expects Date object
          }
        }
        
        await channel.send({ embeds: [embed] });
      }
      break;
    }

    case 'assign_role': {
      if (!member || !config.role_id) break;
      const role = guild?.roles.cache.get(config.role_id);
      if (role) {
        if (config.remove) {
          await member.roles.remove(role);
        } else {
          await member.roles.add(role);
        }
      }
      break;
    }

    case 'ping_role': {
      const roleId = config.role_id;
      const targetChannel = defaultChannel || message?.channel;
      if (roleId && guild && targetChannel && (targetChannel instanceof TextChannel || targetChannel instanceof ThreadChannel)) {
        const role = guild.roles.cache.get(roleId);
        if (role) {
          await targetChannel.send(role.toString());
        }
      }
      break;
    }

    case 'send_buttons': {
      const channelId = config.channel_id || message?.channel.id || defaultChannel?.id;
      if (!channelId) {
        console.error('send_buttons action requires channel_id.');
        break;
      }
      const channel = await client.channels.fetch(channelId);
      if (channel instanceof TextChannel || channel instanceof ThreadChannel) {
        const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = await import('discord.js');
        
        // Build buttons
        const buttons = (config.buttons || []).map((btn: any) => {
          let style: ButtonStyle;
          switch (btn.style?.toLowerCase()) {
            case 'success':
            case 'green':
              style = ButtonStyle.Success;
              break;
            case 'danger':
            case 'red':
              style = ButtonStyle.Danger;
              break;
            case 'secondary':
            case 'grey':
            case 'gray':
              style = ButtonStyle.Secondary;
              break;
            case 'primary':
            case 'blue':
            default:
              style = ButtonStyle.Primary;
          }
          
          return new ButtonBuilder()
            .setCustomId(btn.id)
            .setLabel(btn.label)
            .setStyle(style);
        });
        
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);
        
        // Build message content
        const messageContent: any = {
          content: config.message || '',
          components: [row],
        };
        
        // If embed is provided, include it
        if (config.embed) {
          const embedConfig = config.embed;
          const embed = new EmbedBuilder();
          
          if (embedConfig.title) embed.setTitle(embedConfig.title);
          if (embedConfig.description) embed.setDescription(embedConfig.description);
          
          // Handle color
          if (embedConfig.color) {
            if (typeof embedConfig.color === 'string' && embedConfig.color.startsWith('#')) {
              embed.setColor(parseInt(embedConfig.color.replace('#', ''), 16));
            } else if (typeof embedConfig.color === 'number') {
              embed.setColor(embedConfig.color);
            }
          }
          
          if (embedConfig.image_url) embed.setImage(embedConfig.image_url);
          if (embedConfig.footer) embed.setFooter({ text: embedConfig.footer });
          
          // Handle fields
          if (embedConfig.fields && Array.isArray(embedConfig.fields)) {
            for (const field of embedConfig.fields) {
              if (field.name && field.value) {
                embed.addFields({
                  name: field.name,
                  value: field.value,
                  inline: field.inline !== undefined ? field.inline : false,
                });
              }
            }
          }
          
          // Handle timestamp
          if (embedConfig.timestamp) {
            const unixTimestamp = typeof embedConfig.timestamp === 'number' 
              ? embedConfig.timestamp 
              : parseInt(String(embedConfig.timestamp), 10);
            
            if (!isNaN(unixTimestamp)) {
              embed.setTimestamp(new Date(unixTimestamp * 1000));
            }
          }
          
          messageContent.embeds = [embed];
        }
        
        await channel.send(messageContent);
      }
      break;
    }

    case 'ai_response': {
      // This would need to call the AI API
      // For now, skip or use existing AI response logic
      console.log('AI response action not yet implemented');
      break;
    }

    case 'send_template': {
      // Send a message template
      const templateId = config.template_id;
      const channelId = config.channel_id || message?.channel.id || defaultChannel?.id;
      
      if (!templateId || !channelId) {
        console.error('send_template action requires template_id and channel_id');
        break;
      }
      
      // Load template from database
      const { data: template } = await supabase
        .from('discord_message_templates')
        .select('*')
        .eq('id', templateId)
        .single();
      
      if (!template) {
        console.error(`Template ${templateId} not found`);
        break;
      }
      
      const channel = await client.channels.fetch(channelId);
      if (!(channel instanceof TextChannel || channel instanceof ThreadChannel)) {
        console.error(`Channel ${channelId} is not a text channel`);
        break;
      }
      
      // Get current page
      const currentPageIndex = template.current_page_index || 0;
      const pages = template.pages_json || [];
      const currentPage = pages[currentPageIndex] || {
        embed: template.embed_json || {},
        components: template.components_json || {},
      };
      
      // Build embed
      const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = await import('discord.js');
      const embed = new EmbedBuilder();
      
      if (currentPage.embed.title) embed.setTitle(currentPage.embed.title);
      if (currentPage.embed.description) embed.setDescription(currentPage.embed.description);
      if (currentPage.embed.color) {
        const color = typeof currentPage.embed.color === 'string' && currentPage.embed.color.startsWith('#')
          ? parseInt(currentPage.embed.color.replace('#', ''), 16)
          : currentPage.embed.color;
        embed.setColor(color);
      }
      if (currentPage.embed.thumbnail) embed.setThumbnail(currentPage.embed.thumbnail);
      if (currentPage.embed.image) embed.setImage(currentPage.embed.image);
      if (currentPage.embed.footer) embed.setFooter({ text: currentPage.embed.footer });
      
      if (currentPage.embed.fields) {
        for (const field of currentPage.embed.fields) {
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
      if (currentPage.components?.buttons && currentPage.components.buttons.length > 0) {
        const buttons = currentPage.components.buttons.map((btn: any) => {
          let style: ButtonStyle;
          switch (btn.style) {
            case 'success': style = ButtonStyle.Success; break;
            case 'danger': style = ButtonStyle.Danger; break;
            case 'secondary': style = ButtonStyle.Secondary; break;
            case 'link': style = ButtonStyle.Link; break;
            default: style = ButtonStyle.Primary;
          }
          
          // Generate custom_id in format: tpl:{template_id}:page:{page_name}:btn:{button_id}
          const pageName = currentPage.name || `page${currentPageIndex}`;
          const customId = `tpl:${templateId}:page:${pageName}:btn:${btn.id}`;
          
          const button = new ButtonBuilder()
            .setCustomId(customId)
            .setLabel(btn.label)
            .setStyle(style);
          
          if (btn.emoji) button.setEmoji(btn.emoji);
          if (btn.url && style === ButtonStyle.Link) button.setURL(btn.url);
          
          return button;
        });
        
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);
        components.push(row);
      }
      
      // Send message
      const sentMessage = await channel.send({
        embeds: [embed],
        components: components,
      });
      
      // Save published message record (bot_id should be in config or we can skip it if not available)
      if (config.bot_id) {
        await supabase.from('discord_published_messages').upsert({
          template_id: templateId,
          bot_id: config.bot_id,
          guild_id: template.guild_id,
          channel_id: channelId,
          message_id: sentMessage.id,
          current_page_index: currentPageIndex,
        });
      }
      
      break;
    }
    
    default:
      console.log(`Unknown action type: ${action.type}`);
  }
}

