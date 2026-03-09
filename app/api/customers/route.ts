import { NextRequest, NextResponse } from 'next/server';

// GET - Get all customers (mock - database disabled)
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({ customers: [] });
  } catch (error: any) {
    console.error('[v0] Get customers error:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

// PATCH - Update customer notes/preferences (mock - database disabled)
export async function PATCH(request: NextRequest) {
  try {
    await request.json();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[v0] Update customer error:', error);
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}
