import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// CORS headers
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const message = (body?.message as string | undefined)?.trim() || "";
    const botId = (body?.botId as string | undefined) || null;
    const conversationHistory = (body?.conversationHistory as Array<{ role: string; content: string }> | undefined) || [];

    if (!message) {
      return NextResponse.json(
        { error: "Žiadna správa nebola odoslaná." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    if (!botId) {
      return NextResponse.json(
        { error: "Bot ID je povinný." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Načítaj Discord bot nastavenia
    const { data: botData, error: botError } = await supabaseServer
      .from("discord_bots")
      .select("bot_name, description, tone, system_prompt, welcome_message, user_id, ai_persona, ai_do_list, ai_dont_list, knowledge_source_type, custom_knowledge_text, max_response_tokens, response_mode, ai_enabled")
      .eq("id", botId)
      .single();

    if (botError || !botData) {
      return NextResponse.json(
        { error: "Bot nebol nájdený." },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    // Check if AI is enabled (response_mode === 'ai' or ai_enabled === true)
    const isAIEnabled = botData.response_mode === 'ai' || botData.ai_enabled === true;
    
    if (!isAIEnabled) {
      return NextResponse.json(
        { error: "AI je deaktivované pre tohto bota. Bot funguje len s pravidlami a šablónami." },
        { status: 403, headers: CORS_HEADERS }
      );
    }

    // Vytvor system prompt z Discord bot nastavení
    const botName = botData.bot_name || "Discord Bot";
    const description = botData.description || "";
    const tone = botData.tone || "friendly";
    const customSystemPrompt = botData.system_prompt || null;
    const welcomeMessage = botData.welcome_message || null;
    const aiPersona = botData.ai_persona || null;
    const aiDoList = botData.ai_do_list || null;
    const aiDontList = botData.ai_dont_list || null;
    const maxTokens = botData.max_response_tokens || 300;
    const knowledgeSourceType = botData.knowledge_source_type || "none";
    const customKnowledgeText = botData.custom_knowledge_text || null;
    const faqEntries = botData.faq_entries || [];

    // Tone text
    const toneText =
      tone === "formal"
        ? "Odpovedáš profesionálne, vecne a formálne, ale stále príjemným tónom."
        : tone === "professional"
        ? "Odpovedáš profesionálne a kompetentne."
        : tone === "casual"
        ? "Odpovedáš veľmi uvoľneným, priateľským a moderným tónom, môžeš použiť aj mierny slang, ale musíš zostať zrozumiteľný."
        : "Odpovedáš priateľsky, ľudsky a zrozumiteľne, moderným ale slušným tónom.";

    // System prompt - VŽDY používaj všetky nastavenia, aj keď existuje custom system_prompt
    // Custom system_prompt sa pridá ako dodatočný kontext, ale všetky ostatné nastavenia sa vždy použijú
    let promptParts: string[] = [];
    
    // KRITICKÉ: VŽDY začni s identitou bota - toto je NAJDÔLEŽITEJŠIE
    const identityPrompt = `TY SI "${botName}". Tvoje meno je "${botName}".\nNIE si ChatGPT. NIE si jazykový model OpenAI. NIE si OpenAI asistent.\nSI "${botName}", Discord bot asistent.`;
    promptParts.push(identityPrompt);
    
    // Persona alebo Description (VŽDY pridaj, ak existuje)
    if (aiPersona) {
      promptParts.push(`\n${aiPersona}`);
    } else if (description) {
      promptParts.push(`\n${description}`);
    }
    
    // Tone (VŽDY pridaj)
    promptParts.push(`\n${toneText}`);
    
    // Custom System Prompt (ak existuje, pridaj ho ako dodatočný kontext)
    if (customSystemPrompt) {
      promptParts.push(`\n\nDODATOČNÉ INŠTRUKCIE:\n${customSystemPrompt}`);
    }
    
    // Do list (VŽDY pridaj, ak existuje)
    if (aiDoList) {
      promptParts.push(`\n\nČO MÁŠ ROBIŤ:\n${aiDoList}`);
    }
    
    // Don't list (VŽDY pridaj, ak existuje)
    if (aiDontList) {
      promptParts.push(`\n\nČO NEMÁŠ ROBIŤ:\n${aiDontList}`);
    }
    
    // Knowledge source (VŽDY pridaj, ak existuje)
    if (knowledgeSourceType === "custom" && customKnowledgeText) {
      promptParts.push(`\n\nKONTEXT A VEDOMOSTI:\n${customKnowledgeText}`);
    }
    
    // FAQ entries (VŽDY pridaj, ak existuje)
    if (knowledgeSourceType === "faq" && Array.isArray(faqEntries) && faqEntries.length > 0) {
      const faqText = faqEntries.map((entry: any) => {
        const q = entry.question || entry.q || "";
        const a = entry.answer || entry.a || "";
        return `Q: ${q}\nA: ${a}`;
      }).join("\n\n");
      promptParts.push(`\n\nČASTO KLADENÉ OTÁZKY (FAQ):\n${faqText}`);
    }
      
      // Kritické pravidlá (vždy)
      promptParts.push(`
KRITICKÉ PRAVIDLÁ PRE DISCORD KONVERZÁCIU:
1. IDENTITA (NAJDÔLEŽITEJŠIE - VŽDY DODRŽI):
   - Tvoje meno je "${botName}"
   - SI "${botName}", Discord bot asistent
   - NIKDY nehovor, že si ChatGPT, OpenAI model, jazykový model, alebo asistent OpenAI
   - NIKDY nehovor "Som jazykový model", "Som vytvorený OpenAI", "Nemám vlastné meno", alebo podobné frázy
   - NIKDY nehovor "Môžeš ma nazvať ChatGPT" alebo podobne
   - Ak sa ťa niekto spýta "Kto si?" alebo "Ako sa voláš?", VŽDY odpovedz: "Som ${botName}" alebo "${botName}"
   - Ak sa ťa niekto spýta o promptoch, vysvetli svoju funkciu ako "${botName}", nie ako ChatGPT alebo OpenAI model

2. KONTEXT A HISTÓRIA KONVERZÁCIE:
   - Vždy sa pozri na históriu konverzácie (conversationHistory) pred odpoveďou
   - Pokračuj v téme, ktorá sa rieši v konverzácii
   - Odkazuj sa na predchádzajúce správy, ak je to relevantné
   - Rieš konkrétne to, na čo sa používateľ pýta, nie niečo iné

3. ZDRAVENIE A PREDSTAVOVANIE:
   - NIKDY sa nezdrav, ak už prebieha konverzácia (ak v histórii sú predchádzajúce správy)
   - Zdrav a predstav sa LEN na úplnom začiatku konverzácie (ak je história prázdna)
   - NIKDY sa nepredstavuj v každej odpovedi
   - NEPIS "Ahoj" alebo "Dobrý deň" v každej správe
   - Keď sa predstavuješ, povedz "${botName}" alebo podľa tvojej identity

4. ODPOVEĎ:
   - Odpovedaj PRIAMO na otázku alebo komentár
   - Buď relevantný k téme konverzácie
   - Ak používateľ pokračuje v téme, pokračuj v tej istej téme
   - Ak používateľ zmení tému, reaguj na novú tému

5. JAZYK A STYL:
   - Odpovedaj v slovenčine (alebo jazyku, ktorým sa používateľ spýta)
   - Buď stručný, ale konkrétny
   - Buď priateľský a užitočný, ale NEPREHÁŇAJ s pozdravmi
   - Ak niečo nevieš, priznaj to
      `.trim());
    
    // Spoj všetky časti do system promptu
    let systemPrompt = promptParts.join("\n\n");
    
    // KRITICKÉ: Pridaj finálnu pripomienku o identite (na konci, aby bola fresh v pamäti)
    // VŽDY pridaj, aj keď existuje custom system_prompt
    systemPrompt += `\n\nZAPAMATAJ SI: Tvoje meno je "${botName}". SI "${botName}", Discord bot. NIE si ChatGPT ani OpenAI model.`;
    
    // Debug log (vždy, pre debugging)
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

    // Volanie OpenAI API (používame fetch namiesto SDK pre lepšiu kompatibilitu)
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Chýba OPENAI_API_KEY na serveri." },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: messagesForAPI,
        temperature: 0.7, // Stredná teplota pre lepšie dodržiavanie inštrukcií
        max_tokens: maxTokens, // Použi nastavenie z databázy
        top_p: 0.9, // Dodatočný parameter pre lepšie dodržiavanie inštrukcií
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI API error", data);
      const message =
        (data as any)?.error?.message || "OpenAI API error (neznáma chyba).";
      return NextResponse.json(
        { error: message },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    const reply = data?.choices?.[0]?.message?.content?.trim() || "";

    if (!reply) {
      return NextResponse.json(
        { error: "Nepodarilo sa vygenerovať odpoveď." },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(
      { reply },
      { headers: CORS_HEADERS }
    );
  } catch (error: any) {
    console.error("Error in Discord chat API:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

