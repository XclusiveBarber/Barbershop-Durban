import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Generate 6-digit OTP (mock - database disabled)
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    console.log(`[v0] Mock OTP for ${phone}: ${code}`);

    return NextResponse.json({ 
      success: true,
      message: 'OTP sent successfully',
      // Include code for testing (no real SMS or database)
      code
    });
  } catch (error) {
    console.error('[v0] Send OTP error:', error);
    return NextResponse.json(
      { error: 'Failed to send OTP' },
      { status: 500 }
    );
  }
}
