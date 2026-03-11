import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { createSupabaseServerClient } from '../lib/supabase-server';
import { sendCompletedEmail, sendLateArrivalEmail } from '../lib/email';
import { format } from 'date-fns';

const router = Router();

// GET /api/appointments - Fetch appointments for the authenticated user
router.get('/', async (req: Request, res: Response) => {
  try {
    // createSupabaseServerClient reads the sb-*-auth-token cookie set by
    // @supabase/ssr — no manual Authorization header needed.
    const supabaseUser = createSupabaseServerClient(req, res);

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data, error } = await supabaseUser
      .from('appointments')
      .select(`
        id,
        appointment_date,
        time_slot,
        status,
        total_price,
        payment_status,
        created_at,
        haircut_id,
        barber_id,
        haircuts ( name, price ),
        barbers ( full_name )
      `)
      .eq('user_id', user.id)
      .order('appointment_date', { ascending: false });

    if (error) {
      console.error('[appointments GET] Supabase error:', error.message);
      return res.status(500).json({ error: error.message });
    }

    return res.json({ appointments: data ?? [] });
  } catch (err) {
    console.error('[appointments GET] Unexpected error:', err);
    return res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// POST /api/appointments - Create a new appointment
router.post('/', async (req: Request, res: Response) => {
  try {
    const supabaseUser = createSupabaseServerClient(req, res);

    // Support both "appointment_time" (from booking-system) and "time_slot" (legacy)
    const {
      appointment_date,
      appointment_time,
      time_slot,
      barber_id,
      haircut_id,
      status,
      total_price,
      payment_status,
    } = req.body;

    const resolvedTimeSlot = time_slot ?? appointment_time;

    if (!appointment_date || !resolvedTimeSlot) {
      return res.status(400).json({ error: 'appointment_date and appointment_time are required' });
    }

    // Identify the requesting user from the session cookie
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized. Please log in to book.' });
    }

    const insertData: Record<string, unknown> = {
      user_id: user.id,
      appointment_date,
      time_slot: resolvedTimeSlot,
      status: status ?? 'pending',
      payment_status: payment_status ?? 'unpaid',
    };

    if (barber_id) insertData.barber_id = barber_id;
    if (haircut_id) insertData.haircut_id = haircut_id;
    if (total_price !== undefined) insertData.total_price = total_price;

    const { data, error } = await supabaseUser
      .from('appointments')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('[appointments POST] Supabase error:', error.message);
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json({ success: true, appointment: data });
  } catch (err) {
    console.error('[appointments POST] Unexpected error:', err);
    return res.status(500).json({ error: 'Failed to create appointment' });
  }
});

// GET /api/appointments/all - All appointments for admin/barber dashboards
// NOTE: This route must be registered BEFORE /:id to avoid being shadowed
router.get('/all', async (req: Request, res: Response) => {
  try {
    const dateFilter = req.query.date as string | undefined;
    const barberFilter = req.query.barber_id as string | undefined;

    let query = supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        time_slot,
        status,
        total_price,
        barber_id,
        haircuts ( name, price ),
        profiles:profiles!user_id ( full_name, email ),
        barbers ( id, full_name )
      `)
      .order('appointment_date', { ascending: false })
      .order('time_slot', { ascending: true });

    if (dateFilter) {
      query = query.eq('appointment_date', dateFilter);
    }
    if (barberFilter) {
      query = query.eq('barber_id', barberFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[appointments/all] Supabase error:', error.message);
      return res.status(500).json({ error: error.message });
    }

    const appointments = (data ?? []).map((a: any) => {
      const servicePrice = a.total_price != null
        ? `R${a.total_price}`
        : a.haircuts?.price != null
          ? `R${a.haircuts.price}`
          : '—';

      return {
        id: a.id,
        appointment_date: a.appointment_date,
        appointment_time: a.time_slot,
        status: a.status,
        service_name: a.haircuts?.name ?? '—',
        service_price: servicePrice,
        customer_name: a.profiles?.full_name ?? 'Guest',
        customer_email: a.profiles?.email ?? null,
        barber_name: a.barbers?.full_name ?? '—',
        barber_id: a.barber_id,
        customer_phone: '',
      };
    });

    return res.json({ appointments });
  } catch (err) {
    console.error('[appointments/all] Unexpected error:', err);
    return res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// GET /api/appointments/:id - Fetch single appointment
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
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

  if (error) return res.status(404).json({ error: 'Appointment not found' });
  return res.json({ appointment: data });
});

// PATCH /api/appointments/:id - Update appointment status
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const allowed = ['pending', 'confirmed', 'completed', 'late', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
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
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Update status in Supabase
    const { error: updateError } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id);

    if (updateError) {
      console.error('[supabase] Update appointment error:', updateError);
      return res.status(500).json({ error: updateError.message });
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

    return res.json({ success: true, status });
  } catch (error) {
    console.error('[supabase] PATCH appointment error:', error);
    return res.status(500).json({ error: 'Failed to update appointment' });
  }
});

// DELETE /api/appointments/:id - Cancel appointment
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.json({ success: true });
  } catch (error) {
    console.error('[supabase] Cancel appointment error:', error);
    return res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

export default router;
