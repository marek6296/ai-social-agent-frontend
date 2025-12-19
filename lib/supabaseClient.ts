import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
    },
  }
);

// Helper function to handle auth errors and redirect to login
export async function handleAuthError(error: any): Promise<boolean> {
  if (error?.message?.includes("Refresh Token") || error?.message?.includes("refresh_token")) {
    // Clear session and redirect to login
    await supabase.auth.signOut();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return true;
  }
  return false;
}