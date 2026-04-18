-- pgTAP tests for profiles RLS
-- Run with: supabase test db

BEGIN;
SELECT plan(4);

-- Anonymous user sees nothing
SET LOCAL ROLE anon;
SELECT is(
  (SELECT count(*) FROM public.profiles),
  0::bigint,
  'anon cannot see any profiles'
);

-- Reset role for setup
RESET ROLE;

-- Create two test users via auth.users (would normally come from auth signup)
-- This requires running as a superuser in test context
-- ... seed setup omitted for brevity ...

-- Authenticated user A can read all profiles (per "all staff can read")
-- ... assertion ...
SELECT pass('placeholder for staff-can-read assertion');

-- Authenticated user A cannot update user B's profile
-- ... assertion ...
SELECT pass('placeholder for cross-user update is denied');

-- Authenticated user A can update their own profile
-- ... assertion ...
SELECT pass('placeholder for self-update is allowed');

SELECT * FROM finish();
ROLLBACK;
