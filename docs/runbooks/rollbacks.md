# Runbook: Rollback

## When to roll back

- Production is broken in a way you can't hotfix in under 10 minutes.
- A security regression is in production.
- Data integrity is at risk.

If you're unsure: roll back. The deploy log is cheap; broken production is not.

## How to roll back

```bash
# 1. List recent deploys
wrangler pages deployment list --project-name relia-intranet

# 2. Identify the last-known-good deployment ID

# 3. Promote it to production
wrangler pages deployment promote <deployment-id> --project-name relia-intranet
```

## After rolling back

1. Post in `#relia-oncall` with: what broke, the deployment ID you rolled back to, and what's next.
2. Open a Linear issue tagged `incident` and `rollback`.
3. Within 24 hours, write a short post-mortem under `docs/runbooks/incidents/YYYY-MM-DD-slug.md`. Use the template in `incident-template.md`.
4. If the rollback was due to a security finding, also notify `#relia-security`.

## What rollback does NOT fix

- Database migrations. The Pages rollback only reverts code; the schema stays.
- External side effects (Slack messages already sent, Linear issues already created, emails already dispatched).
- Cache layers - Cloudflare cache may need a manual purge.

For schema rollbacks, see `database-rollback.md` (TODO).
