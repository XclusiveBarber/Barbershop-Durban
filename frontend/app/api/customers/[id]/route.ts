import { NextRequest, NextResponse } from 'next/server';

// GET - Get single customer (mock - database disabled)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  } catch (error: any) {
    console.error('[v0] Get customer detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch customer details' }, { status: 500 });
  }
}
