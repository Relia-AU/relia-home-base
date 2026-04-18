# Runbook: Security Incident

## Severity

- **SEV-1:** confirmed data exfiltration, confirmed unauthorised access, secret leaked to public source.
- **SEV-2:** vulnerability with confirmed exploit path but no confirmed exploitation; high-CVSS dependency in production.
- **SEV-3:** lower-risk finding requiring action within a sprint.

## First 15 minutes (SEV-1)

1. **Contain.** If a secret leaked, rotate it immediately (Supabase keys, Linear tokens, Slack webhooks, Anthropic key, Cloudflare API tokens). Rotation order: most-privileged first.
2. **Communicate.** Post in `#relia-oncall`: what happened, what you've done so far, what you need help with. Tag `@here`.
3. **Preserve evidence.** Don't delete the offending commit, branch, or log entry; you'll need it for the post-mortem and possible disclosure.
4. **Cloudflare Access lockdown** (if user access is suspected): tighten the Access policy temporarily to admin-only.

## First hour

- Open a Linear issue tagged `incident` and `security`. Severity in the title.
- Identify scope: which users, which records, which systems.
- Decide on disclosure path. Internal first; external (customers, regulators) per the disclosure policy (TODO: link).

## Within 24 hours

- Post-mortem in `docs/runbooks/incidents/YYYY-MM-DD-slug.md`.
- Allowlist updates (if any) reviewed and approved by a second person.
- If a CVE was the trigger, confirm Snyk and Dependabot now flag it; if not, file an upstream report.

## Things to NOT do

- Do not announce the incident publicly until disclosure is decided.
- Do not delete commits or rewrite history. Use revert commits.
- Do not push fixes without review, even under pressure. Pair on the fix.
- Do not skip the post-mortem because "it's resolved." Resolved without a post-mortem just means it'll happen again.

## Contacts

- Security on-call rota: TODO link to schedule
- Cloudflare account admin: TODO
- Supabase account admin: TODO
