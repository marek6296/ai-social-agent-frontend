export interface DiscordBot {
  id: string;
  user_id: string;
  bot_name: string;
  bot_token: string;
  bot_client_id: string | null;
  description: string | null;
  status: 'inactive' | 'active' | 'error';
  bot_type: 'custom' | 'shared';
  
  // AI settings
  tone: 'friendly' | 'professional' | 'casual' | 'formal';
  system_prompt: string | null;
  welcome_message: string | null;
  
  // Behavior settings
  respond_to_all_messages?: boolean;
  respond_to_mentions?: boolean;
  respond_in_threads?: boolean;
  allowed_channels?: string[] | null;
  ignored_channels?: string[] | null;
  command_prefix?: string | null;
  enable_commands?: boolean;
  auto_reply_enabled?: boolean;
  mention_in_reply?: boolean;
  
  // Basic settings
  bot_language?: string;
  timezone?: string;
  admin_roles?: string[] | null;
  logs_channel_id?: string | null;
  message_cooldown_seconds?: number;
  max_response_tokens?: number;
  
  // Response mode (ai = bot + AI, rules = len bot)
  response_mode?: 'ai' | 'rules';
  ai_enabled?: boolean;
  
  // AI Chat / Knowledge settings
  knowledge_source_type?: 'none' | 'faq' | 'uploaded' | 'custom';
  knowledge_files?: any[] | null;
  faq_entries?: any[] | null;
  custom_knowledge_text?: string | null;
  ai_persona?: string | null;
  ai_do_list?: string | null;
  ai_dont_list?: string | null;
  ai_answer_style?: 'short' | 'medium' | 'long' | 'bullet_points' | 'paragraph';
  ai_cta_text?: string | null;
  ai_blocklist_words?: string[] | null;
  ai_human_handoff_enabled?: boolean;
  ai_human_handoff_channel_id?: string | null;
  
  // Limits (for shared bots)
  monthly_message_limit?: number;
  max_servers?: number;
  messages_this_month?: number;
}

export interface BotInstance {
  bot: DiscordBot;
  client: any; // Discord.js Client
  isConnected: boolean;
}

