import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Clear cookie (database disabled)
    const response = NextResponse.json({ success: true });
    response.cookies.delete('session');

    return response;
  } catch (error) {
    console.error('[v0] Logout error:', error);
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
  }
}
