/**
 * Cron Worker for Relia Intranet.
 * Runs every 15 minutes to sync Linear issues → Supabase.
 * Runs nightly at 03:00 AEST for cleanup tasks.
 */

import { createClient } from '@supabase/supabase-js';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  LINEAR_API_KEY: string;
  SLACK_WEBHOOK_ENG: string;
}

interface LinearIssue {
  id: string;
  identifier: string;
  title: string;
  description: string | null;
  state: { name: string };
  priority: number;
  assignee: { name: string; email: string } | null;
  team: { name: string } | null;
  labels: { nodes: { name: string }[] };
  url: string;
  createdAt: string;
  updatedAt: string;
}

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const cron = event.cron;
    if (cron === '*/15 * * * *') {
      ctx.waitUntil(syncLinear(env));
    } else {
      ctx.waitUntil(runNightlyTasks(env));
    }
  },
} satisfies ExportedHandler<Env>;

async function syncLinear(env: Env) {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const query = `
    query {
      issues(first: 100, orderBy: updatedAt) {
        nodes {
          id identifier title description
          state { name }
          priority
          assignee { name email }
          team { name }
          labels { nodes { name } }
          url createdAt updatedAt
        }
      }
    }
  `;

  const res = await fetch('https://api.linear.app/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': env.LINEAR_API_KEY,
    },
    body: JSON.stringify({ query }),
  });

  const json = await res.json() as { data?: { issues?: { nodes: LinearIssue[] } } };
  const issues = json.data?.issues?.nodes ?? [];

  for (const issue of issues) {
    await supabase.from('linear_issues').upsert({
      linear_id:   issue.id,
      identifier:  issue.identifier,
      title:       issue.title,
      description: issue.description ?? null,
      status:      issue.state.name.toLowerCase().replace(/\s+/g, '_'),
      priority:    issue.priority,
      project:     issue.team?.name ?? null,
      labels:      issue.labels.nodes.map(l => l.name),
      linear_url:  issue.url,
      synced_at:   new Date().toISOString(),
      updated_at:  issue.updatedAt,
    }, { onConflict: 'linear_id' });
  }
}

async function runNightlyTasks(env: Env) {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const results: string[] = [];

  try {
    const { count } = await supabase.from('linear_issues').select('*', { count: 'exact', head: true });
    results.push(`Linear issues synced: ${count ?? 0}`);
  } catch (err) {
    results.push(`Nightly task failed: ${err instanceof Error ? err.message : 'unknown'}`);
  }

  if (env.SLACK_WEBHOOK_ENG) {
    await fetch(env.SLACK_WEBHOOK_ENG, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: `Nightly cron:\n${results.map(r => `- ${r}`).join('\n')}` }),
    });
  }
}
