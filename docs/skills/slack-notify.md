# Skill: Slack Notifications

## Channels

| Channel | Purpose |
|---|---|
| `#relia-deploys` | Every production deploy, every rollback |
| `#relia-oncall` | Pages, incidents, security criticals |
| `#relia-security` | Security agent daily summaries, allowlist expiry warnings |
| `#relia-eng` | General engineering chatter, agent triage notes |

## Auth

Each channel has its own incoming webhook URL. Stored as:
- `SLACK_WEBHOOK_DEPLOYS`
- `SLACK_WEBHOOK_ONCALL`
- `SLACK_WEBHOOK_SECURITY`
- `SLACK_WEBHOOK_ENG`

Never use one webhook for the wrong channel; the URL is the auth.

## Payload templates

Wrapper in `src/lib/slack/notify.ts`. Always use the wrapper, not raw `fetch`.

### Deploy notification

```ts
await slack.notify('deploys', {
  text: `Deployed ${shortSha} to production`,
  blocks: [
    { type: 'header', text: { type: 'plain_text', text: 'Production deploy' } },
    { type: 'section', fields: [
      { type: 'mrkdwn', text: `*Commit:*\n<${commitUrl}|${shortSha}>` },
      { type: 'mrkdwn', text: `*Author:*\n${author}` },
      { type: 'mrkdwn', text: `*Linear:*\n${linearRef ?? '_none_'}` },
      { type: 'mrkdwn', text: `*Diff:*\n<${compareUrl}|view>` },
    ]},
  ],
});
```

### Incident page

Use `oncall` channel + `<!here>` mention. Include: severity, what's broken, who's investigating, runbook link. Never include user data or secrets.

## Rate limits and dedup

- Slack rejects > 1 message/sec per webhook. The wrapper queues and batches.
- Repeated identical alerts within 5 minutes are deduped (hash the payload).
- Critical alerts bypass dedup.
