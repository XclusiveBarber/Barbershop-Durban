import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * POST /api/auth/verify-otp
 * Verify OTP token and get session via Supabase Auth
 */
export async function POST(request: NextRequest) {
  try {
    const { email, token } = await request.json();

    if (!email || !token) {
      return NextResponse.json({ error: 'Email and token required' }, { status: 400 });
    }

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

    // Set session cookie with the access token
    const response = NextResponse.json({
      success: true,
      session: {
        access_token: data.session.access_token,
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      },
    });

    // Store token in httpOnly cookie for secure access
    response.cookies.set('supabaseToken', data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (err) {
    console.error('[auth] Verify OTP error:', err);
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
  }
}
