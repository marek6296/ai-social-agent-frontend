// app/api/leads/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// fallback – ak náhodou nepríde ownerUserId, priradí sa k tvojmu účtu
const PLATFORM_OWNER_ID = "faeb1920-35fe-47be-a169-1393591cc3e4";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const name = (body?.name as string | undefined) || null;
    const email = (body?.email as string | undefined)?.trim();
    const note = (body?.note as string | undefined) || null;
    const ownerUserIdFromBody =
      (body?.ownerUserId as string | undefined) || null;

    const ownerUserId = ownerUserIdFromBody || PLATFORM_OWNER_ID;

    if (!email) {
      return NextResponse.json(
        { error: "Email je povinný." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    if (!ownerUserId) {
      return NextResponse.json(
        { error: "Nepodarilo sa priradiť kontakt k vlastníkovi bota." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const { error } = await supabaseServer.from("leads").insert({
      owner_user_id: ownerUserId,
      name,
      email,
      note,
    });

    if (error) {
      console.error("Supabase leads insert error:", error);
      return NextResponse.json(
        { error: "Nepodarilo sa uložiť kontakt. Skús to neskôr." },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(
      { success: true },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error("API /api/leads error:", err);
    return NextResponse.json(
      { error: "Nastala chyba pri spracovaní požiadavky." },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}