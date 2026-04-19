-- Seed UAT tests from the previous hardcoded UAT_SEED array.
-- Uses INSERT ... ON CONFLICT (ref) DO NOTHING so re-running is safe.

INSERT INTO public.uat_tests (ref, cycle, req_ref, linear_id, platform, version, tester, date, status, notes, title)
VALUES
  -- Cycle 1 — Setup & Mockup to Working (completed Apr 12-17)
  ('UAT-001','Cycle 1','FR-001','REL-5',  'ios','v0.8','jon',  '17 Apr','passed', 'iOS Speech Framework integrated via speech_to_text package',         'iOS Speech Framework integrates and returns transcript'),
  ('UAT-002','Cycle 1','FR-002','REL-6',  'ios','v0.8','jon',  '17 Apr','passed', 'Real-time words appear as user speaks',                              'Real-time transcription streams words during recording'),
  ('UAT-003','Cycle 1','FR-003','REL-8',  'ios','v0.8','jon',  '17 Apr','passed', 'User can tap any word to correct it',                                'Transcript is editable after recording stops'),
  ('UAT-004','Cycle 1','FR-004','REL-9',  'ios','v0.8','jon',  '17 Apr','passed', 'Permission dialog shown; denied state handled gracefully',           'Mic permission requested on first use; error shown if denied'),
  ('UAT-005','Cycle 1','FR-005','REL-88', 'ios','v0.8','jon',  '17 Apr','passed', 'Native iOS AI used instead of Deepgram — no network needed',         'Voice-to-text works using native iOS AI (offline capable)'),
  ('UAT-006','Cycle 1','FR-006','REL-99', 'ios','v0.8','jon',  '17 Apr','passed', 'GPT-4.1 extracts materials correctly for plumbing job',              'AI extracts material list from plumbing job description'),
  ('UAT-007','Cycle 1','FR-006','REL-99', 'ios','v0.8','jon',  '17 Apr','passed', 'Electrical job (downlights) extracted correctly',                    'AI extracts material list from electrical job description'),
  ('UAT-008','Cycle 1','FR-008','REL-78', 'ios','v0.8','jon',  '17 Apr','passed', 'Low-confidence items show yellow indicator',                         'Low-confidence materials flagged with confidence score indicator'),
  ('UAT-009','Cycle 1','FR-009','REL-106','ios','v0.8','jon',  '17 Apr','passed', 'Correction events saved to Supabase for model improvement',          'User corrections captured as correction_events in DB'),
  ('UAT-010','Cycle 1','FR-010','REL-105','ios','v0.8','jon',  '17 Apr','passed', 'Full flow works end-to-end in single session',                       'Full flow: voice → transcript → materials → cost → PDF → saved'),
  ('UAT-011','Cycle 1','FR-011','REL-109','ios','v0.8','jon',  '17 Apr','passed', 'Price field editable inline; saved correctly',                       'Unpriced materials can have price entered manually'),
  ('UAT-012','Cycle 1','FR-013','REL-103','ios','v0.8','jon',  '17 Apr','passed', 'Labour screen appears before cost summary as intended',              'Labour capture step appears before Cost Summary screen'),
  ('UAT-013','Cycle 1','FR-014','REL-69', 'ios','v0.8','jon',  '17 Apr','passed', 'GST added correctly; non-GST option available in settings',          'GST calculated correctly for GST-registered tradie'),
  ('UAT-014','Cycle 1','FR-014','REL-69', 'ios','v0.8','jon',  '17 Apr','passed', 'No GST line shown when non-registered selected',                     'GST not applied when tradie marks themselves as non-registered'),
  ('UAT-015','Cycle 1','FR-015','REL-67', 'ios','v0.8','jon',  '17 Apr','passed', 'PDF labelled correctly based on selection',                          'Document type selector switches between Quote and Estimate on PDF'),
  ('UAT-016','Cycle 1','FR-016','REL-114','ios','v0.8','jon',  '17 Apr','passed', 'PDF matches preview layout; all line items present',                 'PDF generates with all line items, labour, GST, and total'),
  ('UAT-017','Cycle 1','FR-017','REL-65', 'ios','v0.8','jon',  '17 Apr','passed', 'Estimates persist after app restart; loaded from Supabase',          'Home screen lists all saved estimates from Supabase'),
  ('UAT-018','Cycle 1','FR-018','REL-107','ios','v0.8','jon',  '17 Apr','passed', 'PDF preview opens from home screen estimate row',                    'Tapping a saved estimate opens PDF preview mode'),
  ('UAT-019','Cycle 1','FR-019','REL-81', 'ios','v0.8','nhung','17 Apr','passed', 'Business name, ABN, trade, contact all saved correctly',             'Tradie can complete onboarding: trade + business details'),
  ('UAT-020','Cycle 1','FR-021','REL-108','ios','v0.8','jon',  '17 Apr','passed', 'Trades updated in Settings; reflected in new estimates',             'Tradie can edit trade types from Settings screen'),
  ('UAT-021','Cycle 1','FR-022','REL-63', 'ios','v0.8','jon',  '17 Apr','passed', 'Apple Sign-In flow completes; Supabase session created',             'Apple Sign-In authenticates and creates Supabase session'),
  -- Cycle 2 — App Store Submission (active Apr 19 - May 1)
  ('UAT-022','Cycle 2','FR-045','REL-119','web','v0.9','nhung','',      'ready',  'Waitlist form and hero copy to be verified',                         'Landing page hero, waitlist form, and CTA render correctly'),
  ('UAT-023','Cycle 2','FR-044','REL-44', 'web','v0.9','nhung','',      'ready',  'Submission should appear in Supabase waitlist table',                'Waitlist form submission saves email to Supabase'),
  ('UAT-024','Cycle 2','FR-023','REL-86', 'ios','v0.9','jon',  '',      'draft',  'Must be available before App Store submission',                      'Account deletion flow available in Settings and completes successfully'),
  ('UAT-025','Cycle 2','FR-041','REL-77', 'web','v0.9','nhung','',      'ready',  'Legal team to approve copy before going live',                       'Privacy policy page is live and legally reviewed'),
  ('UAT-026','Cycle 2','FR-042','REL-34', 'web','v0.9','nhung','',      'ready',  'URL must match what is submitted in App Store listing',              'Privacy policy URL accessible at reliaplatform.io/privacy'),
  ('UAT-027','Cycle 2','FR-043','REL-35', 'web','v0.9','nhung','',      'ready',  'URL must match what is submitted in App Store listing',              'Terms of service URL accessible at reliaplatform.io/terms'),
  ('UAT-028','Cycle 2','FR-027','REL-115','ios','v0.9','jon',  '',      'draft',  'Share token generated; web page renders quote details',              'Share token generated; customer web page renders quote correctly'),
  ('UAT-029','Cycle 2','FR-028','REL-116','web','v0.9','jon',  '',      'draft',  'Accept triggers tradie email notification',                          'Customer can accept or decline quote on web page; tradie notified'),
  ('UAT-030','Cycle 2','FR-030','REL-113','ios','v0.9','jon',  '',      'draft',  'Location captured silently during estimation flow',                  'Location captured and stored with each estimate'),
  ('UAT-031','Cycle 2','FR-034','REL-50', 'ios','v0.9','nhung','',      'draft',  'PostHog events firing for key actions',                              'PostHog analytics events fire for voice start, quote sent, accepted'),
  ('UAT-032','Cycle 2','FR-037','REL-31', 'ios','v0.9','nhung','',      'ready',  'D-U-N-S number required for company enrollment',                     'Apple Developer account enrolled as company with D-U-N-S'),
  ('UAT-033','Cycle 2','NFR-006','REL-41','ios','v0.9','nhung','',      'draft',  'Check all App Review guidelines before submission',                  'App Review compliance checklist completed — no violations')
ON CONFLICT (ref) DO NOTHING;
