import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { decryptToken } from "@/lib/discordTokenDecrypt";

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Discord API base URL
const DISCORD_API_BASE = "https://discord.com/api/v10";

export async function POST(req: Request) {
  try {
    const { templateId, botId, channelId } = await req.json();

    if (!templateId || !botId || !channelId) {
      return NextResponse.json(
        { error: "Missing required fields: templateId, botId, channelId" },
        { status: 400 }
      );
    }

    // Load template
    const { data: template, error: templateError } = await supabaseServer
      .from("discord_message_templates")
      .select("*")
      .eq("id", templateId)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Load bot
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

    // Get current page
    const currentPageIndex = template.current_page_index || 0;
    const pages = template.pages_json || [];
    const currentPage = pages[currentPageIndex] || {
      embed: template.embed_json || {},
      components: template.components_json || {},
    };

    // Decrypt bot token
    const decryptedToken = decryptToken(bot.bot_token);
    
    if (!decryptedToken || !decryptedToken.trim()) {
      return NextResponse.json(
        { error: "Invalid bot token" },
        { status: 400 }
      );
    }

    // Build Discord message payload (using Discord REST API format)
    // Build embed
    const embed: any = {};
    
    // If poll exists, add poll question to embed
    if (currentPage.components?.poll && currentPage.components.poll.question) {
      embed.title = currentPage.embed?.title || "📊 Hlasovanie";
      embed.description = currentPage.embed?.description 
        ? `${currentPage.embed.description}\n\n**${currentPage.components.poll.question}**`
        : `**${currentPage.components.poll.question}**`;
    } else {
      if (currentPage.embed?.title) embed.title = currentPage.embed.title;
      if (currentPage.embed?.description) embed.description = currentPage.embed.description;
    }
    if (currentPage.embed?.color) {
      const color = typeof currentPage.embed.color === 'string' && currentPage.embed.color.startsWith('#')
        ? parseInt(currentPage.embed.color.replace('#', ''), 16)
        : currentPage.embed.color;
      embed.color = color;
    }
    if (currentPage.embed?.thumbnail) embed.thumbnail = { url: currentPage.embed.thumbnail };
    if (currentPage.embed?.image) embed.image = { url: currentPage.embed.image };
    if (currentPage.embed?.footer) embed.footer = { text: currentPage.embed.footer };
    
    if (currentPage.embed?.fields && currentPage.embed.fields.length > 0) {
      embed.fields = currentPage.embed.fields.map((field: any) => ({
        name: field.name,
        value: field.value,
        inline: field.inline || false,
      }));
    }

    // Build components (poll buttons first, then regular buttons)
    const components: any[] = [];
    
    // Poll buttons (if poll exists)
    if (currentPage.components?.poll && currentPage.components.poll.question && currentPage.components.poll.options.length > 0) {
      const pollButtons = currentPage.components.poll.options.map((option: string, index: number) => {
        // Generate custom_id for poll: poll:{template_id}:page:{page_name}:option:{index}
        const pageName = currentPage.name || `page${currentPageIndex}`;
        const customId = `poll:${templateId}:page:${pageName}:option:${index}`;
        
        return {
          type: 2, // Button component type
          style: 1, // Primary style (blue)
          label: option,
          custom_id: customId,
        };
      });
      
      // Group poll buttons into rows of 5
      for (let i = 0; i < pollButtons.length; i += 5) {
        const rowButtons = pollButtons.slice(i, i + 5);
        components.push({
          type: 1, // ActionRow component type
          components: rowButtons,
        });
      }
    }
    
    // Regular buttons
    if (currentPage.components?.buttons && currentPage.components.buttons.length > 0) {
      const buttons = currentPage.components.buttons.map((btn: any) => {
        // Map button style to Discord API style numbers
        // 1=Primary, 2=Secondary, 3=Success, 4=Danger, 5=Link
        let style: number;
        switch (btn.style) {
          case 'success': style = 3; break;
          case 'danger': style = 4; break;
          case 'secondary': style = 2; break;
          case 'link': style = 5; break;
          default: style = 1; // Primary
        }
        
        // Generate custom_id in format: tpl:{template_id}:page:{page_name}:btn:{button_id}
        const pageName = currentPage.name || `page${currentPageIndex}`;
        const customId = `tpl:${templateId}:page:${pageName}:btn:${btn.id}`;
        
        const button: any = {
          type: 2, // Button component type
          style: style,
          label: btn.label,
        };
        
        // Link buttons have URL instead of custom_id
        if (style === 5) {
          button.url = btn.url;
        } else {
          button.custom_id = customId;
        }
        
        // Handle emoji (can be string or object)
        if (btn.emoji) {
          if (typeof btn.emoji === 'string') {
            // Parse emoji string (could be unicode or :name: format)
            if (btn.emoji.match(/^<a?:\w+:\d+>$/)) {
              // Custom emoji format: <:name:id> or <a:name:id> (animated)
              const match = btn.emoji.match(/^<(a?):(\w+):(\d+)>$/);
              if (match) {
                button.emoji = {
                  animated: match[1] === 'a',
                  name: match[2],
                  id: match[3],
                };
              }
            } else {
              // Unicode emoji
              button.emoji = { name: btn.emoji };
            }
          } else {
            button.emoji = btn.emoji;
          }
        }
        
        return button;
      });
      
      // Discord allows max 5 buttons per row
      // Group buttons into rows of 5
      for (let i = 0; i < buttons.length; i += 5) {
        const rowButtons = buttons.slice(i, i + 5);
        components.push({
          type: 1, // ActionRow component type
          components: rowButtons,
        });
      }
    }

    // Build message payload for Discord REST API
    const messagePayload: any = {};
    if (embed.title || embed.description || embed.fields?.length > 0) {
      messagePayload.embeds = [embed];
    }
    if (components.length > 0) {
      messagePayload.components = components;
    }

    // Send message to Discord using REST API
    const sendResponse = await fetch(`${DISCORD_API_BASE}/channels/${channelId}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bot ${decryptedToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messagePayload),
    });

    if (!sendResponse.ok) {
      const errorText = await sendResponse.text().catch(() => "");
      console.error("Discord API error:", sendResponse.status, errorText);
      
      let errorMessage = "Failed to send message to Discord";
      if (sendResponse.status === 429) {
        errorMessage = "Discord API rate limit. Please try again later.";
      } else if (sendResponse.status === 403) {
        errorMessage = "Bot doesn't have permission to send messages to this channel";
      } else if (sendResponse.status === 404) {
        errorMessage = "Channel not found or bot is not a member of the guild";
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: sendResponse.status }
      );
    }

    const sentMessage = await sendResponse.json();

    // Save published message record with actual message ID
    const { data: published, error: publishError } = await supabaseServer
      .from("discord_published_messages")
      .insert({
        template_id: templateId,
        bot_id: botId,
        guild_id: template.guild_id,
        channel_id: channelId,
        message_id: sentMessage.id,
        current_page_index: currentPageIndex,
      })
      .select()
      .single();

    if (publishError) {
      console.error("Error saving published message:", publishError);
      // Message was sent, but we couldn't save the record - not critical
    }

    return NextResponse.json({
      success: true,
      messageId: sentMessage.id,
      publishedId: published?.id,
      channelId,
      botId,
    });
  } catch (error: any) {
    console.error("Error publishing template:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
