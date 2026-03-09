import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Server-side client used in API routes
// Uses anon key — ensure RLS policies allow barber/admin operations
// For production, add SUPABASE_SERVICE_ROLE_KEY to env and use it here for admin routes
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
