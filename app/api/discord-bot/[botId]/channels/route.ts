import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { decryptToken } from "@/lib/discordTokenDecrypt";

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Discord API base URL
const DISCORD_API_BASE = "https://discord.com/api/v10";

// Discord Channel Types
const CHANNEL_TYPE_GUILD_TEXT = 0;
const CHANNEL_TYPE_GUILD_ANNOUNCEMENT = 5;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ botId: string }> }
) {
  try {
    const { botId } = await params;
    const { searchParams } = new URL(req.url);
    const guildId = searchParams.get("guild_id");

    if (!guildId) {
      return NextResponse.json(
        { error: "guild_id parameter is required" },
        { status: 400 }
      );
    }

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

    // Get channels from Discord API
    const channelsResponse = await fetch(
      `${DISCORD_API_BASE}/guilds/${guildId}/channels`,
      {
        headers: {
          Authorization: `Bot ${decryptedToken}`,
        },
      }
    );

    if (!channelsResponse.ok) {
      let errorMessage = "Discord API error";
      
      if (channelsResponse.status === 404) {
        errorMessage = "Guild not found or bot is not a member";
      } else if (channelsResponse.status === 429) {
        // Rate limit - check retry-after header
        const retryAfter = channelsResponse.headers.get("Retry-After");
        if (retryAfter) {
          errorMessage = `Discord API rate limit. Skús to znova za ${retryAfter} sekúnd.`;
        } else {
          errorMessage = "Discord API rate limit. Prosím, skús to znova o chvíľu.";
        }
      } else {
        const errorText = await channelsResponse.text().catch(() => "");
        errorMessage = `Discord API error: ${errorText || `HTTP ${channelsResponse.status}`}`;
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: channelsResponse.status }
      );
    }

    const channelsData = await channelsResponse.json();

    // Filter and transform channels (text and announcement channels only)
    const channels = channelsData
      .filter(
        (channel: any) =>
          channel.type === CHANNEL_TYPE_GUILD_TEXT ||
          channel.type === CHANNEL_TYPE_GUILD_ANNOUNCEMENT
      )
      .map((channel: any) => {
        // Find parent category if exists
        const parent = channel.parent_id
          ? channelsData.find((c: any) => c.id === channel.parent_id && c.type === 4)
          : null;

        return {
          id: channel.id,
          name: channel.name,
          type: channel.type === CHANNEL_TYPE_GUILD_TEXT ? "text" : "announcement",
          parent: parent
            ? {
                id: parent.id,
                name: parent.name,
              }
            : null,
        };
      })
      .sort((a: any, b: any) => {
        // Sort by category first, then by name
        if (a.parent && !b.parent) return -1;
        if (!a.parent && b.parent) return 1;
        if (a.parent && b.parent && a.parent.name !== b.parent.name) {
          return a.parent.name.localeCompare(b.parent.name);
        }
        return a.name.localeCompare(b.name);
      });

    return NextResponse.json({ channels });
  } catch (error: any) {
    console.error("Error fetching channels:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

