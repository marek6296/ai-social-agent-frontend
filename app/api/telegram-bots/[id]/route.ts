import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// GET single bot
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const supabaseServer = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabaseServer
      .from("telegram_bots")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching telegram bot:", error);
      return NextResponse.json(
        { error: error.message || "Bot not found" },
        { status: 404 }
      );
    }

    // Don't expose token in response
    if (data.bot_token) {
      data.bot_token = "***";
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error in GET /api/telegram-bots/[id]:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH update bot
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const supabaseServer = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // If token is being updated, encrypt it
    const updateData: any = { ...body };
    if (updateData.bot_token && updateData.bot_token !== "***") {
      // TODO: Implement token encryption (similar to Discord bot)
      // For now, we'll store it as-is (should be encrypted in production)
    } else if (updateData.bot_token === "***") {
      // Don't update token if it's masked
      delete updateData.bot_token;
    }

    const { data, error } = await supabaseServer
      .from("telegram_bots")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating telegram bot:", error);
      return NextResponse.json(
        { error: error.message || "Failed to update bot" },
        { status: 400 }
      );
    }

    // Don't expose token in response
    if (data.bot_token) {
      data.bot_token = "***";
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error in PATCH /api/telegram-bots/[id]:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE bot
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabaseServer = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabaseServer
      .from("telegram_bots")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting telegram bot:", error);
      return NextResponse.json(
        { error: error.message || "Failed to delete bot" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in DELETE /api/telegram-bots/[id]:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
