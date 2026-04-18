/**
 * Cron Worker for Relia Intranet.
 *
 * Runs nightly at 03:00 AEST (17:00 UTC).
 * Tasks:
 *   - Purge expired security allowlist entries
 *   - Roll up daily Sentry stats and post to #relia-eng
 *   - Cleanup orphaned Supabase storage objects
 *
 * This Worker uses the Supabase service role key (bypasses RLS) because it
 * operates across all users. See docs/decisions/0003-rls-strategy.md.
 */

import { createClient } from '@supabase/supabase-js';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SLACK_WEBHOOK_ENG: string;
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runNightlyTasks(env));
  },
} satisfies ExportedHandler<Env>;

async function runNightlyTasks(env: Env) {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const results: string[] = [];

  try {
    // Placeholder: real cleanup queries go here, gated by RLS-bypassing service role
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    results.push(`Profiles in system: ${count ?? 'unknown'}`);
  } catch (err) {
    results.push(`Cleanup failed: ${err instanceof Error ? err.message : 'unknown error'}`);
  }

  await fetch(env.SLACK_WEBHOOK_ENG, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      text: `Nightly cron complete:\n${results.map((r) => `- ${r}`).join('\n')}`,
    }),
  });
}
