import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// GET - Fetch appointments with customer, barber and service info
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    let query = supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        time_slot,
        status,
        payment_status,
        total_price,
        created_at,
        profiles!user_id ( id, full_name, email ),
        barbers!barber_id ( id, full_name ),
        haircuts!haircut_id ( id, name, price )
      `)
      .order('appointment_date', { ascending: true });

    if (date) {
      query = query.eq('appointment_date', date);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[supabase] Get appointments error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Normalise to the shape the dashboards expect
    const appointments = (data ?? []).map((row: any) => ({
      id: row.id,
      service_name: row.haircuts?.name ?? 'Unknown Service',
      service_price: row.total_price != null ? `R${row.total_price}` : (row.haircuts?.price != null ? `R${row.haircuts.price}` : 'N/A'),
      appointment_date: row.appointment_date,
      appointment_time: row.time_slot,
      status: row.status,
      payment_status: row.payment_status,
      customer_name: row.profiles?.full_name ?? 'Unknown Customer',
      customer_email: row.profiles?.email ?? null,
      customer_id: row.profiles?.id ?? null,
      barber_name: row.barbers?.full_name ?? 'Unknown Barber',
      barber_id: row.barbers?.id ?? null,
      created_at: row.created_at,
    }));

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error('[supabase] Get appointments error:', error);
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
  }
}

// POST - Create a new appointment
export async function POST(request: NextRequest) {
  try {
    // 1. Securely initialize Supabase server client to read cookies
    const cookieStore = cookies();
    const supabaseServer = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // 2. Extract the user securely from the active session
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in to book.' }, { status: 401 });
    }

    const body = await request.json();
    const { barber_id, haircut_id, appointment_date, appointment_time, total_price } = body;

    if (!barber_id || !haircut_id || !appointment_date || !appointment_time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 3. Insert the appointment using the VERIFIED user.id
    const { data, error } = await supabaseServer
      .from('appointments')
      .insert({
        user_id: user.id,
        barber_id,
        haircut_id,
        appointment_date,
        time_slot: appointment_time,
        total_price: total_price ?? null,
        status: 'pending',
        payment_status: 'unpaid',
      })
      .select()
      .single();

    if (error) {
      console.error('[supabase] Create appointment error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, appointment: data });
  } catch (error) {
    console.error('[supabase] Create appointment error:', error);
    return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 });
  }
}
