# Relia Intranet

Internal staff dashboard for the Relia platform.

> **Working in this repo with an AI agent?** Read [`CLAUDE.md`](./CLAUDE.md) first. It's the canonical context for Claude Code, Cursor, Copilot, and any other agent. All the rules, patterns, and decisions are linked from there.

## Stack

Next.js 15 (App Router) on Cloudflare Pages, Supabase backend (Postgres + Auth + Storage), Cloudflare Access at the perimeter, Workers for edge logic, Sentry for observability, Linear for issues, Slack for notifications.

Full rationale: [`docs/decisions/0001-stack-choice.md`](./docs/decisions/0001-stack-choice.md).

## Quick start

```bash
# 1. Install
pnpm install

# 2. Set up env
cp .env.local.example .env.local
# fill in values - see CLAUDE.md for what's needed

# 3. Start Supabase locally
supabase start
supabase db reset      # applies migrations
pnpm supabase:types    # regenerates typed schema

# 4. Run dev server (LOCAL_DEV=1 bypasses Cloudflare Access)
LOCAL_DEV=1 pnpm dev
```

## Common commands

```bash
pnpm check          # lint + typecheck + test
pnpm test           # vitest
pnpm test:db        # pgTAP RLS tests
pnpm build          # production build
pnpm deploy         # deploy to Cloudflare Pages (CI does this on merge)
```

## Repo map

```
CLAUDE.md                  # canonical agent context (read this first)
.cursorrules               # Cursor pointer to CLAUDE.md
.github/
  copilot-instructions.md  # Copilot pointer to CLAUDE.md
  workflows/               # CI, code review, security, deploy notifications
  prompts/                 # prompts for AI agent workflows
docs/
  agents/                  # per-agent operating contracts
  skills/                  # reusable patterns (migrations, RLS, deploy)
  decisions/               # ADRs
  runbooks/                # rollback, security incident, etc
src/
  app/                     # Next.js routes + server components
  lib/                     # supabase, linear, slack, auth wrappers
supabase/
  migrations/              # append-only schema changes
  tests/                   # pgTAP RLS tests
workers/                   # Cloudflare Workers (cron, webhook receivers)
.security/allowlist.yml    # accepted-risk security findings
```

## Contributing

1. Find or create a Linear issue (REL-NNN).
2. Branch: `REL-NNN-short-slug`.
3. If introducing a new pattern, write an ADR first under `docs/decisions/`.
4. Make the change. Add tests.
5. `pnpm check` locally.
6. Open PR with title `REL-NNN: ...`. The code-review agent will comment.
7. Address review. Merge after a human approval.
