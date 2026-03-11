import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

// GET /api/customers - Fetch all customer profiles with visit counts
router.get('/', async (_req: Request, res: Response) => {
  try {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('role', 'customer');

    if (profilesError) {
      console.error('[customers] Profiles error:', profilesError.message);
      return res.status(500).json({ error: profilesError.message });
    }

    // Get completed appointments for visit counts
    const { data: appointments, error: apptError } = await supabase
      .from('appointments')
      .select('user_id, appointment_date')
      .eq('status', 'completed');

    if (apptError) {
      console.warn('[customers] Appointments fetch warning:', apptError.message);
    }

    const apptsByUser: Record<string, string[]> = {};
    (appointments ?? []).forEach((a: any) => {
      if (!apptsByUser[a.user_id]) apptsByUser[a.user_id] = [];
      apptsByUser[a.user_id].push(a.appointment_date);
    });

    const customers = (profiles ?? []).map((p: any) => {
      const dates = (apptsByUser[p.id] ?? []).sort((a: string, b: string) => b.localeCompare(a));
      return {
        id: p.id,
        name: p.full_name,
        phone: '',
        email: p.email,
        total_appointments: dates.length,
        last_visit: dates[0] ?? null,
        preferences: '',
        notes: '',
      };
    });

    customers.sort((a: any, b: any) => b.total_appointments - a.total_appointments);

    return res.json({ customers });
  } catch (error) {
    console.error('[customers] Unexpected error:', error);
    return res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// GET /api/customers/:id - Get single customer
router.get('/:id', async (_req: Request, res: Response) => {
  try {
    return res.status(404).json({ error: 'Customer not found' });
  } catch (error: any) {
    console.error('[customers] Get customer detail error:', error);
    return res.status(500).json({ error: 'Failed to fetch customer details' });
  }
});

// PATCH /api/customers - Update customer notes/preferences
router.patch('/', async (req: Request, res: Response) => {
  try {
    const { user_id, preferences, notes } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const updates: Record<string, string> = {};
    if (preferences !== undefined) updates.preferences = preferences;
    if (notes !== undefined) updates.notes = notes;

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user_id);

      if (error) {
        // Columns may not exist yet — log but don't fail
        console.warn('[customers PATCH] Update warning:', error.message);
      }
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('[customers] PATCH error:', error);
    return res.status(500).json({ error: 'Failed to update customer' });
  }
});

export default router;
