// TypeScript typy pre Telegram bot systém

export type TelegramBotStatus = "active" | "inactive" | "error" | "draft";
export type TelegramConnectionStatus = "connected" | "disconnected" | "error";
export type TelegramBotLanguage = "SK" | "EN" | "NO" | "CZ";
export type TelegramAccessMode = "all" | "whitelist";
export type TelegramChatType = "private" | "group" | "channel";
export type TelegramResponseMode = "ai" | "rules"; // Bot + AI alebo Len bot
export type TelegramWebhookMode = "webhook" | "long_polling";
export type TelegramAITone = "friendly" | "professional" | "funny" | "custom";
export type TelegramAfterHoursMode = "auto_reply" | "disable_ai" | "redirect_contact";
export type TelegramCommandType = "text" | "action" | "menu";
export type TelegramLogEventType = "message" | "command" | "button_click" | "error" | "webhook" | "integration";
export type TelegramLogStatus = "success" | "error" | "warning";

export interface TelegramBot {
  id: string;
  user_id: string;
  
  // Základné informácie
  bot_name: string;
  public_name: string | null;
  description: string | null;
  bot_avatar_url: string | null;
  tags: string[] | null;
  
  // Jazyk a lokalizácia
  bot_language: TelegramBotLanguage;
  fallback_languages: string[] | null;
  timezone: string;
  
  // Prepojenie
  bot_token: string | null; // Encrypted
  webhook_url: string | null;
  webhook_enabled: boolean;
  long_polling_enabled: boolean;
  allowed_updates: string[] | null;
  rate_limit_per_minute: number;
  cooldown_seconds: number;
  
  // Status
  status: TelegramBotStatus;
  connection_status: TelegramConnectionStatus;
  last_connection_test: string | null;
  
  // Prístup a bezpečnosť
  access_mode: TelegramAccessMode;
  allowed_users: string[] | null;
  allowed_chat_types: TelegramChatType[];
  admin_users: string[] | null;
  
  // Anti-spam
  anti_spam_enabled: boolean;
  messages_per_user_limit: number;
  blocked_keywords: string[] | null;
  blocked_links: boolean;
  gdpr_privacy_text: string | null;
  
  // Správanie bota
  response_mode: TelegramResponseMode;
  response_delay_ms: number;
  respond_only_on_mention: boolean;
  fallback_message: string;
  
  // Moduly
  module_welcome: boolean;
  module_help: boolean;
  module_auto_replies: boolean;
  module_notifications: boolean;
  module_forms: boolean;
  module_booking: boolean;
  module_support_tickets: boolean;
  module_ai_answers: boolean;
  
  // AI nastavenia
  ai_knowledge_source_types: string[] | null; // faq, uploaded, custom, url
  ai_faq_entries: any[] | null;
  ai_custom_knowledge_text: string | null;
  ai_uploaded_files: any[] | null;
  ai_urls: string[] | null;
  ai_tone: TelegramAITone;
  ai_custom_tone: string | null;
  ai_forbidden_topics: string[] | null;
  ai_human_handoff_enabled: boolean;
  ai_human_handoff_contact: string | null;
  ai_max_response_tokens: number;
  
  // Plánovanie
  working_hours_enabled: boolean;
  working_hours: WorkingHours | null;
  after_hours_mode: TelegramAfterHoursMode;
  after_hours_message: string | null;
  after_hours_contact: string | null;
  
  // Štatistiky
  total_messages: number;
  unique_users: number;
  messages_today: number;
  last_activity: string | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface WorkingHours {
  monday?: { from: string; to: string; enabled: boolean };
  tuesday?: { from: string; to: string; enabled: boolean };
  wednesday?: { from: string; to: string; enabled: boolean };
  thursday?: { from: string; to: string; enabled: boolean };
  friday?: { from: string; to: string; enabled: boolean };
  saturday?: { from: string; to: string; enabled: boolean };
  sunday?: { from: string; to: string; enabled: boolean };
}

export interface TelegramBotCommand {
  id: string;
  bot_id: string;
  command_trigger: string; // /start, /help, custom
  command_type: TelegramCommandType;
  response_text: string | null;
  action_type: string | null;
  action_config: any | null;
  admin_only: boolean;
  private_chat_only: boolean;
  cooldown_seconds: number;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface TelegramBotTemplate {
  id: string;
  bot_id: string;
  template_name: string; // welcome, help, unknown_command, after_hours, error
  template_text: string;
  template_variables: string[]; // {first_name}, {username}, {language}, {time}
  inline_keyboard: TelegramInlineKeyboard | null;
  created_at: string;
  updated_at: string;
}

export interface TelegramInlineKeyboard {
  inline_keyboard: TelegramInlineKeyboardButton[][]; // Rows of buttons
}

export interface TelegramInlineKeyboardButton {
  text: string;
  url?: string;
  callback_data?: string;
  switch_inline_query?: string;
  switch_inline_query_current_chat?: string;
}

export interface TelegramBotIntegration {
  id: string;
  bot_id: string;
  integration_type: string; // webhook, crm, sheets, notion, discord, stripe
  name: string;
  config: IntegrationConfig;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface IntegrationConfig {
  url?: string;
  secret?: string;
  retry_policy?: {
    max_retries: number;
    backoff_multiplier: number;
  };
  events?: string[]; // new_message, new_user, command_used, button_clicked, payment_success
  [key: string]: any;
}

export interface TelegramBotLog {
  id: string;
  bot_id: string;
  event_type: TelegramLogEventType;
  user_id: string | null;
  username: string | null;
  chat_id: string | null;
  chat_type: TelegramChatType | null;
  message_text: string | null;
  event_data: any | null;
  status: TelegramLogStatus;
  error_message: string | null;
  created_at: string;
}

// Form types pre UI
export interface TelegramBotFormData {
  bot_name: string;
  public_name: string;
  description: string;
  bot_language: TelegramBotLanguage;
  fallback_languages: string[];
  timezone: string;
  bot_token: string;
  webhook_enabled: boolean;
  long_polling_enabled: boolean;
  allowed_updates: string[];
  rate_limit_per_minute: number;
  cooldown_seconds: number;
  response_mode: TelegramResponseMode;
  // ... ďalšie polia
}
