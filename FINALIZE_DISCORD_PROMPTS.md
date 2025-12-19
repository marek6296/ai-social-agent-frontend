# Finalizácia Discord bot prompts

## Problém
Bot nepoužíval všetky nastavenia z databázy - iba bot_name fungovalo.

## Riešenie
1. Odstránený if-else blok - teraz sa VŽDY používajú všetky nastavenia
2. Pridaná podpora pre welcome_message
3. Vylepšený debug logging

## Potrebné zmeny v app/api/chat/discord/route.ts

### 1. Pridaj welcome_message do premenných (okolo riadku 65):
```typescript
const welcomeMessage = botData.welcome_message || null;
```

### 2. Zmeň messagesForAPI (okolo riadku 195):
```typescript
// Zostav správy pre OpenAI
// Ak je to prvá správa v konverzácii a existuje welcome_message, pridaj ju
const isFirstMessage = conversationHistory.length === 0;
const messagesForAPI: Array<{ role: string; content: string }> = [
  { role: "system", content: systemPrompt },
];

// Pridaj welcome message ako prvú assistant správu, ak je to začiatok konverzácie
if (isFirstMessage && welcomeMessage) {
  messagesForAPI.push({ role: "assistant", content: welcomeMessage });
}

// Pridaj históriu konverzácie a aktuálnu správu
messagesForAPI.push(...conversationHistory);
messagesForAPI.push({ role: "user", content: message });
```

### 3. Vylepšený debug logging (okolo riadku 189):
```typescript
console.log(`[Discord Bot API] Bot ID: ${botId}, Bot Name: ${botName}`);
console.log(`[Discord Bot API] Has custom system_prompt: ${!!customSystemPrompt}`);
console.log(`[Discord Bot API] Has welcome_message: ${!!welcomeMessage}`);
console.log(`[Discord Bot API] Has ai_persona: ${!!aiPersona}`);
console.log(`[Discord Bot API] Has ai_do_list: ${!!aiDoList}`);
console.log(`[Discord Bot API] Has ai_dont_list: ${!!aiDontList}`);
console.log(`[Discord Bot API] Has custom_knowledge: ${!!customKnowledgeText}`);
console.log(`[Discord Bot API] Knowledge source type: ${knowledgeSourceType}`);
console.log(`[Discord Bot API] System prompt length: ${systemPrompt.length}`);
console.log(`[Discord Bot API] System prompt preview (first 500 chars):\n${systemPrompt.substring(0, 500)}`);
```


