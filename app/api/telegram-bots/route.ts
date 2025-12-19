import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { createClient } from "@supabase/supabase-js";

// This endpoint handles GET (list bots) and POST (create bot)
export async function GET(req: NextRequest) {
  try {
    // Get auth header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Extract user from token (you'll need to implement this based on your auth system)
    // For now, using Supabase client-side auth
    const supabaseServer = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // In production, you'd verify the JWT token here
    // For now, this is a placeholder
    return NextResponse.json({ error: "Use client-side Supabase queries" }, { status: 400 });
  } catch (error: any) {
    console.error("Error in GET /api/telegram-bots:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, ...botData } = body;

    if (!user_id) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    const supabaseServer = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabaseServer
      .from("telegram_bots")
      .insert({
        user_id,
        ...botData,
        status: "draft",
        connection_status: "disconnected",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating telegram bot:", error);
      return NextResponse.json(
        { error: error.message || "Failed to create bot" },
        { status: 400 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error("Error in POST /api/telegram-bots:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
