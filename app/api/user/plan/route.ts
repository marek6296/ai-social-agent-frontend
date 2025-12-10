import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPER_ADMIN_ID = "faeb1920-35fe-47be-a169-1393591cc3e4";

// Server-side Supabase client s service role key (obchádza RLS)
const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: Request) {
  try {
    // Získaj userId z query parametrov alebo z request URL
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId parameter" },
        { status: 400 }
      );
    }

    // Načítaj profil používateľa (service role key obchádza RLS)
    const { data: profileData, error: profileError } = await supabaseServer
      .from("users_profile")
      .select("plan, is_admin, credits_used_this_month, created_at, last_credit_reset")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("Error fetching user plan:", profileError);
      return NextResponse.json(
        {
          error: "Failed to fetch plan",
          details: profileError.message,
          code: profileError.code,
        },
        { status: 500 }
      );
    }

    const userIsAdmin = profileData?.is_admin === true || userId === SUPER_ADMIN_ID;
    const isSuperAdmin = userId === SUPER_ADMIN_ID;

    let plan = "starter";
    if (userIsAdmin || isSuperAdmin) {
      plan = "unlimited";
    } else if (profileData?.plan && typeof profileData.plan === 'string' && profileData.plan.trim() !== '') {
      plan = profileData.plan.toLowerCase();
    }

    return NextResponse.json({
      plan,
      isAdmin: userIsAdmin,
      isSuperAdmin,
      profileData,
      userId,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

