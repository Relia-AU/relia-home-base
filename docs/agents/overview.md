# Agents Overview

This repo is built with AI agents as first-class collaborators. This file defines the contract every agent operates under.

## What an "agent" is here

We use "agent" to mean two distinct things, both legitimate:

1. **Interactive coding agents** working alongside humans: Claude Code, Cursor, Copilot Chat, GPT in the browser. These read files, propose changes, and a human accepts.
2. **Autonomous agents** running on schedules or triggers: the code-review bot on PRs, the security agent on push, the Linear triage agent on new issues.

Both kinds read `CLAUDE.md` and the relevant files under `docs/agents/`.

## The agent contract

Every agent acting in this repo agrees to:

- **Read before writing.** Skim `CLAUDE.md` and any ADRs that touch the area you're modifying.
- **Stay in scope.** If the task is "fix this bug," don't refactor adjacent code unless asked. If you spot something, raise it as a comment or a follow-up Linear issue.
- **Surface uncertainty.** If you're guessing at intent, say so out loud and ask. Don't ship a confident wrong answer.
- **Leave a trail.** Branch names, commit messages, and PR descriptions reference the Linear issue. ADRs cover decisions. Decision logs are not optional.
- **Don't self-approve.** Agents can open PRs, comment on PRs, run checks. A human merges.

## Sub-agents (for Claude Code specifically)

For multi-file or multi-stage work, delegate to focused sub-agents rather than loading everything into one context. Suggested pattern:

| Sub-agent | When to spawn | Reads |
|---|---|---|
| `migrations` | DB schema changes | `docs/skills/supabase-migrations.md`, `docs/skills/rls-policies.md`, existing migrations |
| `ui-component` | New React component | `docs/skills/component-conventions.md`, existing components in `src/components/` |
| `worker` | New Cloudflare Worker | `docs/skills/cloudflare-deploy.md`, existing workers in `workers/` |
| `webhook` | New webhook receiver | `docs/skills/linear-api.md` or `docs/skills/slack-notify.md`, existing routes in `src/app/api/webhooks/` |

Spawn sub-agents with the minimum context they need. Don't dump the whole repo.

## Agent roster (autonomous)

- **Code review agent** (`code-review-agent.md`): runs on every PR.
- **Security agent** (`security-agent.md`): runs on every push and on a nightly schedule.
- **Triage agent** (`triage-agent.md`): runs on new Linear issues and untriaged GitHub issues.

## Failure modes to avoid

- Inventing Linear issue IDs. Always look up or create.
- "Helpfully" upgrading dependencies inside an unrelated PR.
- Generating tests that just assert what the implementation does (tautological tests). Test behaviour, not implementation.
- Touching `supabase/migrations/` files that are already merged.
- Adding an integration without an ADR if there isn't one.
