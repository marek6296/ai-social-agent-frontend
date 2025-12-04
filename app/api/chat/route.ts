import { NextResponse } from "next/server";

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
            content:
              "Si priateľský AI asistent na webstránke AI Social Agent. Odpovedáš stručne, zrozumiteľne a profesionálne, v slovenskom jazyku. Pomáhaš vysvetliť, čo tento nástroj robí, ako funguje embed chatbot pre firmy a ako môže pomôcť zákazníkovi.",
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
      return NextResponse.json(
        { error: "OpenAI API error", detail: data },
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