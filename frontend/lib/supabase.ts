import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Server-side client used in API routes
// Uses anon key — ensure RLS policies allow barber/admin operations
// For production, add SUPABASE_SERVICE_ROLE_KEY to env and use it here for admin routes

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    _supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabase;
}

/**
 * @deprecated Use getSupabase() instead — this eager export crashes at build time
 * when env vars are not available.
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as any)[prop];
  },
});
