import { DiscordBot } from './types';

// Load environment variables explicitly
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Log API URL for debugging (only in development)
if (process.env.NODE_ENV !== 'production') {
  console.log(`🔗 AI API URL: ${API_URL}`);
}

interface ChatResponse {
  reply: string;
  useLeadsForm?: boolean;
  widgetPosition?: string;
  error?: string;
}

// Track AI API calls to prevent duplicate calls
const aiApiCalls = new Map<string, number>(); // messageKey -> timestamp

export async function generateAIResponse(
  message: string,
  bot: DiscordBot,
  conversationHistory: Array<{ role: string; content: string }> = [],
  messageId?: string
): Promise<string | null> {
  // CRITICAL: Check and mark IMMEDIATELY (synchronously) to prevent race conditions
  // This must be done BEFORE any async operations
  const apiCallKey = messageId ? `${messageId}-${bot.id}` : `${message}-${bot.id}-${Date.now()}`;
  const now = Date.now();
  const lastCallTime = aiApiCalls.get(apiCallKey);
  
  if (lastCallTime && (now - lastCallTime) < 5000) { // 5 second debounce (increased from 2s)
      console.log(`⚠️ Duplicate AI API call prevented for ${apiCallKey} (last call ${now - lastCallTime}ms ago)`);
      return null;
    }
    
    // Mark as called IMMEDIATELY (synchronously) to prevent race conditions
    aiApiCalls.set(apiCallKey, now);
    
  try {
    
    // Clean up old entries
    if (aiApiCalls.size > 500) {
      const firstEntry = aiApiCalls.keys().next().value;
      if (firstEntry) {
        aiApiCalls.delete(firstEntry);
      }
    }
    
    console.log(`🤖 Generating AI response for bot ${bot.bot_name} (message: ${message.substring(0, 50)}...)`);
    
    // Use Discord-specific chat endpoint that uses Discord bot prompts
    const response = await fetch(`${API_URL}/api/chat/discord`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        botId: bot.id, // Send bot ID instead of user_id
        conversationHistory,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText.substring(0, 200) || `HTTP ${response.status}: ${response.statusText}` };
      }
      console.error('AI API error:', errorData);
      console.error(`API URL: ${API_URL}/api/chat/discord`);
      console.error(`Response status: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json() as ChatResponse;
    
    if (data.error) {
      console.error('AI API returned error:', data.error);
      return null;
    }

    const reply = data.reply || null;
    console.log(`✅ AI API response generated successfully (length: ${reply?.length || 0} chars)`);
    return reply;
  } catch (error) {
    console.error('Error calling AI API:', error);
    return null;
  }
}

