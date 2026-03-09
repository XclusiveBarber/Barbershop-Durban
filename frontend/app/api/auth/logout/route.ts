import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * POST /api/auth/logout
 * Sign out from Supabase and clear session
 */
export async function POST() {
  try {
    // Sign out from Supabase
    await supabase.auth.signOut();

    // Clear cookies
    const response = NextResponse.json({ success: true });
    response.cookies.delete('supabaseToken');

    return response;
  } catch (error) {
    console.error('[auth] Logout error:', error);
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
  }
}
