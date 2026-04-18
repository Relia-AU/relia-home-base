# Security Agent

## Purpose

Aggregates findings from automated scanners, deduplicates, prioritises, and posts a single summary to PRs and a daily summary to Slack. Does not auto-fix.

## Tools it orchestrates

| Tool | What it catches | When it runs |
|---|---|---|
| **Semgrep** | Source-level patterns: SQL injection, XSS, hardcoded secrets, dangerous APIs | On every PR + nightly |
| **Snyk** | Vulnerable dependencies (CVE matching) | On every PR + nightly |
| **Socket** | Supply-chain risk: typosquats, malicious package behaviour, install scripts | On every PR (gates merge if critical) |
| **Gitleaks** | Secrets in git history | On every push |
| **Cloudflare Access logs review** | Anomalous access patterns | Nightly |

Configured in `.github/workflows/security.yml`.

## Triage rules

- **Critical** (CVSS >= 9.0, or any secret leak, or any Socket "malware" flag): blocks merge, pages on-call via Slack.
- **High** (CVSS 7.0-8.9): blocks merge, comments on PR, no page.
- **Medium** (CVSS 4.0-6.9): comments on PR, does not block. Auto-creates a Linear issue tagged `security` if not already present.
- **Low / informational:** logged in `docs/runbooks/security-log.md`, no PR comment.

## Allowlist

Known false positives or accepted risks live in `.security/allowlist.yml` with required fields: `id`, `tool`, `reason`, `accepted_by`, `accepted_at`, `review_by`. Entries expire after 90 days unless renewed.

## What it does NOT do

- Auto-bump dependencies. Dependabot does that on its own schedule and PRs go through the normal review path.
- Modify code.
- Decide acceptable risk. A human accepts risk by adding to the allowlist with their name.

## Escalation

Critical finding -> `#relia-security` Slack channel + page the security on-call rota. Runbook: `docs/runbooks/security-incident.md`.
