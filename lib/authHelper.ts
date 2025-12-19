import { supabase } from "./supabase";

/**
 * Safely get user with automatic error handling for refresh token errors
 * Returns null if user is not authenticated or if there's an auth error
 */
export async function safeGetUser() {
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      // Handle refresh token errors
      if (
        error.message?.includes("Refresh Token") ||
        error.message?.includes("refresh_token") ||
        error.message?.includes("Invalid Refresh Token")
      ) {
        console.log("Refresh token invalid, signing out...");
        await supabase.auth.signOut();
        return null;
      }
      console.error("Auth error:", error);
      return null;
    }

    return data.user;
  } catch (err) {
    console.error("Unexpected auth error:", err);
    return null;
  }
}


