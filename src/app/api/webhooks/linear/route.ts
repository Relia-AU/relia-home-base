import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';

export const runtime = 'nodejs';

function verifySignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const secret = process.env.LINEAR_WEBHOOK_SECRET;
  if (!secret) return false;

  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(signature, 'hex');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get('linear-signature');

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(rawBody) as { action: string; type: string; data: unknown };

  // TODO: route by event.action / event.type to triage agent, etc.
  // For now, just acknowledge.
  console.log('Linear event received', event.type, event.action);

  return NextResponse.json({ ok: true });
}
