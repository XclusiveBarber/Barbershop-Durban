import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

// GET /api/barbers - List all available barbers
router.get('/', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('barbers')
      .select('*')
      .eq('available', true);

    if (error) {
      console.error('[supabase] Get barbers error:', error);
      return res.status(500).json({ error: error.message });
    }

    const barbers = (data ?? []).map((barber: any) => ({
      id: barber.id,
      name: barber.full_name,
      specialty: barber.speciality || 'Barber',
      image_url: barber.image_url || '/placeholder.svg?height=300&width=300',
      available: barber.available,
    }));

    return res.json({ barbers });
  } catch (error) {
    console.error('[supabase] Get barbers error:', error);
    return res.status(500).json({ error: 'Failed to fetch barbers' });
  }
});

export default router;
