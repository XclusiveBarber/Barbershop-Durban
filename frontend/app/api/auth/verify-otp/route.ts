import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const { phone, code, name } = await request.json();

    if (!phone || !code) {
      return NextResponse.json({ error: 'Phone and code required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token: code,
      type: 'sms',
    });

    if (error) {
      console.error('[verify-otp] Supabase error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // If name provided (new user), upsert profile
    if (name && data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: name,
        role: 'customer',
      });
    }

    // Fetch existing profile
    let profile = null;
    if (data.user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', data.user.id)
        .single();
      profile = profileData;
    }

    const user = data.user
      ? {
          id: data.user.id,
          phone,
          name: profile?.full_name ?? name ?? '',
          role: profile?.role ?? 'customer',
        }
      : null;

    const response = NextResponse.json({ success: true, user });

    if (data.session) {
      response.cookies.set('sb-access-token', data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: data.session.expires_in,
      });
    }

    return response;
  } catch (error) {
    console.error('[verify-otp] Unexpected error:', error);
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
  }
}
