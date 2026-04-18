import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types';

/**
 * Browser-side Supabase client. Uses the anon key with RLS enforced.
 * Use this in client components (`'use client'`).
 *
 * For sensitive operations, prefer a server action that uses `./server.ts`.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
