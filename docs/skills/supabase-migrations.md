# Skill: Supabase Migrations

## When to use

Any time the schema changes: new table, new column, new index, new policy, new function, new trigger.

## Hard rules

1. **Append-only.** Once a migration is on `main`, never edit it. Write a new one.
2. **Naming:** `supabase/migrations/YYYYMMDDHHMMSS_short_description.sql`. Use UTC.
3. **Forward-only is fine, but write a `-- DOWN:` comment block** describing how to manually reverse if you have to.
4. **Every new table needs an RLS policy in the same migration.** No exceptions. See `rls-policies.md`.
5. **No `DROP` of columns or tables in the same migration as a deploy.** Two-step: deploy code that doesn't use it, then drop in a follow-up.
6. **Indexes use `CREATE INDEX CONCURRENTLY`** in production-bound migrations to avoid locking.

## Workflow

```bash
# Create a new migration
supabase migration new add_user_preferences_table

# Edit the generated file
$EDITOR supabase/migrations/<timestamp>_add_user_preferences_table.sql

# Apply locally
supabase db reset    # blows away local DB and replays all migrations

# Generate updated TS types
supabase gen types typescript --local > src/lib/supabase/database.types.ts

# Commit migration + regenerated types together
```

## Template

```sql
-- Migration: add_user_preferences_table
-- Author: <your name or agent id>
-- Linear: REL-123

-- DOWN:
--   DROP TABLE IF EXISTS public.user_preferences;

CREATE TABLE public.user_preferences (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key          text NOT NULL,
  value        jsonb NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, key)
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users write own preferences"
  ON public.user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users update own preferences"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX user_preferences_user_id_idx ON public.user_preferences(user_id);
```

## Common mistakes the agent should avoid

- Creating a table without RLS enabled. The default is RLS-off, which is dangerous.
- Adding a column with `NOT NULL` and no default on a non-empty table (will fail).
- Using `serial` for IDs instead of `uuid`. Project standard is uuid.
- Forgetting to regenerate types after schema changes.
