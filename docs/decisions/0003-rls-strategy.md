# ADR 0003: RLS Strategy

- **Status:** accepted
- **Date:** 2026-04-18

## Context

Supabase enables row-level security but does not enforce that we use it. We need a project-wide rule.

## Decision

**RLS is enabled on every table in `public.*` schema. No exceptions.** Every table ships with at least one policy in the same migration that creates it. Tables without policies effectively deny all access, which is the safe default but wastes capacity; we want intentional policies.

Service-role key is allowed to bypass RLS, restricted to:
- Migrations.
- Scheduled jobs in `workers/`.
- Webhook handlers after signature verification.

It is **never** used in client-rendered code paths.

## Why

- A new table without RLS is the single highest-risk change in a Supabase app. Defaulting to "RLS on, policy required" makes the right thing the only path.
- Forcing the policy in the same migration as the table means no temporary "we'll add the policy later" window.

## Enforcement

- Code review agent flags any new `CREATE TABLE` in a migration that doesn't also have `ENABLE ROW LEVEL SECURITY` and at least one `CREATE POLICY` in the same file.
- pgTAP tests in `supabase/tests/` cover the standard RLS cases per table.
- Quarterly review of all policies, logged in `docs/runbooks/rls-review.md`.

## Consequences

- Slightly more friction per new table. Worth it.
- We need a small library of common policy patterns (see `docs/skills/rls-policies.md`).
- Tests-for-policies become standard, which is more work for whoever ships the schema change.
