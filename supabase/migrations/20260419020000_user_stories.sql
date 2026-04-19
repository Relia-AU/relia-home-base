-- Migration: 0005_user_stories
-- User stories table + link requirements to stories + add developer/platform to requirements

CREATE TYPE story_persona  AS ENUM ('tradie', 'end_customer', 'relia_team', 'admin');
CREATE TYPE story_status   AS ENUM ('draft', 'ready', 'in_progress', 'done', 'deferred');
CREATE TYPE req_platform   AS ENUM ('ios', 'android', 'web', 'backend', 'all');

CREATE TABLE public.user_stories (
  id                  uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  ref                 text         NOT NULL UNIQUE,  -- e.g. US-001
  persona             story_persona NOT NULL DEFAULT 'tradie',
  i_want_to           text         NOT NULL,
  so_that             text         NOT NULL,
  acceptance_criteria text,
  status              story_status NOT NULL DEFAULT 'draft',
  platform            req_platform NOT NULL DEFAULT 'all',
  developer           text,
  linear_ids          jsonb        NOT NULL DEFAULT '[]',  -- array of Linear identifiers
  notes               text,
  created_by          uuid         REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at          timestamptz  NOT NULL DEFAULT now(),
  updated_at          timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX user_stories_status_idx   ON public.user_stories(status);
CREATE INDEX user_stories_persona_idx  ON public.user_stories(persona);
CREATE INDEX user_stories_platform_idx ON public.user_stories(platform);

ALTER TABLE public.user_stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read stories"  ON public.user_stories FOR SELECT USING (true);
CREATE POLICY "staff write stories" ON public.user_stories FOR ALL    USING (true);

CREATE TRIGGER audit_user_stories
  AFTER INSERT OR UPDATE OR DELETE ON public.user_stories
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

CREATE TRIGGER set_updated_at_user_stories
  BEFORE UPDATE ON public.user_stories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Link requirements to user stories
ALTER TABLE public.requirements
  ADD COLUMN IF NOT EXISTS user_story_id uuid REFERENCES public.user_stories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS developer     text,
  ADD COLUMN IF NOT EXISTS platform      req_platform NOT NULL DEFAULT 'all';

CREATE INDEX req_story_idx    ON public.requirements(user_story_id);
CREATE INDEX req_platform_idx ON public.requirements(platform);
