# Skill: Linear API

Linear is the source of truth for work in this repo. This document captures the patterns we actually use.

## Auth

- Personal API keys for local dev (`LINEAR_API_KEY` in `.env.local`).
- OAuth app for the production webhook handlers (managed in Linear admin).
- Webhook signatures verified with `LINEAR_WEBHOOK_SECRET`.

## SDK

We use `@linear/sdk` (official). Wrapper in `src/lib/linear/client.ts`.

```ts
import { LinearClient } from '@linear/sdk';

export const linear = new LinearClient({
  apiKey: process.env.LINEAR_API_KEY!,
});
```

## Patterns

### Look up an issue by identifier

```ts
const issue = await linear.issue('REL-123');
```

### Create an issue from an agent

```ts
const team = await linear.team(process.env.LINEAR_TEAM_ID!);
await linear.createIssue({
  teamId: team.id,
  title: '...',
  description: '...',
  labelIds: [/* look up by name first */],
});
```

### Webhook payload shape

Webhooks land at `/api/webhooks/linear`. Verify the signature header `linear-signature` against the raw body using HMAC-SHA256 with `LINEAR_WEBHOOK_SECRET`. Reject anything that doesn't match.

Relevant event types we handle:
- `Issue.create` -> triage agent enriches.
- `Issue.update` (when state changes to `In Review`) -> Slack ping to reviewer.
- `Comment.create` mentioning `@relia-bot` -> route to the appropriate agent.

## What agents must NOT do

- Invent issue identifiers (`REL-9999` when REL only goes to 412). Look up first.
- Reassign issues. Suggest, don't act.
- Change priority. Humans own priority.
- Close issues. Mark as `Ready for Review` at most.
