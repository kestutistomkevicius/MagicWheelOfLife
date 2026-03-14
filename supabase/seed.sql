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
    ON CONFLICT DO NOTHING;

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
