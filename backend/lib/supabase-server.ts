import { createServerClient } from '@supabase/ssr';
import { Request, Response } from 'express';

/**
 * Creates a Supabase server client for Express routes.
 * Reads and writes the Supabase SSR auth cookies (sb-*-auth-token) from the
 * Express request/response — identical behaviour to the Next.js version but
 * using Express's req.cookies / res.cookie APIs instead of next/headers.
 */
export function createSupabaseServerClient(req: Request, res: Response) {
  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies[name];
        },
        set(name: string, value: string, options: any) {
          res.cookie(name, value, options);
        },
        remove(name: string, options: any) {
          res.clearCookie(name, options);
        },
      },
    }
  );
}
