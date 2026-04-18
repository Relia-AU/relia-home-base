import 'server-only';

type Channel = 'deploys' | 'oncall' | 'security' | 'eng';

const ENV_MAP: Record<Channel, string> = {
  deploys: 'SLACK_WEBHOOK_DEPLOYS',
  oncall: 'SLACK_WEBHOOK_ONCALL',
  security: 'SLACK_WEBHOOK_SECURITY',
  eng: 'SLACK_WEBHOOK_ENG',
};

interface SlackPayload {
  text: string;
  blocks?: unknown[];
}

const recentSends = new Map<string, number>();
const DEDUP_WINDOW_MS = 5 * 60 * 1000;

export async function notify(
  channel: Channel,
  payload: SlackPayload,
  options: { critical?: boolean } = {},
) {
  const url = process.env[ENV_MAP[channel]];
  if (!url) {
    console.warn(`Slack webhook for channel "${channel}" is not configured`);
    return;
  }

  // Dedup non-critical alerts within the window
  if (!options.critical) {
    const key = `${channel}:${payload.text}`;
    const last = recentSends.get(key);
    if (last && Date.now() - last < DEDUP_WINDOW_MS) return;
    recentSends.set(key, Date.now());
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Slack notify failed: ${res.status} ${await res.text()}`);
  }
}
