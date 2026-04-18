# Code Review Agent

## Purpose

Reviews every pull request against `main`. Posts a single top-level comment with structured feedback. Does not approve or merge.

## Trigger

GitHub Action: `.github/workflows/code-review.yml` on `pull_request` (opened, synchronize, reopened).

## What it checks

1. **Architectural fit:** does this change align with `CLAUDE.md` and any relevant ADR? If it introduces a new pattern, it should reference an ADR.
2. **RLS safety:** any new Supabase query reviewed for whether it relies on RLS or bypasses it. Service-role usage flagged for human attention.
3. **Migration hygiene:** new migrations are forward-only, reversible where reasonable, and have a corresponding RLS policy update if they add a table.
4. **Test coverage:** new server actions, API routes, and Workers have at least one test. Tests assert behaviour, not implementation.
5. **Linear linkage:** PR title or branch name references a Linear issue (`REL-\d+`). If missing, comment asks for it.
6. **Secret leakage:** scans diff for high-entropy strings, API key patterns, `.env` content.
7. **Type safety:** any new `any` is justified by a comment.

## What it does NOT do

- Approve PRs.
- Merge PRs.
- Push commits to the PR branch.
- Comment on individual lines (too noisy). One structured top-level comment.
- Comment on its own previous comments.

## Implementation note

Uses Claude API via `anthropics/claude-code-action` or equivalent. Reads `CLAUDE.md` and the diff. Posts via `gh pr comment`. Idempotent: edits its previous comment rather than spamming.

## When to disable

If the agent is wrong more than it's right for a given PR area, add the path to `.github/code-review-ignore.txt`. Review that file quarterly.
