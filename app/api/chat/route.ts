import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    const text = (message as string | undefined)?.trim();

    if (!text) {
      return NextResponse.json(
        { error: "Žiadna správa nebola odoslaná." },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Chýba OPENAI_API_KEY na serveri." },
        { status: 500 }
      );
    }

    // --- načítanie nastavení bota z Supabase (prvý záznam) ---
    let companyName = "AI Social Agent";
    let botName = "AI asistent";
    let description =
      "Pomáha návštevníkom pochopiť, čo služba AI Social Agent robí a ako môže pomôcť firmám s AI chatbotmi a automatizáciou.";
    let tone: "friendly" | "formal" | "casual" = "friendly";

    try {
      const { data, error } = await supabase
        .from("bot_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        if (data.company_name) companyName = data.company_name;
        if (data.bot_name) botName = data.bot_name;
        if (data.description) description = data.description;
        if (data.tone === "formal" || data.tone === "casual" || data.tone === "friendly") {
          tone = data.tone;
        }
      } else if (error) {
        console.warn("Nepodarilo sa načítať bot_settings, používam default:", error.message);
      }
    } catch (settingsError) {
      console.warn("Chyba pri načítaní bot_settings:", settingsError);
    }

    // --- system prompt podľa nastavení ---
    const toneText =
      tone === "formal"
        ? "Odpovedáš profesionálne, vecne a formálne, ale stále príjemným tónom."
        : tone === "casual"
        ? "Odpovedáš veľmi uvoľneným, priateľským a moderným tónom, pokojne môžeš použiť aj slang, ale stále musíš byť jasný a zrozumiteľný."
        : "Odpovedáš priateľsky, ľudsky a zrozumiteľne, moderným ale slušným tónom.";

    const systemPrompt = `
Si AI chatbot s názvom "${botName}" pre firmu "${companyName}".
${description}

${toneText}
Vždy odpovedaj v slovenskom jazyku, stručne a jasne. 
Ak niečo nevieš alebo nemáš istotu, úprimne to priznaj a navrhni, ako môže používateľ získať odpoveď.
Ak sa používateľ pýta na produkt AI Social Agent, vysvetli, že ide o službu, ktorá firmám ponúka embedovateľného AI chatbota na web a ďalšie nástroje pre automatizáciu komunikácie so zákazníkmi.
    `.trim();

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: text,
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI API error", data);
      const message =
        (data as any)?.error?.message || "OpenAI API error (neznáma chyba).";
      return NextResponse.json(
        { error: message },
        { status: 500 }
      );
    }

    const reply =
      data?.choices?.[0]?.message?.content ||
      "Ospravedlňujem sa, momentálne neviem vytvoriť odpoveď.";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("API /api/chat error:", error);
    return NextResponse.json(
      { error: "Nastala chyba pri spracovaní požiadavky." },
      { status: 500 }
    );
  }
}