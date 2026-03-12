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
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const returnTo = searchParams.get('returnTo') ?? '/dashboard';

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Check whether the user already has a full_name in their profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', data.user.id)
        .single();

      if (profile?.full_name) {
        // Existing user with complete profile — go straight to their destination
        return NextResponse.redirect(`${origin}${returnTo}`);
      } else {
        // New user (or profile exists but name was never set) — collect name first
        const params = new URLSearchParams({ returnTo });
        return NextResponse.redirect(`${origin}/auth/complete-profile?${params}`);
      }
    }
  }

  // Something went wrong — send back to login with an error flag
  return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
}
