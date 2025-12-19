import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { decryptToken } from "@/lib/encryption";

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Discord Interactions API endpoint
// Discord pošle POST request keď bot dostane interakciu (slash command, button, atď.)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Discord Interactions API vyžaduje verifikáciu
    // Pre production by sme mali overiť signature pomocou public key
    const { type, data } = body;

    // Ping/Pong pre verifikáciu
    if (type === 1) {
      return NextResponse.json({ type: 1 });
    }

    // Application Command (slash command)
    if (type === 2) {
      // Tu by sme spracovali slash commands
      return NextResponse.json({
        type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
        data: {
          content: "Táto funkcionalita je momentálne vo vývoji.",
        },
      });
    }

    return NextResponse.json({ type: 1 });
  } catch (error) {
    console.error("Discord webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Health check
export async function GET() {
  return NextResponse.json({ status: "ok", service: "discord-webhook" });
}


