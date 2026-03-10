import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser-side Supabase client (singleton).
 * Uses createBrowserClient from @supabase/ssr so the session is stored
 * in cookies (not just localStorage), which the server-side createServerClient
 * can then read when verifying auth on API routes.
 *
 * Explicit module-level cache guarantees every caller shares the exact same
 * client instance and auth-state listener — regardless of @supabase/ssr
 * version internals.
 */
let _client: ReturnType<typeof createBrowserClient> | null = null;

export function createSupabaseBrowserClient() {
  if (!_client) {
    _client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _client;
}
