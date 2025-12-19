import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { decryptToken } from "@/lib/discordTokenDecrypt";

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Discord API base URL
const DISCORD_API_BASE = "https://discord.com/api/v10";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ botId: string }> }
) {
  try {
    const { botId } = await params;

    // Load bot from database
    const { data: bot, error: botError } = await supabaseServer
      .from("discord_bots")
      .select("bot_token")
      .eq("id", botId)
      .single();

    if (botError || !bot) {
      return NextResponse.json(
        { error: "Bot not found", count: 0 },
        { status: 404 }
      );
    }

    if (!bot.bot_token) {
      return NextResponse.json(
        { error: "Bot token not configured", count: 0 },
        { status: 400 }
      );
    }

    // Decrypt token (or use plain text if not encrypted)
    const decryptedToken = decryptToken(bot.bot_token);
    
    if (!decryptedToken || !decryptedToken.trim()) {
      return NextResponse.json(
        { error: "Invalid bot token", count: 0 },
        { status: 400 }
      );
    }

    try {
      // Get guilds where bot is a member
      const guildsResponse = await fetch(`${DISCORD_API_BASE}/users/@me/guilds`, {
        headers: {
          Authorization: `Bot ${decryptedToken}`,
        },
      });

      if (!guildsResponse.ok) {
        // If we get 401 or 403, the bot might not be authenticated or token is invalid
        if (guildsResponse.status === 401 || guildsResponse.status === 403) {
          return NextResponse.json(
            { error: "Bot token is invalid or expired", count: 0 },
            { status: 401 }
          );
        }
        
        // For other errors (like 429 rate limit), return 0 as fallback
        console.warn(`Discord API error for bot ${botId}:`, guildsResponse.status);
        return NextResponse.json({ count: 0 });
      }

      const guildsData = await guildsResponse.json();
      const count = Array.isArray(guildsData) ? guildsData.length : 0;

      return NextResponse.json({ count });
    } catch (apiError) {
      console.error("Error fetching guilds from Discord API:", apiError);
      // Return 0 as fallback if API call fails
      return NextResponse.json({ count: 0 });
    }
  } catch (error: any) {
    console.error("Error in guilds count endpoint:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error", count: 0 },
      { status: 500 }
    );
  }
}

