"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAIResponse = generateAIResponse;
const aiApiCalls = new Map(); // messageKey -> timestamp
const AI_DEBOUNCE_MS = 5000; // 5 seconds
async function generateAIResponse(messageText, bot, userId, chatId) {
    // Prevent duplicate API calls
    const messageKey = `${chatId}-${userId}-${messageText.substring(0, 50)}`;
    const lastCall = aiApiCalls.get(messageKey);
    const now = Date.now();
    if (lastCall && (now - lastCall) < AI_DEBOUNCE_MS) {
        console.log(`⚠️ Duplicate AI API call prevented for message: ${messageText.substring(0, 50)}...`);
        return null;
    }
    aiApiCalls.set(messageKey, now);
    // Clean up old entries
    if (aiApiCalls.size > 1000) {
        const firstEntry = aiApiCalls.keys().next().value;
        if (firstEntry) {
            aiApiCalls.delete(firstEntry);
        }
    }
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.error('❌ Missing OPENAI_API_KEY');
        return null;
    }
    // Build system prompt
    const systemPrompt = buildSystemPrompt(bot);
    // Build messages for API
    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: messageText },
    ];
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: messages,
                temperature: 0.7,
                max_tokens: bot.ai_max_response_tokens || 300,
                top_p: 0.9,
            }),
        });
        const data = await response.json();
        if (!response.ok) {
            console.error('OpenAI API error:', data);
            return null;
        }
        const reply = data.choices?.[0]?.message?.content?.trim();
        return reply || null;
    }
    catch (error) {
        console.error('Error calling OpenAI API:', error);
        return null;
    }
}
function buildSystemPrompt(bot) {
    let prompt = `Si AI chatbot s názvom "${bot.public_name || bot.bot_name}".\n\n`;
    if (bot.description) {
        prompt += `Popis: ${bot.description}\n\n`;
    }
    // AI tone
    if (bot.ai_tone === 'friendly') {
        prompt += 'Odpovedáš priateľsky, ľudsky a zrozumiteľne.\n';
    }
    else if (bot.ai_tone === 'professional') {
        prompt += 'Odpovedáš profesionálne a formálne.\n';
    }
    else if (bot.ai_tone === 'funny') {
        prompt += 'Odpovedáš vtipne a uvoľnene.\n';
    }
    else if (bot.ai_tone === 'custom' && bot.ai_custom_tone) {
        prompt += `${bot.ai_custom_tone}\n`;
    }
    // Knowledge sources
    if (bot.ai_custom_knowledge_text) {
        prompt += `\nDodatočné informácie:\n${bot.ai_custom_knowledge_text}\n\n`;
    }
    // FAQ entries
    if (bot.ai_faq_entries && bot.ai_faq_entries.length > 0) {
        prompt += `\nČasto kladené otázky:\n`;
        bot.ai_faq_entries.forEach((faq) => {
            if (faq.question && faq.answer) {
                prompt += `Q: ${faq.question}\nA: ${faq.answer}\n\n`;
            }
        });
    }
    // Forbidden topics
    if (bot.ai_forbidden_topics && bot.ai_forbidden_topics.length > 0) {
        prompt += `\nZakázané témy: ${bot.ai_forbidden_topics.join(', ')}\n`;
    }
    prompt += `\nPravidlá:
- Odpovedaj vždy v jazyku ${bot.bot_language}.
- Buď stručný a užitočný.
- Ak niečo nevieš, priznaj to a navrhni kontakt alebo ďalšie kroky.
- NIKDY sa nepredstavuj ako ChatGPT alebo OpenAI model.`;
    return prompt.trim();
}
//# sourceMappingURL=aiClient.js.map