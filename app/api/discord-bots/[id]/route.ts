import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { encryptToken, decryptToken } from "@/lib/encryption";

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET - Load bot with decrypted token
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const botId = params.id;
    
    // Get auth token from headers
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Verify user with Supabase
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Load bot (RLS will ensure user can only access their own bots)
    const { data: botData, error: botError } = await supabaseServer
      .from("discord_bots")
      .select("*")
      .eq("id", botId)
      .eq("user_id", user.id)
      .single();

    if (botError || !botData) {
      return NextResponse.json(
        { error: "Bot not found" },
        { status: 404 }
      );
    }

    // Decrypt token if it exists
    if (botData.bot_token) {
      try {
        const decrypted = decryptToken(botData.bot_token);
        if (decrypted) {
          botData.bot_token = decrypted;
        } else {
          // Token might be in plain text (from before encryption)
          // Keep it as is
        }
      } catch (error) {
        console.error("Token decryption error:", error);
        // Keep encrypted token, frontend will handle it
      }
    }

    return NextResponse.json(botData);
  } catch (error) {
    console.error("Error loading bot:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update bot with encrypted token
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const botId = params.id;
    const body = await req.json();

    // Get auth token from headers
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("Missing authorization header");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Verify user with Supabase using the token
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token);
    if (authError || !user) {
      console.error("Auth error:", authError);
      return NextResponse.json(
        { error: "Unauthorized", details: authError?.message },
        { status: 401 }
      );
    }

    console.log("Authenticated user:", user.id);

    // Verify bot exists and belongs to user (using service role key to bypass RLS for check)
    const { data: existingBot, error: checkError } = await supabaseServer
      .from("discord_bots")
      .select("id, user_id")
      .eq("id", botId)
      .single();

    if (checkError || !existingBot) {
      console.error("Bot check error:", checkError);
      console.error("Bot ID:", botId);
      return NextResponse.json(
        { error: "Bot not found", details: checkError?.message },
        { status: 404 }
      );
    }

    // RLS should handle this, but double check
    if (existingBot.user_id !== user.id) {
      console.error("Unauthorized access attempt:", {
        botUserId: existingBot.user_id,
        requestUserId: user.id
      });
      return NextResponse.json(
        { error: "Unauthorized - Bot does not belong to user" },
        { status: 403 }
      );
    }

    const updateData: any = {
      bot_name: body.bot_name?.trim(),
      description: body.description?.trim() || null,
      bot_client_id: body.bot_client_id?.trim() || null,
      tone: body.tone,
      welcome_message: body.welcome_message?.trim() || null,
      system_prompt: body.system_prompt?.trim() || null,
      auto_reply_enabled: body.auto_reply_enabled,
      respond_to_mentions: body.respond_to_mentions,
      respond_to_all_messages: body.respond_to_all_messages,
      respond_in_threads: body.respond_in_threads,
      mention_in_reply: body.mention_in_reply,
      // Response mode
      response_mode: body.response_mode || "ai",
      ai_enabled: body.ai_enabled !== false,
      // Basic settings
      command_prefix: body.command_prefix?.trim() || null,
      bot_language: body.bot_language,
      timezone: body.timezone,
      message_cooldown_seconds: body.message_cooldown_seconds,
      max_response_tokens: body.max_response_tokens,
      allowed_channels: Array.isArray(body.allowed_channels) && body.allowed_channels.length > 0 ? body.allowed_channels : null,
      ignored_channels: Array.isArray(body.ignored_channels) && body.ignored_channels.length > 0 ? body.ignored_channels : null,
      admin_roles: Array.isArray(body.admin_roles) && body.admin_roles.length > 0 ? body.admin_roles : null,
      logs_channel_id: body.logs_channel_id?.trim() || null,
      // Extended AI settings
      knowledge_source_type: body.knowledge_source_type,
      ai_persona: body.ai_persona?.trim() || null,
      ai_do_list: body.ai_do_list?.trim() || null,
      ai_dont_list: body.ai_dont_list?.trim() || null,
      ai_answer_style: body.ai_answer_style,
      ai_cta_text: body.ai_cta_text?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    // Encrypt token if provided and not already encrypted (not "***")
    // Check if token is already encrypted (hex string) or plain text
    if (body.bot_token && body.bot_token !== "***" && body.bot_token.trim()) {
      const tokenValue = body.bot_token.trim();
      
      // Check if token looks like encrypted hex string (long hex string without dots)
      // Encrypted tokens are hex strings, typically > 192 chars
      const isAlreadyEncrypted = tokenValue.length > 192 && 
                                  /^[0-9a-fA-F]+$/.test(tokenValue) && 
                                  !tokenValue.includes('.');
      
      if (isAlreadyEncrypted) {
        // Token is already encrypted, use it as-is
        updateData.bot_token = tokenValue;
      } else {
        // Token is plain text, encrypt it
        updateData.bot_token = encryptToken(tokenValue);
      }
    }

    // Use service role key for update (we already verified user owns the bot)
    const { data: updatedBot, error: updateError } = await supabaseServer
      .from("discord_bots")
      .update(updateData)
      .eq("id", botId)
      .eq("user_id", user.id) // Double check user owns the bot
      .select()
      .single();

    if (updateError) {
      console.error("Error updating bot:", updateError);
      return NextResponse.json(
        { error: updateError.message || "Failed to update bot" },
        { status: 500 }
      );
    }

    // Don't return encrypted token to client
    if (updatedBot.bot_token) {
      updatedBot.bot_token = "***";
    }

    return NextResponse.json(updatedBot);
  } catch (error) {
    console.error("Error updating bot:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

