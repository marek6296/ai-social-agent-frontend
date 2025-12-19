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
        { error: "Bot not found" },
        { status: 404 }
      );
    }

    if (!bot.bot_token) {
      return NextResponse.json(
        { error: "Bot token not configured" },
        { status: 400 }
      );
    }

    // Decrypt token (or use plain text if not encrypted)
    const decryptedToken = decryptToken(bot.bot_token);
    
    if (!decryptedToken || !decryptedToken.trim()) {
      return NextResponse.json(
        { error: "Invalid bot token" },
        { status: 400 }
      );
    }

    // Get current user (bot) info to get guilds
    const userResponse = await fetch(`${DISCORD_API_BASE}/users/@me`, {
      headers: {
        Authorization: `Bot ${decryptedToken}`,
      },
    });

    if (!userResponse.ok) {
      return NextResponse.json(
        { error: "Failed to authenticate with Discord API" },
        { status: 401 }
      );
    }

    // Get guilds where bot is a member
    const guildsResponse = await fetch(`${DISCORD_API_BASE}/users/@me/guilds`, {
      headers: {
        Authorization: `Bot ${decryptedToken}`,
      },
    });

    if (!guildsResponse.ok) {
      let errorMessage = "Discord API error";
      
      if (guildsResponse.status === 429) {
        // Rate limit - check retry-after header
        const retryAfter = guildsResponse.headers.get("Retry-After");
        if (retryAfter) {
          errorMessage = `Discord API rate limit. Skús to znova za ${retryAfter} sekúnd.`;
          // Include retry-after in response headers so frontend can use it
          return NextResponse.json(
            { error: errorMessage, retryAfter: parseInt(retryAfter, 10) },
            { 
              status: 429,
              headers: {
                "Retry-After": retryAfter,
              },
            }
          );
        } else {
          errorMessage = "Discord API rate limit. Prosím, skús to znova o chvíľu.";
        }
      } else {
        const errorText = await guildsResponse.text().catch(() => "");
        errorMessage = `Discord API error: ${errorText || `HTTP ${guildsResponse.status}`}`;
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: guildsResponse.status }
      );
    }

    const guildsData = await guildsResponse.json();

    // Discord API returns an array directly, not wrapped in an object
    if (!Array.isArray(guildsData)) {
      console.error("Discord API returned non-array guilds data:", guildsData);
      return NextResponse.json(
        { error: "Invalid response format from Discord API", guilds: [] },
        { status: 500 }
      );
    }

    // Transform guilds data
    const guilds = guildsData.map((guild: any) => ({
      id: guild.id,
      name: guild.name,
      icon: guild.icon
        ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
        : null,
      memberCount: 0, // Discord API doesn't return member count in /users/@me/guilds
    }));

    console.log(`Fetched ${guilds.length} guilds for bot ${botId}`); // Debug log

    return NextResponse.json({ guilds });
  } catch (error: any) {
    console.error("Error fetching guilds:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

