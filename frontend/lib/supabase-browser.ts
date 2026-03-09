import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser-side Supabase client.
 * Uses createBrowserClient from @supabase/ssr so the session is stored
 * in cookies (not just localStorage), which the server-side createServerClient
 * can then read when verifying auth on API routes.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
