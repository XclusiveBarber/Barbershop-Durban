import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

/**
 * GET /api/haircuts - Fetch all haircuts/services
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('haircuts')
      .select('*')
      .order('price', { ascending: true });

    if (error) {
      console.error('[supabase] Get haircuts error:', error);
      return res.status(500).json({ error: error.message });
    }

    const haircuts = (data ?? []).map((haircut: any) => ({
      id: haircut.id,
      name: haircut.name,
      price: haircut.price,
      description: haircut.description,
      image_url: haircut.image_url || '/placeholder.svg?height=300&width=300',
    }));

    return res.json({ haircuts });
  } catch (error) {
    console.error('[supabase] Get haircuts error:', error);
    return res.status(500).json({ error: 'Failed to fetch haircuts' });
  }
});

/**
 * POST /api/haircuts - Create new haircut (admin only)
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, price, description, image_url } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
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
      return res.status(500).json({ error: error.message });
    }

    return res.json({ success: true, haircut: data });
  } catch (error) {
    console.error('[supabase] Create haircut error:', error);
    return res.status(500).json({ error: 'Failed to create haircut' });
  }
});

export default router;
