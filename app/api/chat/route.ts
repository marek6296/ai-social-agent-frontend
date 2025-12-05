import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = (body?.message as string | undefined)?.trim();

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

    // --- 1) Načítanie nastavení bota z bot_settings (prvý záznam) ---
    let companyName = "AI Social Agent";
    let botName = "AI asistent";
    let description =
      "Pomáha návštevníkom pochopiť, čo služba AI Social Agent robí a ako môže pomôcť firmám s AI chatbotmi a automatizáciou.";
    let tone: "friendly" | "formal" | "casual" = "friendly";
    let ownerUserId: string | null = null;

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
        if (
          data.tone === "formal" ||
          data.tone === "casual" ||
          data.tone === "friendly"
        ) {
          tone = data.tone;
        }
        if (data.user_id) ownerUserId = data.user_id;
      } else if (error) {
        console.warn(
          "Nepodarilo sa načítať bot_settings, používam default:",
          error.message
        );
      }
    } catch (settingsError) {
      console.warn("Chyba pri načítaní bot_settings:", settingsError);
    }

    // --- 2) Načítanie FAQ pre tohto používateľa ---
    let faqText = "";
    if (ownerUserId) {
      try {
        const { data: faqData, error: faqError } = await supabase
          .from("faq_items")
          .select("question, answer")
          .eq("user_id", ownerUserId)
          .order("created_at", { ascending: false })
          .limit(10);

        if (!faqError && faqData && faqData.length > 0) {
          const faqLines = faqData.map(
            (item) => `Q: ${item.question}\nA: ${item.answer}`
          );
          faqText =
            "\n\nTu sú firemné FAQ, ktoré musíš uprednostniť pri odpovedaní:\n" +
            faqLines.join("\n\n");
        } else if (faqError) {
          console.warn("Chyba pri načítaní FAQ:", faqError.message);
        }
      } catch (faqCatchError) {
        console.warn("Neočakávaná chyba pri načítaní FAQ:", faqCatchError);
      }
    }

    // --- 3) System prompt podľa nastavení + FAQ ---
    const toneText =
      tone === "formal"
        ? "Odpovedáš profesionálne, vecne a formálne, ale stále príjemným tónom."
        : tone === "casual"
        ? "Odpovedáš veľmi uvoľneným, priateľským a moderným tónom, môžeš použiť aj slang, ale stále musíš byť jasný a zrozumiteľný."
        : "Odpovedáš priateľsky, ľudsky a zrozumiteľne, moderným ale slušným tónom.";

    const systemPrompt = `
Si AI chatbot s názvom "${botName}" pre firmu "${companyName}".
${description}
${faqText}

${toneText}
Vždy odpovedaj v slovenskom jazyku, stručne a jasne. 
Najskôr sa pokús využiť firemné FAQ, ak sa otázka zhoduje alebo je podobná.
Ak nič z FAQ nesedí, odpovedz podľa svojich všeobecných znalostí, ale stále v kontexte tejto firmy.
Ak niečo nevieš alebo nemáš istotu, úprimne to priznaj a navrhni, ako môže používateľ získať odpoveď.
    `.trim();

    // --- 4) Volanie OpenAI API ---
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI API error", data);
      const message =
        (data as any)?.error?.message || "OpenAI API error (neznáma chyba).";
      return NextResponse.json({ error: message }, { status: 500 });
    }

    const reply =
      data?.choices?.[0]?.message?.content ||
      "Ospravedlňujem sa, momentálne neviem vytvoriť odpoveď.";

    // --- 5) Uloženie logu konverzácie do chat_logs ---
    try {
      if (ownerUserId) {
        await supabase.from("chat_logs").insert({
          owner_user_id: ownerUserId,
          question: text,
          answer: reply,
        });
      } else {
        // fallback: aj bez ownerUserId uložíme záznam (napr. pre neskorší debugging)
        await supabase.from("chat_logs").insert({
          question: text,
          answer: reply,
        });
      }
    } catch (logError) {
      console.warn("Nepodarilo sa uložiť chat log:", logError);
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("API /api/chat error:", error);
    return NextResponse.json(
      { error: "Nastala chyba pri spracovaní požiadavky." },
      { status: 500 }
    );
  }
}