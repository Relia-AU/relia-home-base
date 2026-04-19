-- Migration: add app-level columns to uat_tests that the intranet UI uses
-- (cycle, tester name text, req_ref text, linear_id text)
-- tested_by (UUID FK) remains for future proper auth wiring

ALTER TABLE public.uat_tests
  ADD COLUMN IF NOT EXISTS cycle      text,
  ADD COLUMN IF NOT EXISTS tester     text,
  ADD COLUMN IF NOT EXISTS req_ref    text,
  ADD COLUMN IF NOT EXISTS linear_id  text,
  ADD COLUMN IF NOT EXISTS date       text;
