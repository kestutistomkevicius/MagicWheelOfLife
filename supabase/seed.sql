-- supabase/seed.sql
-- Dev seed data for local development.
-- Run: supabase db reset (wipes DB and re-runs all migrations + this seed)
--
-- SEED USERS:
-- free@test.com / test123   → free-tier developer test account
-- premium@test.com / test123 → premium-tier developer test account
--
-- DETERMINISTIC UUIDs: Fixed UUIDs allow later phase seeds to reference these
-- user IDs directly without querying auth.users first.
--   free_user_id    = 00000000-0000-0000-0000-000000000001
--   premium_user_id = 00000000-0000-0000-0000-000000000002
--
-- NOTE: Wheel, category, action item, and snapshot data are seeded in later phases
-- when those tables exist (Phase 2+ migrations).

DO $$
DECLARE
  free_user_id uuid := '00000000-0000-0000-0000-000000000001';
  premium_user_id uuid := '00000000-0000-0000-0000-000000000002';
BEGIN

  -- ============================================================
  -- FREE-TIER USER: free@test.com / test123
  -- Persona: generic mid-career professional
  -- Wheel: default 8 categories (seeded in Phase 2)
  -- Scores: mid-range 4-7, some to-be higher than as-is
  --   Health:           as-is=5, to-be=8
  --   Career:           as-is=7, to-be=9
  --   Relationships:    as-is=6, to-be=7
  --   Finance:          as-is=4, to-be=7
  --   Fun & Rec:        as-is=5, to-be=8
  --   Personal Growth:  as-is=6, to-be=8
  --   Phys. Env:        as-is=7, to-be=7
  --   Family/Friends:   as-is=6, to-be=8
  -- Action items (Phase 3): mix of open, completed, and with deadlines
  -- ============================================================

  INSERT INTO auth.users (
    id, instance_id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, email_change,
    email_change_token_new, recovery_token
  ) VALUES (
    free_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'free@test.com',
    crypt('test123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"Free Tester"}'::jsonb,
    now() - interval '30 days', now(),
    '', '', '', ''
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (
    id, user_id, provider_id,
    identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    free_user_id,
    free_user_id::text,
    jsonb_build_object('sub', free_user_id::text, 'email', 'free@test.com'),
    'email',
    now(), now(), now()
  )
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- PREMIUM-TIER USER: premium@test.com / test123
  -- Persona: ambitious professional who has been tracking for a year
  -- Wheel: 8 categories with 4 snapshots (Phase 2/4)
  -- Snapshot dates: ~3 months apart (roughly quarterly reviews)
  --   Snapshot 1: ~12 months ago
  --   Snapshot 2: ~9 months ago
  --   Snapshot 3: ~6 months ago
  --   Snapshot 4: ~3 months ago (most recent)
  --
  -- Score story across 4 snapshots — mixed trajectory to test charts:
  --   Career:          5 → 6 → 7 → 8  (steadily improving — big focus area)
  --   Health:          6 → 5 → 6 → 7  (dip then recovery — burnout then gym)
  --   Relationships:   8 → 7 → 6 → 5  (declining — sacrificed for career)
  --   Finance:         4 → 4 → 5 → 6  (slowly improving — paid off debt)
  --   Fun & Rec:       7 → 6 → 5 → 4  (declining — traded for career gains)
  --   Personal Growth: 5 → 6 → 7 → 7  (improving then plateau)
  --   Phys. Env:       6 → 6 → 6 → 7  (stable then jump — moved apartment)
  --   Family/Friends:  7 → 6 → 5 → 5  (declining then stable)
  --
  -- Action items (Phase 3): some completed, some with past/future deadlines, some open
  -- ============================================================

  INSERT INTO auth.users (
    id, instance_id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, email_change,
    email_change_token_new, recovery_token
  ) VALUES (
    premium_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'premium@test.com',
    crypt('test123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"Premium Tester"}'::jsonb,
    now() - interval '365 days', now(),
    '', '', '', ''
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (
    id, user_id, provider_id,
    identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    premium_user_id,
    premium_user_id::text,
    jsonb_build_object('sub', premium_user_id::text, 'email', 'premium@test.com'),
    'email',
    now(), now(), now()
  )
  ON CONFLICT DO NOTHING;

END $$;

-- ============================================================
-- PHASE 2 SEED DATA: profiles, wheels, categories
-- ============================================================
-- The handle_new_user() trigger only fires on NEW auth.users inserts.
-- Seed users were inserted above, so profiles must be inserted manually.
--
-- Deterministic wheel UUIDs for cross-phase references:
--   free_wheel_id    = 00000000-0000-0000-0000-000000000011
--   premium_wheel_id = 00000000-0000-0000-0000-000000000012
-- ============================================================

DO $$
DECLARE
  free_user_id uuid := '00000000-0000-0000-0000-000000000001';
  premium_user_id uuid := '00000000-0000-0000-0000-000000000002';
  free_wheel_id uuid := '00000000-0000-0000-0000-000000000011';
  premium_wheel_id uuid := '00000000-0000-0000-0000-000000000012';
BEGIN

  -- profiles (tier set explicitly — trigger not fired for seed users)
  INSERT INTO public.profiles (id, tier)
    VALUES (free_user_id, 'free')
    ON CONFLICT DO NOTHING;

  INSERT INTO public.profiles (id, tier)
    VALUES (premium_user_id, 'premium')
    ON CONFLICT (id) DO UPDATE SET tier = EXCLUDED.tier;

  -- wheels
  INSERT INTO public.wheels (id, user_id, name)
    VALUES (free_wheel_id, free_user_id, 'My Wheel')
    ON CONFLICT DO NOTHING;

  INSERT INTO public.wheels (id, user_id, name)
    VALUES (premium_wheel_id, premium_user_id, 'My Wheel')
    ON CONFLICT DO NOTHING;

  -- categories for free user wheel
  -- Health(5,8), Career(7,9), Relationships(6,7), Finance(4,7),
  -- Fun & Recreation(5,8), Personal Growth(6,8), Physical Environment(7,7), Family & Friends(6,8)
  INSERT INTO public.categories (wheel_id, user_id, name, position, score_asis, score_tobe)
    VALUES
      (free_wheel_id, free_user_id, 'Health',               0, 5, 8),
      (free_wheel_id, free_user_id, 'Career',               1, 7, 9),
      (free_wheel_id, free_user_id, 'Relationships',        2, 6, 7),
      (free_wheel_id, free_user_id, 'Finance',              3, 4, 7),
      (free_wheel_id, free_user_id, 'Fun & Recreation',     4, 5, 8),
      (free_wheel_id, free_user_id, 'Personal Growth',      5, 6, 8),
      (free_wheel_id, free_user_id, 'Physical Environment', 6, 7, 7),
      (free_wheel_id, free_user_id, 'Family & Friends',     7, 6, 8)
    ON CONFLICT DO NOTHING;

  -- categories for premium user wheel (current scores — snapshot history seeded in Phase 4)
  -- Health(7,8), Career(8,9), Relationships(5,7), Finance(6,8),
  -- Fun & Recreation(4,7), Personal Growth(7,9), Physical Environment(7,7), Family & Friends(5,7)
  INSERT INTO public.categories (wheel_id, user_id, name, position, score_asis, score_tobe)
    VALUES
      (premium_wheel_id, premium_user_id, 'Health',               0, 7, 8),
      (premium_wheel_id, premium_user_id, 'Career',               1, 8, 9),
      (premium_wheel_id, premium_user_id, 'Relationships',        2, 5, 7),
      (premium_wheel_id, premium_user_id, 'Finance',              3, 6, 8),
      (premium_wheel_id, premium_user_id, 'Fun & Recreation',     4, 4, 7),
      (premium_wheel_id, premium_user_id, 'Personal Growth',      5, 7, 9),
      (premium_wheel_id, premium_user_id, 'Physical Environment', 6, 7, 7),
      (premium_wheel_id, premium_user_id, 'Family & Friends',     7, 5, 7)
    ON CONFLICT DO NOTHING;

END $$;

-- ============================================================
-- PHASE 3 SEED: Action Items
-- Uses name-based category lookup because Phase 2 categories
-- were inserted with gen_random_uuid() (no deterministic IDs).
-- FRAGILITY NOTE: if category names in seed change, update here.
-- ============================================================
DO $$
DECLARE
  free_user_id     uuid := '00000000-0000-0000-0000-000000000001';
  premium_user_id  uuid := '00000000-0000-0000-0000-000000000002';
  free_wheel_id    uuid;
  premium_wheel_id uuid;
  health_cat_id    uuid;
  career_cat_id    uuid;
  finance_cat_id   uuid;
  p_health_cat_id  uuid;
  p_career_cat_id  uuid;
BEGIN
  -- Look up wheel IDs for each user
  SELECT id INTO free_wheel_id    FROM public.wheels WHERE user_id = free_user_id    LIMIT 1;
  SELECT id INTO premium_wheel_id FROM public.wheels WHERE user_id = premium_user_id LIMIT 1;

  -- Look up category IDs for free user by name
  SELECT id INTO health_cat_id  FROM public.categories WHERE wheel_id = free_wheel_id AND name = 'Health'  LIMIT 1;
  SELECT id INTO career_cat_id  FROM public.categories WHERE wheel_id = free_wheel_id AND name = 'Career'  LIMIT 1;
  SELECT id INTO finance_cat_id FROM public.categories WHERE wheel_id = free_wheel_id AND name = 'Finance' LIMIT 1;

  -- Look up category IDs for premium user by name
  SELECT id INTO p_health_cat_id FROM public.categories WHERE wheel_id = premium_wheel_id AND name = 'Health' LIMIT 1;
  SELECT id INTO p_career_cat_id FROM public.categories WHERE wheel_id = premium_wheel_id AND name = 'Career' LIMIT 1;

  -- Free user action items: Health (mix of open, completed, with deadlines)
  IF health_cat_id IS NOT NULL THEN
    INSERT INTO public.action_items (category_id, user_id, text, is_complete, deadline, position)
    VALUES
      (health_cat_id, free_user_id, 'Run 3x per week',         false, '2026-04-30', 0),
      (health_cat_id, free_user_id, 'Sleep before midnight',   true,  null,         1),
      (health_cat_id, free_user_id, 'Schedule annual checkup', false, '2026-05-15', 2)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Free user action items: Career
  IF career_cat_id IS NOT NULL THEN
    INSERT INTO public.action_items (category_id, user_id, text, is_complete, deadline, position)
    VALUES
      (career_cat_id, free_user_id, 'Finish online course', false, '2026-06-01', 0),
      (career_cat_id, free_user_id, 'Update LinkedIn',       true,  null,         1)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Free user action items: Finance
  IF finance_cat_id IS NOT NULL THEN
    INSERT INTO public.action_items (category_id, user_id, text, is_complete, deadline, position)
    VALUES
      (finance_cat_id, free_user_id, 'Build 3-month emergency fund', false, '2026-12-31', 0)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Premium user action items: Health
  IF p_health_cat_id IS NOT NULL THEN
    INSERT INTO public.action_items (category_id, user_id, text, is_complete, deadline, position)
    VALUES
      (p_health_cat_id, premium_user_id, 'Train for 5k',       true,  null,         0),
      (p_health_cat_id, premium_user_id, 'Reduce caffeine',     false, '2026-04-01', 1),
      (p_health_cat_id, premium_user_id, 'Monthly physio appt', false, null,         2)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Premium user action items: Career
  IF p_career_cat_id IS NOT NULL THEN
    INSERT INTO public.action_items (category_id, user_id, text, is_complete, deadline, position)
    VALUES
      (p_career_cat_id, premium_user_id, 'Give talk at meetup',  false, '2026-09-01', 0),
      (p_career_cat_id, premium_user_id, 'Write technical blog',  true,  null,         1)
    ON CONFLICT DO NOTHING;
  END IF;

END $$;

-- =============================================================
-- Phase 4: Snapshots for premium user
-- 4 quarterly snapshots, backdated. Score story:
--   Career improves (5→6→7→8), Health dips then recovers (6→5→6→7),
--   Relationships decline (8→7→6→5), Finance grows (4→4→5→6)
-- Deterministic UUIDs 0101–0104 referenced by Phase 5 (Trend Chart)
-- =============================================================
DO $$
DECLARE
  premium_user_id  uuid := '00000000-0000-0000-0000-000000000002';
  premium_wheel_id uuid := '00000000-0000-0000-0000-000000000012';
  snap1_id uuid := '00000000-0000-0000-0000-000000000101';
  snap2_id uuid := '00000000-0000-0000-0000-000000000102';
  snap3_id uuid := '00000000-0000-0000-0000-000000000103';
  snap4_id uuid := '00000000-0000-0000-0000-000000000104';
BEGIN
  INSERT INTO public.snapshots (id, wheel_id, user_id, name, saved_at) VALUES
    (snap1_id, premium_wheel_id, premium_user_id, 'Q1 Annual Review',  now() - interval '12 months'),
    (snap2_id, premium_wheel_id, premium_user_id, 'Mid-Year Check-In', now() - interval '9 months'),
    (snap3_id, premium_wheel_id, premium_user_id, 'Q3 Progress',       now() - interval '6 months'),
    (snap4_id, premium_wheel_id, premium_user_id, 'Year End Review',   now() - interval '3 months')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.snapshot_scores (snapshot_id, user_id, category_name, position, score_asis, score_tobe) VALUES
    (snap1_id, premium_user_id, 'Health',               0, 6, 8),
    (snap1_id, premium_user_id, 'Career',               1, 5, 9),
    (snap1_id, premium_user_id, 'Relationships',        2, 8, 8),
    (snap1_id, premium_user_id, 'Finance',              3, 4, 8),
    (snap1_id, premium_user_id, 'Fun & Recreation',     4, 7, 7),
    (snap1_id, premium_user_id, 'Personal Growth',      5, 5, 9),
    (snap1_id, premium_user_id, 'Physical Environment', 6, 6, 7),
    (snap1_id, premium_user_id, 'Family & Friends',     7, 7, 7),
    (snap2_id, premium_user_id, 'Health',               0, 5, 8),
    (snap2_id, premium_user_id, 'Career',               1, 6, 9),
    (snap2_id, premium_user_id, 'Relationships',        2, 7, 8),
    (snap2_id, premium_user_id, 'Finance',              3, 4, 8),
    (snap2_id, premium_user_id, 'Fun & Recreation',     4, 6, 7),
    (snap2_id, premium_user_id, 'Personal Growth',      5, 6, 9),
    (snap2_id, premium_user_id, 'Physical Environment', 6, 6, 7),
    (snap2_id, premium_user_id, 'Family & Friends',     7, 6, 7),
    (snap3_id, premium_user_id, 'Health',               0, 6, 8),
    (snap3_id, premium_user_id, 'Career',               1, 7, 9),
    (snap3_id, premium_user_id, 'Relationships',        2, 6, 8),
    (snap3_id, premium_user_id, 'Finance',              3, 5, 8),
    (snap3_id, premium_user_id, 'Fun & Recreation',     4, 5, 7),
    (snap3_id, premium_user_id, 'Personal Growth',      5, 7, 9),
    (snap3_id, premium_user_id, 'Physical Environment', 6, 6, 7),
    (snap3_id, premium_user_id, 'Family & Friends',     7, 5, 7),
    (snap4_id, premium_user_id, 'Health',               0, 7, 8),
    (snap4_id, premium_user_id, 'Career',               1, 8, 9),
    (snap4_id, premium_user_id, 'Relationships',        2, 5, 7),
    (snap4_id, premium_user_id, 'Finance',              3, 6, 8),
    (snap4_id, premium_user_id, 'Fun & Recreation',     4, 4, 7),
    (snap4_id, premium_user_id, 'Personal Growth',      5, 7, 9),
    (snap4_id, premium_user_id, 'Physical Environment', 6, 7, 7),
    (snap4_id, premium_user_id, 'Family & Friends',     7, 5, 7)
  ON CONFLICT DO NOTHING;
END $$;
