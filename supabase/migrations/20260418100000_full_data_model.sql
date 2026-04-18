-- Migration: 0002_full_data_model
-- Entities: audit_log, crm (organisations, contacts, interactions, deals),
--            linear_issues, requirements, uat_tests, wiki, policies,
--            changelog, research, notes

-- ─────────────────────────────────────────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TYPE contact_type      AS ENUM ('tradie', 'end_customer', 'prospect', 'other');
CREATE TYPE trade_type        AS ENUM ('electrician', 'plumber', 'carpenter', 'tiler', 'builder', 'painter', 'landscaper', 'hvac', 'other');
CREATE TYPE contact_status    AS ENUM ('active', 'inactive', 'churned', 'prospect');
CREATE TYPE org_type          AS ENUM ('tradie_business', 'end_customer_company', 'other');
CREATE TYPE interaction_type  AS ENUM ('call', 'email', 'meeting', 'demo', 'support', 'note');
CREATE TYPE deal_stage        AS ENUM ('prospect', 'qualified', 'demo', 'trial', 'closed_won', 'closed_lost');
CREATE TYPE req_type          AS ENUM ('functional', 'non_functional');
CREATE TYPE req_priority      AS ENUM ('must_have', 'should_have', 'could_have', 'wont_have');
CREATE TYPE req_status        AS ENUM ('draft', 'approved', 'implemented', 'deprecated');
CREATE TYPE uat_status        AS ENUM ('draft', 'ready', 'in_progress', 'passed', 'failed', 'blocked');
CREATE TYPE policy_status     AS ENUM ('draft', 'active', 'deprecated');
CREATE TYPE note_type         AS ENUM ('standup', 'decision', 'planning', 'retro', 'other');
CREATE TYPE audit_action      AS ENUM ('insert', 'update', 'delete');
CREATE TYPE staff_role        AS ENUM ('admin', 'staff', 'viewer');

-- ─────────────────────────────────────────────────────────────────────────────
-- EXTEND PROFILES
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name   text,
  ADD COLUMN IF NOT EXISTS role        staff_role NOT NULL DEFAULT 'staff',
  ADD COLUMN IF NOT EXISTS avatar_url  text,
  ADD COLUMN IF NOT EXISTS title       text;

-- ─────────────────────────────────────────────────────────────────────────────
-- AUDIT LOG  (universal — covers every table)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.audit_log (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name   text        NOT NULL,
  record_id    uuid        NOT NULL,
  action       audit_action NOT NULL,
  old_data     jsonb,
  new_data     jsonb,
  changed_by   uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  changed_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_log_record_idx    ON public.audit_log(table_name, record_id);
CREATE INDEX audit_log_changed_by_idx ON public.audit_log(changed_by);
CREATE INDEX audit_log_changed_at_idx ON public.audit_log(changed_at DESC);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read audit log" ON public.audit_log FOR SELECT USING (auth.uid() IS NOT NULL);

-- Generic trigger function — attach to any table
CREATE OR REPLACE FUNCTION public.audit_trigger_fn()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log(table_name, record_id, action, new_data, changed_by)
    VALUES (TG_TABLE_NAME, (NEW.id)::uuid, 'insert', to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log(table_name, record_id, action, old_data, new_data, changed_by)
    VALUES (TG_TABLE_NAME, (NEW.id)::uuid, 'update', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log(table_name, record_id, action, old_data, changed_by)
    VALUES (TG_TABLE_NAME, (OLD.id)::uuid, 'delete', to_jsonb(OLD), auth.uid());
    RETURN OLD;
  END IF;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- CRM — ORGANISATIONS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.organisations (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text        NOT NULL,
  type           org_type    NOT NULL DEFAULT 'other',
  abn            text,
  website        text,
  phone          text,
  email          text,
  address_line1  text,
  address_line2  text,
  city           text,
  state          text,
  postcode       text,
  country        text        NOT NULL DEFAULT 'AU',
  notes          text,
  created_by     uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX org_type_idx ON public.organisations(type);
CREATE INDEX org_name_idx ON public.organisations(name);

ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read orgs"   ON public.organisations FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "staff write orgs"  ON public.organisations FOR ALL    USING (auth.uid() IS NOT NULL);

CREATE TRIGGER audit_organisations
  AFTER INSERT OR UPDATE OR DELETE ON public.organisations
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

-- ─────────────────────────────────────────────────────────────────────────────
-- CRM — CONTACTS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.contacts (
  id               uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id  uuid           REFERENCES public.organisations(id) ON DELETE SET NULL,
  first_name       text           NOT NULL,
  last_name        text,
  email            text,
  phone            text,
  type             contact_type   NOT NULL DEFAULT 'prospect',
  trade            trade_type,
  abn              text,
  city             text,
  state            text,
  postcode         text,
  country          text           NOT NULL DEFAULT 'AU',
  status           contact_status NOT NULL DEFAULT 'prospect',
  source           text,
  notes            text,
  created_by       uuid           REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at       timestamptz    NOT NULL DEFAULT now(),
  updated_at       timestamptz    NOT NULL DEFAULT now()
);

CREATE INDEX contacts_org_idx    ON public.contacts(organisation_id);
CREATE INDEX contacts_type_idx   ON public.contacts(type);
CREATE INDEX contacts_status_idx ON public.contacts(status);
CREATE INDEX contacts_trade_idx  ON public.contacts(trade);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read contacts"  ON public.contacts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "staff write contacts" ON public.contacts FOR ALL    USING (auth.uid() IS NOT NULL);

CREATE TRIGGER audit_contacts
  AFTER INSERT OR UPDATE OR DELETE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

-- ─────────────────────────────────────────────────────────────────────────────
-- CRM — INTERACTIONS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.interactions (
  id               uuid             PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id       uuid             NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  organisation_id  uuid             REFERENCES public.organisations(id) ON DELETE SET NULL,
  type             interaction_type NOT NULL DEFAULT 'note',
  subject          text             NOT NULL,
  body             text,
  outcome          text,
  occurred_at      timestamptz      NOT NULL DEFAULT now(),
  created_by       uuid             REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at       timestamptz      NOT NULL DEFAULT now(),
  updated_at       timestamptz      NOT NULL DEFAULT now()
);

CREATE INDEX interactions_contact_idx ON public.interactions(contact_id);
CREATE INDEX interactions_org_idx     ON public.interactions(organisation_id);
CREATE INDEX interactions_type_idx    ON public.interactions(type);

ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read interactions"  ON public.interactions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "staff write interactions" ON public.interactions FOR ALL    USING (auth.uid() IS NOT NULL);

CREATE TRIGGER audit_interactions
  AFTER INSERT OR UPDATE OR DELETE ON public.interactions
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

-- ─────────────────────────────────────────────────────────────────────────────
-- CRM — DEALS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.deals (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id           uuid        NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  organisation_id      uuid        REFERENCES public.organisations(id) ON DELETE SET NULL,
  title                text        NOT NULL,
  stage                deal_stage  NOT NULL DEFAULT 'prospect',
  value_aud            numeric(12,2),
  expected_close_date  date,
  notes                text,
  created_by           uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX deals_contact_idx ON public.deals(contact_id);
CREATE INDEX deals_stage_idx   ON public.deals(stage);

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read deals"  ON public.deals FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "staff write deals" ON public.deals FOR ALL    USING (auth.uid() IS NOT NULL);

CREATE TRIGGER audit_deals
  AFTER INSERT OR UPDATE OR DELETE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

-- ─────────────────────────────────────────────────────────────────────────────
-- LINEAR ISSUES  (synced cache)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.linear_issues (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  linear_id    text        NOT NULL UNIQUE,
  identifier   text        NOT NULL,
  title        text        NOT NULL,
  description  text,
  status       text        NOT NULL DEFAULT 'todo',
  priority     int         NOT NULL DEFAULT 0,
  assignee_id  uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  project      text,
  labels       jsonb       NOT NULL DEFAULT '[]',
  linear_url   text,
  synced_at    timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX linear_issues_status_idx   ON public.linear_issues(status);
CREATE INDEX linear_issues_priority_idx ON public.linear_issues(priority);
CREATE INDEX linear_issues_assignee_idx ON public.linear_issues(assignee_id);

ALTER TABLE public.linear_issues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read linear" ON public.linear_issues FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "staff write linear" ON public.linear_issues FOR ALL   USING (auth.uid() IS NOT NULL);

-- ─────────────────────────────────────────────────────────────────────────────
-- DEVELOPMENT — REQUIREMENTS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.requirements (
  id                   uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  ref                  text         NOT NULL UNIQUE,  -- e.g. FR-001, NFR-005
  type                 req_type     NOT NULL,
  category             text         NOT NULL,
  title                text         NOT NULL,
  description          text,
  priority             req_priority NOT NULL DEFAULT 'should_have',
  status               req_status   NOT NULL DEFAULT 'draft',
  source               text,
  acceptance_criteria  text,
  created_by           uuid         REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at           timestamptz  NOT NULL DEFAULT now(),
  updated_at           timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX req_type_idx     ON public.requirements(type);
CREATE INDEX req_status_idx   ON public.requirements(status);
CREATE INDEX req_priority_idx ON public.requirements(priority);

ALTER TABLE public.requirements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read reqs"  ON public.requirements FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "staff write reqs" ON public.requirements FOR ALL    USING (auth.uid() IS NOT NULL);

CREATE TRIGGER audit_requirements
  AFTER INSERT OR UPDATE OR DELETE ON public.requirements
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

-- ─────────────────────────────────────────────────────────────────────────────
-- DEVELOPMENT — UAT TESTS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.uat_tests (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id   uuid        REFERENCES public.requirements(id) ON DELETE SET NULL,
  ref              text        NOT NULL UNIQUE,  -- e.g. UAT-001
  title            text        NOT NULL,
  description      text,
  steps            jsonb       NOT NULL DEFAULT '[]',
  expected_result  text,
  actual_result    text,
  status           uat_status  NOT NULL DEFAULT 'draft',
  tested_by        uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  tested_at        timestamptz,
  notes            text,
  created_by       uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX uat_req_idx    ON public.uat_tests(requirement_id);
CREATE INDEX uat_status_idx ON public.uat_tests(status);

ALTER TABLE public.uat_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read uat"  ON public.uat_tests FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "staff write uat" ON public.uat_tests FOR ALL    USING (auth.uid() IS NOT NULL);

CREATE TRIGGER audit_uat_tests
  AFTER INSERT OR UPDATE OR DELETE ON public.uat_tests
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

-- ─────────────────────────────────────────────────────────────────────────────
-- WIKI
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.wiki_sections (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  ref         text        NOT NULL UNIQUE,  -- e.g. I, II, III
  title       text        NOT NULL,
  description text,
  sort_order  int         NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.wiki_pages (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id  uuid        NOT NULL REFERENCES public.wiki_sections(id) ON DELETE CASCADE,
  title       text        NOT NULL,
  content     text,
  sort_order  int         NOT NULL DEFAULT 0,
  created_by  uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX wiki_pages_section_idx ON public.wiki_pages(section_id);

ALTER TABLE public.wiki_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wiki_pages    ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read wiki sections"  ON public.wiki_sections FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "staff write wiki sections" ON public.wiki_sections FOR ALL    USING (auth.uid() IS NOT NULL);
CREATE POLICY "staff read wiki pages"     ON public.wiki_pages    FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "staff write wiki pages"    ON public.wiki_pages    FOR ALL    USING (auth.uid() IS NOT NULL);

CREATE TRIGGER audit_wiki_pages
  AFTER INSERT OR UPDATE OR DELETE ON public.wiki_pages
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

-- ─────────────────────────────────────────────────────────────────────────────
-- POLICIES
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.policy_docs (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  ref         text          NOT NULL UNIQUE,  -- e.g. I, II, III
  title       text          NOT NULL,
  description text,
  content     text,
  version     text          NOT NULL DEFAULT 'v1.0',
  status      policy_status NOT NULL DEFAULT 'draft',
  created_by  uuid          REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  timestamptz   NOT NULL DEFAULT now(),
  updated_at  timestamptz   NOT NULL DEFAULT now()
);

ALTER TABLE public.policy_docs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read policies"  ON public.policy_docs FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "staff write policies" ON public.policy_docs FOR ALL    USING (auth.uid() IS NOT NULL);

CREATE TRIGGER audit_policy_docs
  AFTER INSERT OR UPDATE OR DELETE ON public.policy_docs
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

-- ─────────────────────────────────────────────────────────────────────────────
-- CHANGELOG
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.changelog_entries (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  version     text        NOT NULL,
  title       text        NOT NULL,
  body        text,
  tags        jsonb       NOT NULL DEFAULT '[]',
  shipped_at  date        NOT NULL DEFAULT current_date,
  created_by  uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX changelog_shipped_idx ON public.changelog_entries(shipped_at DESC);

ALTER TABLE public.changelog_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read changelog"  ON public.changelog_entries FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "staff write changelog" ON public.changelog_entries FOR ALL    USING (auth.uid() IS NOT NULL);

CREATE TRIGGER audit_changelog
  AFTER INSERT OR UPDATE OR DELETE ON public.changelog_entries
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

-- ─────────────────────────────────────────────────────────────────────────────
-- RESEARCH INTERVIEWS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.research_interviews (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id       uuid        REFERENCES public.contacts(id) ON DELETE SET NULL,
  interviewee_name text        NOT NULL,
  trade            trade_type,
  location_city    text,
  location_state   text,
  interview_date   date        NOT NULL DEFAULT current_date,
  quotes           jsonb       NOT NULL DEFAULT '[]',
  nps_score        int         CHECK (nps_score BETWEEN 0 AND 10),
  notes            text,
  created_by       uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX research_contact_idx ON public.research_interviews(contact_id);
CREATE INDEX research_date_idx    ON public.research_interviews(interview_date DESC);

ALTER TABLE public.research_interviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read research"  ON public.research_interviews FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "staff write research" ON public.research_interviews FOR ALL    USING (auth.uid() IS NOT NULL);

CREATE TRIGGER audit_research
  AFTER INSERT OR UPDATE OR DELETE ON public.research_interviews
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

-- ─────────────────────────────────────────────────────────────────────────────
-- NOTES & DECISIONS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.notes (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text        NOT NULL,
  type        note_type   NOT NULL DEFAULT 'other',
  content     text,
  tags        jsonb       NOT NULL DEFAULT '[]',
  created_by  uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX notes_type_idx       ON public.notes(type);
CREATE INDEX notes_created_at_idx ON public.notes(created_at DESC);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read notes"  ON public.notes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "staff write notes" ON public.notes FOR ALL    USING (auth.uid() IS NOT NULL);

CREATE TRIGGER audit_notes
  AFTER INSERT OR UPDATE OR DELETE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

-- ─────────────────────────────────────────────────────────────────────────────
-- updated_at trigger (attach to all tables)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DO $$ DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'organisations','contacts','interactions','deals',
    'linear_issues','requirements','uat_tests',
    'wiki_sections','wiki_pages','policy_docs',
    'changelog_entries','research_interviews','notes'
  ]) LOOP
    EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t);
  END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- SEED DATA (wiki sections, policies)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.wiki_sections (ref, title, description, sort_order) VALUES
  ('I',   'How we write',   'The house style. Short wins. One exclamation, ever.', 1),
  ('II',  'The stack',      'Flutter, Next.js, Supabase, Cloudflare. Why each one.', 2),
  ('III', 'Runbooks',       'How to deploy, roll back, and not wake anyone up.', 3),
  ('IV',  'Brand system',   'Colours, type, the stamp, the voice.', 4),
  ('V',   'Security',       'Access, secrets, incident response.', 5),
  ('VI',  'Trade vocab',    'Sparky, chippy, plumber — what we know about each.', 6);

INSERT INTO public.policy_docs (ref, title, description, version, status) VALUES
  ('I',   'Terms of Service',       'How Relia and users agree to play.',      'v1.3', 'active'),
  ('II',  'Privacy Policy',         'What we collect and why.',                'v2.1', 'active'),
  ('III', 'Acceptable Use',         'What the platform isn''t for.',           'v1.0', 'active'),
  ('IV',  'Service Level Agreement','Uptime commitments and remedies.',        'v1.1', 'active');
