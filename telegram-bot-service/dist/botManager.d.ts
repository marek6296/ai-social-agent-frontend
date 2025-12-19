import { TelegramBot, BotInstance } from './types';
export declare function loadBotsFromDatabase(): Promise<TelegramBot[]>;
export declare function initializeBot(botData: TelegramBot): Promise<boolean>;
export declare function shutdownBot(botId: string): Promise<void>;
export declare function getAllBotInstances(): BotInstance[];
export declare function getBotInstance(botId: string): BotInstance | undefined;
//# sourceMappingURL=botManager.d.ts.map