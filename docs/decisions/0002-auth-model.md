# ADR 0002: Auth Model

- **Status:** accepted
- **Date:** 2026-04-18

## Context

We need to decide where authentication and authorisation live. Options range from "Cloudflare Access alone" to "Supabase Auth alone" to "both".

## Decision

**Two layers, both required.**

1. **Cloudflare Access** at the perimeter. Org SSO. Strangers cannot reach any URL on the site, including assets and API routes, without passing Access first.
2. **Supabase Auth** inside the app. Provides the user identity that RLS policies key off (`auth.uid()`).

The user signs in to the org via Access, then a separate sign-in (or auto-provisioning) creates their Supabase user on first visit. Email is the link between the two.

## Why two layers

- **Defence in depth.** A misconfigured Next.js route or a leaked URL can't expose data because Access blocks unauthenticated requests at the edge.
- **RLS needs a real user identity.** Cloudflare Access tells us "someone in the org is here"; Supabase Auth tells us "this specific person is here," which is what RLS policies need.
- **Audit trails on both sides.** Access logs show who hit the site; Supabase logs show who touched what data.

## Why not Access alone

Access can pass identity to the origin via JWT (`Cf-Access-Jwt-Assertion`), but using Access identity directly in Postgres RLS would bind us to Cloudflare for query-time auth, which is brittle. Better to mint Supabase JWTs from the Access identity on first visit.

## Why not Supabase Auth alone

It would expose the entire app surface to the public internet, relying on every route being properly gated in code. One missed `requireAuth()` becomes a leak.

## Consequences

- First-visit flow: Access -> our app -> we read `Cf-Access-Jwt-Assertion`, look up or create the Supabase user, set the Supabase session cookie. Implementation in `src/lib/auth/bridge.ts` (to be written).
- Local dev cannot use Access. Local dev uses Supabase Auth only, with a `LOCAL_DEV=1` flag that bypasses the Access check. The flag is rejected in production builds via a build-time assertion.
- Service-role Supabase key is only used server-side and only in code paths that have already verified the user.
