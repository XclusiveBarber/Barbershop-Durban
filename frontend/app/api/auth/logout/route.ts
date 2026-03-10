import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

/**
 * POST /api/auth/logout
 * Sign out from Supabase and clear the SSR session cookies.
 *
 * Uses createSupabaseServerClient so that signOut() correctly removes the
 * sb-*-auth-token cookies that were set by @supabase/ssr — not the old
 * custom supabaseToken cookie.
 */
export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[auth] Logout error:', error);
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
  }
}
