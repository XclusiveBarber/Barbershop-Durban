import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

/**
 * OAuth Callback Route
 *
 * Supabase redirects here after a successful Google (or other OAuth) sign-in.
 * Exchanges the one-time code for a session, then either:
 *  - Redirects to /auth/complete-profile if the user has no name yet
 *  - Redirects to the original destination (returnTo) if the profile is complete
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const returnTo = searchParams.get('returnTo') ?? '/dashboard';

    // FIX: Safely handle production domains (like Vercel) where 'origin' might be an internal IP
    const forwardedHost = request.headers.get('x-forwarded-host');
    const isProduction = process.env.NODE_ENV === 'production';
    const baseUrl = isProduction && forwardedHost ? `https://${forwardedHost}` : origin;

    if (code) {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error && data?.user) {
        // Check whether the user already has a full_name in their profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', data.user.id)
          .single();

        if (profile?.full_name) {
          // Existing user with complete profile
          return NextResponse.redirect(`${baseUrl}${returnTo}`);
        } else {
          // New user — collect name first
          const params = new URLSearchParams({ returnTo });
          return NextResponse.redirect(`${baseUrl}/auth/complete-profile?${params}`);
        }
      }
    }

    // Something went wrong with the code exchange
    return NextResponse.redirect(`${baseUrl}/login?error=oauth_failed`);
  } catch (err) {
    console.error("Auth Callback Error:", err);
    // FIX: Catch server errors so the browser never hangs on a blank screen
    const { origin } = new URL(request.url);
    return NextResponse.redirect(`${origin}/login?error=server_error`);
  }
}
