import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// This endpoint is called by the bot service to actually send the message
export async function POST(req: Request) {
  try {
    const { publishedId, messagePayload } = await req.json();

    if (!publishedId || !messagePayload) {
      return NextResponse.json(
        { error: "Missing publishedId or messagePayload" },
        { status: 400 }
      );
    }

    // Update published message with actual message_id after sending
    // The bot service will call this endpoint after successfully sending the message
    const { data: published, error } = await supabaseServer
      .from("discord_published_messages")
      .select("*")
      .eq("id", publishedId)
      .single();

    if (error || !published) {
      return NextResponse.json(
        { error: "Published message not found" },
        { status: 404 }
      );
    }

    // The actual sending is done by the bot service
    // This endpoint just confirms receipt
    return NextResponse.json({ success: true, published });
  } catch (error: any) {
    console.error("Error in publish handler:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

