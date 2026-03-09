import { NextRequest, NextResponse } from 'next/server';

// GET - Get single appointment (mock - database disabled)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
  } catch (error) {
    console.error('[v0] Get appointment error:', error);
    return NextResponse.json({ error: 'Failed to fetch appointment' }, { status: 500 });
  }
}

// PATCH - Update appointment (mock - database disabled)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await request.json();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[v0] Update appointment error:', error);
    return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 });
  }
}

// DELETE - Cancel appointment (mock - database disabled)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[v0] Cancel appointment error:', error);
    return NextResponse.json({ error: 'Failed to cancel appointment' }, { status: 500 });
  }
}
