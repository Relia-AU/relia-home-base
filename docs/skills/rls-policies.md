# Skill: Row Level Security Policies

## Mental model

RLS is the **only** thing standing between an authenticated user and someone else's data. Cloudflare Access keeps strangers out of the site; RLS keeps staff out of each other's lanes.

If RLS is wrong, the security agent will not catch it. Tests will not catch it unless you write them. Write them.

## Defaults

- Every table in `public.*` has RLS enabled. No exceptions.
- The default policy is **deny** (which is what you get from `ENABLE ROW LEVEL SECURITY` with no policies).
- Policies are additive: any matching policy grants access. There is no precedence.

## Patterns we use

### Pattern: user owns rows

```sql
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner can read"   ON public.notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "owner can insert" ON public.notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner can update" ON public.notes FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner can delete" ON public.notes FOR DELETE USING (auth.uid() = user_id);
```

### Pattern: team-scoped via membership table

```sql
CREATE POLICY "team members can read"
  ON public.team_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_documents.team_id
        AND tm.user_id = auth.uid()
    )
  );
```

Wrap the membership check in a `SECURITY DEFINER` function if you reuse it across many policies, to avoid recursive RLS evaluation:

```sql
CREATE OR REPLACE FUNCTION public.is_team_member(team uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = team AND user_id = auth.uid()
  );
$$;

CREATE POLICY "team members can read"
  ON public.team_documents FOR SELECT
  USING (public.is_team_member(team_id));
```

### Pattern: role-based (admins see all)

```sql
CREATE POLICY "admins read all"
  ON public.audit_log FOR SELECT
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
```

App metadata (not user metadata) is the safe place for roles, because users can self-edit user metadata.

## Testing RLS

Every RLS-protected table gets a test in `supabase/tests/<table>.test.sql` using pgTAP, run as part of `pnpm test:db`.

Minimum cases to test:
- An authenticated user can see their own row.
- An authenticated user **cannot** see another user's row.
- An anonymous user sees nothing.
- The service role bypasses RLS (sanity check, not a security claim).

## When to use the service role key

Almost never from app code. Allowed:
- Migrations.
- Server-side cron jobs in `workers/` that need to operate across all users (e.g. cleanup).
- Webhook handlers that have already verified the webhook signature and need to write records on a system's behalf.

Service-role key is read from `SUPABASE_SERVICE_ROLE_KEY`, only available in server runtime. The client (`@/lib/supabase/admin`) is in a file that imports `'server-only'` at the top.
