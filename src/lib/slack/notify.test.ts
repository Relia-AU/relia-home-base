import { describe, it, expect, vi, beforeEach } from 'vitest';

const fetchMock = vi.fn(async () => new Response('ok', { status: 200 }));
vi.stubGlobal('fetch', fetchMock);

beforeEach(() => {
  fetchMock.mockClear();
  process.env.SLACK_WEBHOOK_DEPLOYS = 'https://hooks.slack.test/deploys';
  vi.resetModules();
});

describe('slack notify', () => {
  it('sends a message to the configured channel', async () => {
    const { notify } = await import('./notify');
    await notify('deploys', { text: 'hello' });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://hooks.slack.test/deploys');
  });

  it('dedups identical non-critical messages within the window', async () => {
    const { notify } = await import('./notify');
    await notify('deploys', { text: 'same' });
    await notify('deploys', { text: 'same' });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('does not dedup critical messages', async () => {
    const { notify } = await import('./notify');
    await notify('deploys', { text: 'critical' }, { critical: true });
    await notify('deploys', { text: 'critical' }, { critical: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
