import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ownerUserId = searchParams.get("ownerUserId");

    if (!ownerUserId) {
      return NextResponse.json(
        { error: "Chýba ownerUserId v query parametri." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from("leads")
      .select("id, owner_user_id, name, email, note, created_at")
      .eq("owner_user_id", ownerUserId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Chyba pri načítaní leadov (API):", error.message);
      return NextResponse.json(
        { error: "Nepodarilo sa načítať leady." },
        { status: 500 }
      );
    }

    return NextResponse.json({ leads: data ?? [] });
  } catch (err) {
    console.error("API /api/dashboard/leads error:", err);
    return NextResponse.json(
      { error: "Server error pri načítaní leadov." },
      { status: 500 }
    );
  }
}