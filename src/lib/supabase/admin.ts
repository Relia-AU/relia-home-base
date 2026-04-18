import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

/**
 * Service-role Supabase client. BYPASSES RLS.
 *
 * Allowed callers (per docs/decisions/0003-rls-strategy.md):
 *   - Migrations
 *   - Scheduled jobs in workers/
 *   - Webhook handlers AFTER signature verification
 *
 * Forbidden callers:
 *   - Anything in src/app/(authenticated)/* that reads user data
 *   - Anything that runs in response to a client request without verifying
 *     the user identity first
 *
 * If you find yourself reaching for this client, ask: "could RLS handle this
 * if the user were authenticated?" If yes, use ./server.ts instead.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'Service-role Supabase client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY',
    );
  }

  return createSupabaseClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
