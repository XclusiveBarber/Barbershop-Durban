import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

/**
 * PATCH /api/profiles/newsletter
 * Subscribe user to newsletter
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { wantsNewsletter } = await request.json();

    if (typeof wantsNewsletter !== 'boolean') {
      return NextResponse.json(
        { error: 'wantsNewsletter must be a boolean' },
        { status: 400 }
      );
    }

    // Update user profile
    const { data, error } = await supabase
      .from('profiles')
      .update({ wants_newsletter: wantsNewsletter })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('[newsletter] Update error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to update newsletter preference' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: wantsNewsletter ? 'Subscribed to newsletter' : 'Unsubscribed from newsletter',
      data,
    });
  } catch (err) {
    console.error('[newsletter] Error:', err);
    return NextResponse.json(
      { error: 'Failed to update newsletter preference' },
      { status: 500 }
    );
  }
}
