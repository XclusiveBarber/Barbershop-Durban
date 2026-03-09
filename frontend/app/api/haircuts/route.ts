import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET - Fetch all haircuts/services
 */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('haircuts')
      .select('*')
      .order('price', { ascending: true });

    if (error) {
      console.error('[supabase] Get haircuts error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const haircuts = (data ?? []).map((haircut: any) => ({
      id: haircut.id,
      name: haircut.name,
      price: haircut.price,
      description: haircut.description,
      image_url: haircut.image_url || '/placeholder.svg?height=300&width=300',
    }));

    return NextResponse.json({ haircuts });
  } catch (error) {
    console.error('[supabase] Get haircuts error:', error);
    return NextResponse.json({ error: 'Failed to fetch haircuts' }, { status: 500 });
  }
}

/**
 * POST - Create new haircut (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, price, description, image_url } = body;

    if (!name || !price) {
      return NextResponse.json({ error: 'Name and price are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('haircuts')
      .insert({
        name,
        price,
        description: description || null,
        image_url: image_url || null,
      })
      .select()
      .single();

    if (error) {
      console.error('[supabase] Create haircut error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, haircut: data });
  } catch (error) {
    console.error('[supabase] Create haircut error:', error);
    return NextResponse.json({ error: 'Failed to create haircut' }, { status: 500 });
  }
}
