import type { TelegramBot, TelegramBotCommand, TelegramBotTemplate } from './typesInternal';

export type { TelegramBot, TelegramBotCommand, TelegramBotTemplate };

export interface BotInstance {
  bot: TelegramBot;
  isConnected: boolean;
  isInitialized: boolean;
}

// Re-export internal types
export type {
  TelegramBotStatus,
  TelegramConnectionStatus,
  TelegramBotLanguage,
  TelegramAccessMode,
  TelegramChatType,
  TelegramResponseMode,
  TelegramAITone,
  TelegramAfterHoursMode,
  TelegramCommandType,
} from './typesInternal';

