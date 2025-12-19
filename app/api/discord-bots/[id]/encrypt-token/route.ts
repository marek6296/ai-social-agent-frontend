import { NextResponse } from "next/server";
import { encryptToken } from "@/lib/encryption";

// POST - Encrypt token
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const botId = params.id;
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    if (!botId) {
      return NextResponse.json(
        { error: "Bot ID is required" },
        { status: 400 }
      );
    }

    // Encrypt token (authentication is handled by RLS when saving to database)
    const encrypted_token = encryptToken(token);

    return NextResponse.json({ encrypted_token });
  } catch (error: any) {
    console.error("Error encrypting token:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error?.message },
      { status: 500 }
    );
  }
}
