import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { error } = await supabase.auth.signInWithOtp({ phone });

    if (error) {
      console.error('[send-otp] Supabase error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('[send-otp] Unexpected error:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
