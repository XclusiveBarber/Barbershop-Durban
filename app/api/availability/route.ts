import { NextRequest, NextResponse } from 'next/server';

// GET - Get barber availability (mock - database disabled)
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({ availability: [] });
  } catch (error) {
    console.error('[v0] Get availability error:', error);
    return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 });
  }
}

// POST - Add barber unavailability (mock - database disabled)
export async function POST(request: NextRequest) {
  try {
    await request.json();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[v0] Create availability error:', error);
    return NextResponse.json({ error: 'Failed to create availability record' }, { status: 500 });
  }
}

// DELETE - Remove availability record (mock - database disabled)
export async function DELETE(request: NextRequest) {
  try {
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[v0] Delete availability error:', error);
    return NextResponse.json({ error: 'Failed to delete availability record' }, { status: 500 });
  }
}
