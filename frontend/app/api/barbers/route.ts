import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('barbers')
      .select('*')
      .eq('available', true);

    if (error) {
      console.error('[supabase] Get barbers error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const barbers = (data ?? []).map((barber: any) => ({
      id: barber.id,
      name: barber.full_name,
      specialty: barber.speciality || 'Barber',
      image_url: barber.image_url || '/placeholder.svg?height=300&width=300',
      available: barber.available,
    }));

    return NextResponse.json({ barbers });
  } catch (error) {
    console.error('[supabase] Get barbers error:', error);
    return NextResponse.json({ error: 'Failed to fetch barbers' }, { status: 500 });
  }
}
