import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { phone, code, name } = await request.json();

    if (!phone || !code) {
      return NextResponse.json(
        { error: 'Phone and code required' },
        { status: 400 }
      );
    }

    // Mock verification - accept any code (database disabled)
    console.log(`[v0] Mock verification for ${phone} with code ${code}`);

    // Mock user data
    const user = {
      id: 1,
      phone,
      name: name || 'Guest User',
      role: 'customer'
    };

    // Set mock session cookie
    const response = NextResponse.json({
      success: true,
      user
    });

    response.cookies.set('session', 'mock-session-id', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    return response;
  } catch (error) {
    console.error('[v0] Verify OTP error:', error);
    return NextResponse.json(
      { error: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}
