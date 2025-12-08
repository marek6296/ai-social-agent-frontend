import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PLATFORM_OWNER_ID = "faeb1920-35fe-47be-a169-1393591cc3e4"; // default bot owner (tvoj účet)

// CORS pre embed z iných domén
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

// Jednoduchá kategorizácia otázky podľa obsahu
function categorizeQuestion(question: string): string {
  const q = question.toLowerCase();

  if (
    q.includes("cena") ||
    q.includes("koľko stojí") ||
    q.includes("kolko stoji") ||
    q.includes("price") ||
    q.includes("priplatok") ||
    q.includes("predplatné") ||
    q.includes("predplatne") ||
    q.includes("platba") ||
    q.includes("faktur")
  ) {
    return "Cena";
  }

  if (
    q.includes("objednávka") ||
    q.includes("objednavka") ||
    q.includes("objednať") ||
    q.includes("objednat") ||
    q.includes("kúpiť") ||
    q.includes("kupit") ||
    q.includes("order") ||
    q.includes("purchase") ||
    q.includes("zakúpiť") ||
    q.includes("zakupit")
  ) {
    return "Objednávky";
  }

  if (
    q.includes("podpora") ||
    q.includes("support") ||
    q.includes("kontakt") ||
    q.includes("pomoc") ||
    q.includes("help") ||
    q.includes("reklamácia") ||
    q.includes("reklamacia") ||
    q.includes("sťažnosť") ||
    q.includes("staznost")
  ) {
    return "Podpora";
  }

  if (
    q.includes("nefunguje") ||
    q.includes("chyba") ||
    q.includes("error") ||
    q.includes("bug") ||
    q.includes("nastavenie") ||
    q.includes("konfigurácia") ||
    q.includes("konfiguracia") ||
    q.includes("prihlásiť") ||
    q.includes("prihlasit") ||
    q.includes("login")
  ) {
    return "Technické";
  }

  if (
    q.includes("čo je") ||
    q.includes("co je") ||
    q.includes("ako funguje") ||
    q.includes("čo robí") ||
    q.includes("co robi") ||
    q.includes("ako to funguje") ||
    q.includes("funkcie") ||
    q.includes("features")
  ) {
    return "Produkt / služba";
  }

  return "Iné";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const text = (body?.message as string | undefined)?.trim();
    const ownerUserIdFromBody =
      (body?.ownerUserId as string | undefined) || null;

    if (!text) {
      return NextResponse.json(
        { error: "Žiadna správa nebola odoslaná." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Chýba OPENAI_API_KEY na serveri." },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    // 1) Základné default nastavenia bota
    let companyName: string;
    let botName: string;
    let description: string;
    let tone: "friendly" | "formal" | "casual" = "friendly";

    // ownerUserId = klientsky bot (Test môjho bota, embed)
    // null = globálny bot (AI Social Agent, helper v dashboarde)
    let ownerUserId: string | null = ownerUserIdFromBody;

    // ID používateľa, z ktorého čítame bot_settings/FAQ.
    // Ak klient neposlal ownerUserId (globálny bot), použijeme tvoj účet.
    const settingsUserId: string | null = ownerUserId || PLATFORM_OWNER_ID || null;

    if (!ownerUserId) {
      // Globálny bot – tvoj AI Social Agent
      companyName = "AI Social Agent";
      botName = "AI asistent";
      description =
        "Pomáha návštevníkom pochopiť, čo služba AI Social Agent robí a ako môže pomôcť firmám s AI chatbotmi a automatizáciou.";
    } else {
      // Klientsky bot – neutrálna firma, ktorú neskôr prebijú nastavenia z DB
      companyName = "Vaša firma";
      botName = "AI chatbot";
      description =
        "Pomáha návštevníkom zodpovedať otázky o vašich službách, produktoch a podpore.";
    }

    // texty, ktoré doplníme podľa DB
    let settingsText = "";
    let faqText = "";
    let settingsFound = false;

    // 2) Načítaj bot_settings a FAQ pre settingsUserId
    // - ak máme ownerUserId (klientsky bot) → použijeme jeho user_id
    // - ak je ownerUserId null (globálny bot) → použijeme PLATFORM_OWNER_ID (tvoj účet)
    if (settingsUserId) {
      try {
        // a) BOT SETTINGS – tabuľka bot_settings s fieldmi company_name, bot_name, description, tone, user_id
        const { data: settingsData, error: settingsError } = await supabaseServer
          .from("bot_settings")
          .select("company_name, bot_name, description, tone")
          .eq("user_id", settingsUserId)
          .maybeSingle();

        if (!settingsError && settingsData) {
          settingsFound = true;
          if (settingsData.company_name) {
            companyName = settingsData.company_name;
          }
          if (settingsData.bot_name) {
            botName = settingsData.bot_name;
          }
          if (settingsData.description) {
            description = settingsData.description;
          }
          if (
            settingsData.tone === "formal" ||
            settingsData.tone === "casual" ||
            settingsData.tone === "friendly"
          ) {
            tone = settingsData.tone;
          }

          const lines: string[] = [];
          lines.push(`Názov firmy: ${companyName}`);
          lines.push(`Meno bota: ${botName}`);
          lines.push(`Popis bota: ${description}`);
          lines.push(`Tón komunikácie: ${tone}`);
          settingsText = lines.join("\n");
        } else if (settingsError) {
          console.warn(
            "Chyba pri načítaní bot_settings:",
            settingsError.message
          );
        }

        // b) FAQ – tabuľka faq_items s question, answer, user_id
        const { data: faqData, error: faqError } = await supabaseServer
          .from("faq_items")
          .select("question, answer")
          .eq("user_id", settingsUserId)
          .order("created_at", { ascending: false })
          .limit(20);

        if (!faqError && faqData && faqData.length > 0) {
          const faqLines = faqData.map(
            (item) => `Q: ${item.question}\nA: ${item.answer}`
          );
          faqText =
            "\n\nTu sú firemné FAQ, ktoré MUSÍŠ uprednostniť pri odpovedaní:\n" +
            faqLines.join("\n\n");
        } else if (faqError) {
          console.warn("Chyba pri načítaní FAQ:", faqError.message);
        }
      } catch (err) {
        console.warn("Chyba pri načítaní nastavení/FAQ:", err);
      }
    }

    // 3) Poskladanie system promptu
    const toneText =
      tone === "formal"
        ? "Odpovedáš profesionálne, vecne a formálne, ale stále príjemným tónom."
        : tone === "casual"
        ? "Odpovedáš veľmi uvoľneným, priateľským a moderným tónom, môžeš použiť aj mierny slang, ale musíš zostať zrozumiteľný."
        : "Odpovedáš priateľsky, ľudsky a zrozumiteľne, moderným ale slušným tónom.";

    const systemPrompt =
      `
Si AI chatbot s názvom "${botName}" pre firmu "${companyName}".
${description}

${toneText}

Ak máš k dispozícii firemné nastavenia, použi ich:
${settingsText || "(Zatiaľ nemáš žiadne špecifické nastavenia bota.)"}

Ak máš k dispozícii firemné FAQ, použi ich ako HLAVNÝ zdroj pravdy:
${faqText || "(Zatiaľ nemáš žiadne firemné FAQ, odpovedaj všeobecne, ale užitočne.)"}

Pravidlá:
- Odpovedaj vždy v slovenčine.
- Buď stručný, ale konkrétny.
- Ak niečo nevieš, priznaj to a navrhni ďalší krok (kontakt, email, telefón, formulár).
      `.trim();

    // 4) Volanie OpenAI API
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
        temperature: 0.4,
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

    // surová odpoveď z OpenAI
    const rawReply: string =
      data?.choices?.[0]?.message?.content ||
      "Ospravedlňujem sa, momentálne neviem vytvoriť odpoveď.";

    // vždy pridáme jasný úvod podľa botName + companyName
    const replyWithIntro = `Som ${botName}, AI chatbot pre firmu ${companyName}.\n\n${rawReply}`;

    // 5) Uloženie do chat_logs
    const category = categorizeQuestion(text);

    try {
      if (ownerUserId) {
        await supabaseServer.from("chat_logs").insert({
          owner_user_id: ownerUserId,
          question: text,
          answer: replyWithIntro,
          category,
        });
      } else {
        await supabaseServer.from("chat_logs").insert({
          question: text,
          answer: replyWithIntro,
          category,
        });
      }
    } catch (logError) {
      console.warn("Nepodarilo sa uložiť chat log:", logError);
    }

    const debugSuffix = `\n\n[DEBUG ownerUserId=${ownerUserId ?? "null"} settingsFound=${settingsFound}]`;
    return NextResponse.json(
      { reply: replyWithIntro + debugSuffix },
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error("API /api/chat error:", error);
    return NextResponse.json(
      { error: "Nastala chyba pri spracovaní požiadavky." },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}