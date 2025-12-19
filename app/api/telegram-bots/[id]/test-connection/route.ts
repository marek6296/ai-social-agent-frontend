import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Test Telegram bot connection by calling Telegram API
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { token } = body;

    const supabaseServer = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get bot from database to use stored token if not provided
    let botToken = token;
    if (!botToken) {
      const { data: bot, error: botError } = await supabaseServer
        .from("telegram_bots")
        .select("bot_token")
        .eq("id", id)
        .single();

      if (botError || !bot) {
        return NextResponse.json(
          { error: "Bot not found" },
          { status: 404 }
        );
      }

      // TODO: Decrypt token if encrypted
      botToken = bot.bot_token;
    }

    if (!botToken || botToken === "***") {
      return NextResponse.json(
        { error: "Bot token is required" },
        { status: 400 }
      );
    }

    // Test connection by calling Telegram Bot API getMe endpoint
    const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/getMe`, {
      method: "GET",
    });

    if (!telegramResponse.ok) {
      const errorData = await telegramResponse.json().catch(() => ({}));
      return NextResponse.json(
        {
          success: false,
          error: errorData.description || `HTTP ${telegramResponse.status}`,
          connected: false,
        },
        { status: 200 } // Return 200 with error in body
      );
    }

    const telegramData = await telegramResponse.json();

    if (telegramData.ok && telegramData.result) {
      // Update connection status in database
      await supabaseServer
        .from("telegram_bots")
        .update({
          connection_status: "connected",
          last_connection_test: new Date().toISOString(),
        })
        .eq("id", id);

      return NextResponse.json({
        success: true,
        connected: true,
        bot_info: {
          id: telegramData.result.id,
          username: telegramData.result.username,
          first_name: telegramData.result.first_name,
          can_join_groups: telegramData.result.can_join_groups,
          can_read_all_group_messages: telegramData.result.can_read_all_group_messages,
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid response from Telegram API",
          connected: false,
        },
        { status: 200 }
      );
    }
  } catch (error: any) {
    console.error("Error testing Telegram connection:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to test connection",
        connected: false,
      },
      { status: 200 }
    );
  }
}
