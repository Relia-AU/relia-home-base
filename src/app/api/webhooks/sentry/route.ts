import { NextResponse } from 'next/server';
import { notify } from '@/lib/slack/notify';

export const runtime = 'nodejs';

interface SentryEvent {
  action: string;
  data?: {
    issue?: {
      title?: string;
      level?: string;
      shortId?: string;
      web_url?: string;
    };
  };
}

export async function POST(request: Request) {
  // Sentry signs webhooks with sentry-hook-signature; verify in production
  const event = (await request.json()) as SentryEvent;

  if (event.action === 'created' && event.data?.issue?.level === 'error') {
    const issue = event.data.issue;
    await notify('oncall', {
      text: `Sentry error: ${issue.title ?? 'unknown'}`,
      blocks: [
        { type: 'header', text: { type: 'plain_text', text: 'New Sentry error' } },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Issue:*\n${issue.shortId ?? '-'}` },
            { type: 'mrkdwn', text: `*Level:*\n${issue.level ?? '-'}` },
          ],
        },
        ...(issue.web_url
          ? [{
              type: 'actions',
              elements: [
                {
                  type: 'button',
                  text: { type: 'plain_text', text: 'View in Sentry' },
                  url: issue.web_url,
                },
              ],
            }]
          : []),
      ],
    });
  }

  return NextResponse.json({ ok: true });
}
