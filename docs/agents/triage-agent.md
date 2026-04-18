# Triage Agent

## Purpose

Enriches new Linear issues and untriaged GitHub issues with labels, priority hints, and routing suggestions. Posts a comment with its reasoning. Does not assign or change priority itself.

## Trigger

Linear webhook -> `/api/webhooks/linear` -> queue -> agent run.
GitHub webhook -> handled in repo, agent runs on `issues.opened`.

## What it does

1. Reads issue title and description.
2. Suggests labels from the existing label set (does not invent new ones).
3. Suggests a team (`platform`, `frontend`, `data`, `infra`) based on which paths the issue touches.
4. Detects duplicates by semantic search against open issues; flags suspected duplicates.
5. If issue mentions an outage, error, or "production" + "broken", flags as potential incident and pings `#relia-oncall`.

## What it does NOT do

- Set priority. Humans own priority.
- Close issues.
- Assign issues to specific people.
- Invent new labels or teams.

## Configuration

Labels and team mappings: `docs/agents/triage-config.yml` (create when populating).
