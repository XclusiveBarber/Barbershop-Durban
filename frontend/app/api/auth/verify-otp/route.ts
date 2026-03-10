import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

/**
 * POST /api/auth/verify-otp
 * Verify OTP token and establish a session via Supabase Auth.
 *
 * Uses createSupabaseServerClient so that on success the standard
 * sb-*-auth-token cookies are set automatically — no custom cookie needed.
 * These are the same cookies that @supabase/ssr reads on subsequent requests,
 * so every API route and the middleware can validate the session without
 * requiring a manual Authorization header.
 */
export async function POST(request: NextRequest) {
  try {
    const { email, token } = await request.json();

    if (!email || !token) {
      return NextResponse.json({ error: 'Email and token required' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (error) {
      console.error('[auth] Verify OTP error:', error);
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (!data.session || !data.user) {
      return NextResponse.json({ error: 'Session creation failed' }, { status: 500 });
    }

    // The SSR client's cookie callbacks already set the sb-*-auth-token cookie.
    // We just return the session data for the client to store in context/localStorage.
    return NextResponse.json({
      success: true,
      session: {
        access_token: data.session.access_token,
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      },
    });
  } catch (err) {
    console.error('[auth] Verify OTP error:', err);
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
  }
}
