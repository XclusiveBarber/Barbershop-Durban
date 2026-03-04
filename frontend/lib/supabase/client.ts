import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser (client-side) singleton
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side helper: creates a client that authenticates as the requesting user
// Pass the user's access_token from the Authorization header so RLS applies.
export function createServerSupabaseClient(accessToken?: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : {},
    auth: { persistSession: false },
  });
}
