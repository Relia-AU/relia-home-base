# Skill: Cloudflare Deploy

## Architecture

```
                    [staff browser]
                           |
                  [Cloudflare Access]   <- Org SSO gate. Strangers stop here.
                           |
                  [Cloudflare Pages]    <- Next.js app, static + edge functions
                           |
              +------------+------------+
              |                         |
      [Cloudflare Workers]        [Supabase]
      (webhook receivers,         (Postgres + Auth + Storage)
       cron jobs, edge logic)
```

## Pages

- Project name: `relia-intranet`
- Build command: `pnpm build`
- Output directory: `.vercel/output/static` (Next.js on Pages uses the Vercel build adapter)
- Production branch: `main`. Every other branch becomes a preview deploy.
- Environment variables: managed in Cloudflare dashboard, **not** committed. Mirror to `.env.local.example` (with empty values) so agents know what's needed.

## Workers

Each Worker lives in `workers/<name>/` with its own `wrangler.toml`. Conventions:

- Workers handle: webhook receivers (Linear, Slack, Sentry, Stripe-style HMAC verification), scheduled jobs, image transforms.
- Workers do NOT: render pages, query Supabase directly except via authenticated server-to-server calls, hold business logic that belongs in the app.
- Every Worker has a test in `workers/<name>/test/` using `vitest` with `@cloudflare/vitest-pool-workers`.

## Cloudflare Access

- Application: `relia-intranet.<your-domain>` and all preview deploys (`*.relia-intranet.pages.dev`).
- Policy: members of the Relia GSuite org.
- Service tokens: only for CI smoke tests and the security agent's nightly access-log review. Stored in GitHub Actions secrets and Cloudflare's secret store.

## Deploy flow

1. PR opened -> preview deploy at `<branch>.relia-intranet.pages.dev`. Behind Access (same policy).
2. PR merged to `main` -> production deploy.
3. Slack notification to `#relia-deploys` with commit, author, and link.
4. Sentry release marker created automatically via the build hook.

## Rolling back

```bash
# List recent deploys
wrangler pages deployment list --project-name relia-intranet

# Promote a specific deployment to production
wrangler pages deployment promote <deployment-id> --project-name relia-intranet
```

Rollback also pings Slack. Document the reason in `docs/runbooks/rollbacks.md`.
