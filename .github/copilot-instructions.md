# GitHub Copilot Instructions

The canonical context for this repo lives in `/CLAUDE.md`. All architectural rules, stack choices, and agent contracts are defined there.

Critical constraints Copilot must respect:

1. **Secrets:** Never inline secrets, API keys, or tokens. Reference `process.env.*` only.
2. **Supabase access:** Browser code uses `@/lib/supabase/client` (anon key, RLS-enforced). Server code uses `@/lib/supabase/server`. Service-role key (`@/lib/supabase/admin`) is restricted to API routes that have already verified the caller.
3. **Database changes:** Suggest a new file in `supabase/migrations/` named `YYYYMMDDHHMMSS_description.sql`. Never modify existing migration files.
4. **Decisions:** When the user is choosing between approaches, suggest creating an ADR in `docs/decisions/` rather than just picking one.
5. **TypeScript:** Strict mode is on. No `any` without a justifying comment.
6. **Linear refs:** Branch names and PR titles include the Linear issue ID (e.g. `REL-123`).

For Copilot Chat, attach `#file:CLAUDE.md` and any relevant `docs/decisions/*.md` for non-trivial questions.
