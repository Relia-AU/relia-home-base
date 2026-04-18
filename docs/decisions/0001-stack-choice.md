# ADR 0001: Stack Choice

- **Status:** accepted
- **Date:** 2026-04-18
- **Decision-makers:** founder + AI scaffold

## Context

We need an internal staff dashboard for the Relia platform. Audience is internal-only, behind org SSO. Backend is Supabase (decided separately, ADR 0002). We need to choose a frontend framework, a host, and an edge layer.

## Options considered

| Option | Pros | Cons |
|---|---|---|
| **Next.js 15 on Cloudflare Pages** | Mature ecosystem, RSC for server-side Supabase queries, first-class Supabase SSR helpers, Cloudflare adapter is stable, deep AI tooling support | Adapter has occasional rough edges; some Node APIs unavailable on workers runtime |
| **SvelteKit on Cloudflare Pages** | Lighter, very good DX, native Cloudflare adapter | Smaller component ecosystem; less AI agent training data; team already knows React |
| **Astro + React islands** | Fast static-first, good for content-heavy | Wrong shape for an interactive dashboard with real-time bits |
| **Plain Vite + React SPA** | Simple, no SSR complexity | No server components means more client-side Supabase calls and a larger JS bundle, worse for the dashboard use case |

## Decision

**Next.js 15 (App Router) on Cloudflare Pages, with Workers for edge logic and Cloudflare Access at the perimeter.**

## Why

- Server components let us hit Supabase from the server with the user's JWT, keeping RLS in play and shrinking the client bundle.
- Cloudflare Pages + Workers + Access is a coherent zero-trust posture for an internal-only app: one vendor, one bill, edge-fast, SSO-gated by default.
- Mixed-agent audience (Claude / GPT / Copilot) means we want the framework with the deepest training data and example footprint. That's Next.js + React.
- Cloudflare Access removes a whole class of "we forgot to add an auth check" mistakes by gating the entire surface at the edge.

## Consequences

- We accept some adapter friction with Next.js on Cloudflare. Mitigation: keep Node-specific dependencies out of the request path; push them to scheduled Workers.
- We accept lock-in to Cloudflare for Access + Pages. Acceptable: switching cost is bounded and Cloudflare's edge offering is differentiated for our use case.
- We commit to RSC patterns. The team must learn them; agents must respect the client/server split (see `docs/skills/component-conventions.md` once written).

## Revisit if

- Cloudflare Pages support for Next.js regresses meaningfully.
- We need a feature only Vercel-hosted Next can do (e.g., specific image optimisation modes).
- The team grows and React fatigue becomes a real cost.
