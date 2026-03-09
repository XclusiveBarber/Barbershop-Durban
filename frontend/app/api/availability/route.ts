import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Define time slots for the barbershop
const TIME_SLOTS = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'];

/**
 * GET - Get available time slots for a barber on a specific date
 * Query params: barber_id, date
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barber_id = searchParams.get('barber_id');
    const date = searchParams.get('date');

    if (!barber_id || !date) {
      return NextResponse.json({ error: 'barber_id and date are required' }, { status: 400 });
    }

    // Get all appointments for this barber on this date
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('time_slot')
      .eq('barber_id', barber_id)
      .eq('appointment_date', date)
      .in('status', ['pending', 'approved']);

    if (error) {
      console.error('[supabase] Get availability error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get booked time slots
    const bookedSlots = (appointments ?? []).map((apt: any) => apt.time_slot);

    // Return available slots
    const availableSlots = TIME_SLOTS.filter(slot => !bookedSlots.includes(slot));

    return NextResponse.json({ available_slots: availableSlots, booked_slots: bookedSlots });
  } catch (error) {
    console.error('[supabase] Get availability error:', error);
    return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 });
  }
}
