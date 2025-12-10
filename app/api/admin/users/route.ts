import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPER_ADMIN_ID = "faeb1920-35fe-47be-a169-1393591cc3e4";

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Kontrola admin práv
async function checkAdmin(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseServer
      .from("users_profile")
      .select("is_admin")
      .eq("id", userId)
      .single();

    if (error || !data) {
      // Fallback: ak tabuľka neexistuje, skontroluj podľa ID
      return userId === SUPER_ADMIN_ID;
    }

    return data.is_admin === true || userId === SUPER_ADMIN_ID;
  } catch {
    return userId === SUPER_ADMIN_ID;
  }
}

// GET - Získanie všetkých userov
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = await checkAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    // Získanie všetkých userov cez auth.admin.listUsers()
    const { data: authUsersData, error: listUsersError } = await supabaseServer.auth.admin.listUsers();
      
    if (listUsersError || !authUsersData) {
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    // Načítaj profily z users_profile (ak existuje)
    const userIds = authUsersData.users.map((u) => u.id);
    const { data: profiles } = await supabaseServer
      .from("users_profile")
      .select("*")
      .in("id", userIds);

    const profilesMap = new Map(
      (profiles || []).map((p: any) => [p.id, p])
    );

    // Získaj kredity pre každého usera z users_profile
    const usersWithStats = await Promise.all(
      authUsersData.users.map(async (authUser) => {
        const profile = profilesMap.get(authUser.id);
        
        return {
          id: authUser.id,
          email: authUser.email,
          created_at: authUser.created_at,
          plan: profile?.plan || "starter",
          is_active: profile?.is_active !== false,
          is_admin: profile?.is_admin === true || authUser.id === SUPER_ADMIN_ID,
          credits_used_this_month: profile?.credits_used_this_month || 0,
          last_credit_reset: profile?.last_credit_reset || profile?.created_at || authUser.created_at,
        };
      })
    );

    return NextResponse.json({ users: usersWithStats });
  } catch (err) {
    console.error("Admin users API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Aktualizácia usera (plan, is_active)
export async function PATCH(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = await checkAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, plan, is_active, is_admin } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Super admin nemôže byť zmenený
    if (userId === SUPER_ADMIN_ID && (is_admin !== undefined || plan !== undefined)) {
      return NextResponse.json({ error: "Super admin nemôže byť zmenený" }, { status: 403 });
    }

    // Aktualizuj users_profile
    const updateData: any = {};
    if (plan !== undefined) updateData.plan = plan;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (is_admin !== undefined) updateData.is_admin = is_admin;
    updateData.updated_at = new Date().toISOString();

    const { error: updateError } = await supabaseServer
      .from("users_profile")
      .upsert({
        id: userId,
        ...updateData,
      }, {
        onConflict: "id"
      });

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json({ error: "Failed to update user profile: " + updateError.message }, { status: 500 });
    }
    
    // Debug log
    console.log("Updated user profile:", {
      userId,
      updateData,
      plan: updateData.plan
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Admin update user API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

