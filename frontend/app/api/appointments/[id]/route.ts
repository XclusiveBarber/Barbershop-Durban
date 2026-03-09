import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendCompletedEmail, sendLateArrivalEmail } from '@/lib/email';
import { format } from 'date-fns';

type Params = { params: Promise<{ id: string }> };

// GET - Fetch single appointment
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      id, appointment_date, time_slot, status, payment_status, total_price, created_at,
      profiles!user_id ( id, full_name, email ),
      barbers!barber_id ( id, full_name ),
      haircuts!haircut_id ( id, name, price )
    `)
    .eq('id', id)
    .single();

  if (error) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
  return NextResponse.json({ appointment: data });
}

// PATCH - Update appointment status (handles: confirmed, completed, late, cancelled)
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const allowed = ['pending', 'confirmed', 'completed', 'late', 'cancelled'];
    if (!allowed.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Fetch appointment with related data before updating
    const { data: existing, error: fetchError } = await supabase
      .from('appointments')
      .select(`
        id, appointment_date, time_slot, status, total_price,
        profiles!user_id ( full_name, email ),
        barbers!barber_id ( full_name ),
        haircuts!haircut_id ( name, price )
      `)
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Update status in Supabase
    const { error: updateError } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id);

    if (updateError) {
      console.error('[supabase] Update appointment error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Send email only for critical status changes: completed or late
    const customerEmail = (existing.profiles as any)?.email;
    if (customerEmail && (status === 'completed' || status === 'late')) {
      const emailData = {
        customerEmail,
        customerName: (existing.profiles as any)?.full_name ?? 'Valued Customer',
        serviceName: (existing.haircuts as any)?.name ?? 'Service',
        servicePrice: existing.total_price != null
          ? `R${existing.total_price}`
          : `R${(existing.haircuts as any)?.price ?? '0'}`,
        barberName: (existing.barbers as any)?.full_name ?? 'Your Barber',
        appointmentDate: format(new Date(existing.appointment_date), 'EEEE, MMMM d, yyyy'),
        appointmentTime: existing.time_slot,
      };

      try {
        if (status === 'completed') {
          await sendCompletedEmail(emailData);
        } else if (status === 'late') {
          await sendLateArrivalEmail(emailData);
        }
      } catch (emailError) {
        // Email failure must not block the status update
        console.error('[resend] Email send failed:', emailError);
      }
    }

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error('[supabase] PATCH appointment error:', error);
    return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 });
  }
}

// DELETE - Cancel appointment
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[supabase] Cancel appointment error:', error);
    return NextResponse.json({ error: 'Failed to cancel appointment' }, { status: 500 });
  }
}
