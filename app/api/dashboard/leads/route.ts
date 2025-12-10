import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Použijeme service role key pre obchádzanie RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

if (!supabaseServiceKey && !supabaseAnonKey) {
  console.error("Missing both SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

const supabaseServer = createClient(
  supabaseUrl!,
  supabaseServiceKey || supabaseAnonKey!
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

    // Debug logging (len v development)
    if (process.env.NODE_ENV === "development") {
      console.log("Fetching leads for userId:", ownerUserId);
      console.log("Using service role key:", !!supabaseServiceKey);
    }

    const { data, error } = await supabaseServer
      .from("leads")
      .select("id, owner_user_id, name, email, note, created_at")
      .eq("owner_user_id", ownerUserId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Chyba pri načítaní leadov (API):", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return NextResponse.json(
        { 
          error: "Nepodarilo sa načítať leady.",
          details: process.env.NODE_ENV === "development" ? error.message : undefined
        },
        { status: 500 }
      );
    }

    // Debug logging
    if (process.env.NODE_ENV === "development") {
      console.log("Leads fetched:", data?.length || 0);
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