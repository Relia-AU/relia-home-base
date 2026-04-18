# CLAUDE.md

> **This file is the canonical context for all AI agents working in this repo** (Claude Code, Cursor, GitHub Copilot Chat, Codex, etc.). Read it first, every session.

## What this project is

**Relia Intranet** is an internal staff dashboard for the Relia platform. Not customer-facing. Auth-gated behind Cloudflare Access (org SSO) at the edge, with Supabase Auth providing in-app user identity and row-level security.

**Audience:** internal Relia staff only. Treat all data as internal-confidential by default.

## Stack at a glance

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) | Server components for auth-gated Supabase queries; mature ecosystem |
| Hosting | Cloudflare Pages | Edge-distributed, integrates with Access + Workers |
| Edge logic | Cloudflare Workers | Webhook receivers, rate limiting |
| Auth (perimeter) | Cloudflare Access | Org SSO, blocks the whole site at the edge |
| Auth (in-app) | Supabase Auth | User identity, RLS policy enforcement |
| Database | Supabase Postgres | RLS-first, migrations in `supabase/migrations/` |
| Observability | Sentry | Errors + performance, both client and server |
| Issues | Linear | Source of truth for work; webhooks land in `/api/webhooks/linear` |
| Notifications | Slack | Deploy + incident pings via `/api/webhooks/slack` |
| CI | GitHub Actions | Lint, test, Semgrep, Snyk, Socket on every PR |

Full architecture rationale: `docs/decisions/0001-stack-choice.md`.

## How to navigate this repo as an agent

```
/CLAUDE.md                  <- you are here, the index
/.cursorrules               <- Cursor reads this; it points back here
/.github/copilot-instructions.md  <- Copilot reads this; same
/docs/
  /agents/                  <- per-agent operating instructions
    overview.md             <- start here for any agent task
    code-review-agent.md    <- the GH Action bot that reviews PRs
    security-agent.md       <- automated security triage
    triage-agent.md         <- Linear issue triage
  /skills/                  <- reusable capabilities any agent can invoke
    supabase-migrations.md  <- how to write/apply migrations safely
    rls-policies.md         <- how to write Postgres RLS
    cloudflare-deploy.md    <- deploying to Pages + Workers
    linear-api.md           <- Linear GraphQL patterns we use
    slack-notify.md         <- Slack webhook payload shapes
  /decisions/               <- ADRs, one per architectural decision
    0001-stack-choice.md
    0002-auth-model.md
    0003-rls-strategy.md
  /runbooks/                <- on-call / incident playbooks
/src/                       <- Next.js app
/supabase/                  <- migrations + seed data
/workers/                   <- Cloudflare Workers (webhook receivers)
```

## Hard rules for agents (do not violate)

1. **Never commit secrets.** All secrets live in `.env.local` (dev), Cloudflare environment variables (prod), and GitHub Actions secrets (CI). If you find a secret in code, stop and flag it.
2. **Never bypass RLS.** All Supabase queries from the client must go through RLS-protected views. Service-role key is server-only and only used in API routes that have already authenticated the user.
3. **Migrations are append-only.** Never edit a migration that has been merged to `main`. Write a new one.
4. **Every architectural decision gets an ADR.** If you're choosing between two libraries, two patterns, or two services, write `docs/decisions/NNNN-<slug>.md` first. Don't just pick.
5. **Linear is the source of truth for work.** Don't invent task IDs. If there's no Linear issue, the work isn't real yet; ask the user to create one or do it via the Linear MCP.
6. **No `any` in TypeScript** unless justified in a comment on the line above.
7. **Tests for any new server action or API route.** Use Vitest. Co-locate as `*.test.ts`.

## Workflow for any non-trivial change

1. Read `docs/agents/overview.md` for the agent contract.
2. Check `docs/decisions/` for relevant ADRs.
3. If the change involves a new pattern or dependency, draft an ADR first and put it in `docs/decisions/` as `proposed`.
4. Find or create a Linear issue. Reference it in the branch name and PR title (`REL-123: ...`).
5. Make the change. Write tests.
6. Run `pnpm check` (lint + typecheck + test) locally.
7. Open PR. The code-review agent (`docs/agents/code-review-agent.md`) will comment automatically.
8. Security agent runs Semgrep + Snyk + Socket; address findings before merge.
9. On merge to `main`, Cloudflare Pages auto-deploys; Slack gets a notification.

## Per-agent quick reference

- **Claude Code (CLI/IDE):** reads this file automatically. For multi-file refactors, use sub-agents per `docs/agents/overview.md`.
- **Cursor:** `.cursorrules` points here. Use `@docs` in chat to pull in any decision log.
- **Copilot:** `.github/copilot-instructions.md` points here. Inline suggestions only; for anything architectural, use Copilot Chat with `#file:CLAUDE.md` attached.
- **GPT / external agents:** paste this file as the system prompt prelude.

## What "done" looks like

A change is done when: tests pass, ADR is written if needed, Linear issue is moved to Done, security checks are green, the deploy notification has landed in `#relia-deploys`, and a human has approved the PR. Agents do not self-approve.
