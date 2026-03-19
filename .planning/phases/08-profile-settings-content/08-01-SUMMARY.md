---
phase: 08-profile-settings-content
plan: "01"
subsystem: database
tags: [migration, types, seed, storage, avatar, feature-requests]
dependency_graph:
  requires: [07-action-items-and-wheel-polish]
  provides: [avatar_url column, feature_requests table, avatars storage bucket, FeatureRequestRow type, second wheel seed]
  affects: [08-02, 08-03, 08-04, 08-05, 08-06, 08-07, 08-08]
tech_stack:
  added: []
  patterns: [storage RLS with foldername isolation, INSERT-only table without SELECT policy]
key_files:
  created:
    - supabase/migrations/20260318000001_profile_avatar_feature_requests.sql
  modified:
    - src/types/database.ts
    - supabase/seed.sql
decisions:
  - "feature_requests has INSERT-only RLS — no SELECT policy for users; founder reads via Studio/service role only"
  - "avatars storage bucket is public-read, owner-write enforced via foldername(name)[1] = auth.uid()::text"
  - "Second wheel seed uses deterministic UUIDs (000...0010, 0031-0033, 0041-0043) for cross-phase references"
metrics:
  duration: "373s"
  completed_date: "2026-03-19"
  tasks_completed: 2
  files_changed: 3
---

# Phase 8 Plan 01: Foundation Migration and Types Summary

DB schema foundation, storage bucket, TypeScript types, and premium user seed data for all Phase 8 feature plans.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Migration — avatar_url, feature_requests, avatars bucket | a0f8056 | supabase/migrations/20260318000001_profile_avatar_feature_requests.sql |
| 2 | TypeScript types + premium seed second wheel | 9a81da1 | src/types/database.ts, supabase/seed.sql |

## What Was Built

**Migration (20260318000001_profile_avatar_feature_requests.sql):**
- `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text` — enables avatar upload/display in Phase 8
- `CREATE TABLE public.feature_requests` — user feedback table with RLS INSERT-only policy, no SELECT for row owners (founder reads via Studio)
- `INSERT INTO storage.buckets (avatars)` — public bucket for avatar images
- Storage RLS: public read, authenticated insert/update restricted to own folder via `foldername(name)[1] = auth.uid()::text`

**TypeScript types (database.ts):**
- `ProfileRow.avatar_url: string | null` added
- `FeatureRequestRow` type exported
- `Database.public.Tables.feature_requests` with Insert/Update: never types

**Seed data (seed.sql):**
- New DO block adds "Work & Purpose" wheel (UUID 000...0010) for premium user
- 3 deterministic categories: Career (0041), Finance (0042), Purpose (0043)
- 3 snapshots at 3/2/1 months ago with improving scores: Career 5→6→7, Finance 4→5→6, Purpose 6→7→8
- Enables CONTENT-05 wheel selector on TrendPage in Phase 8

## Verification Results

- `supabase db reset` completed cleanly (both runs)
- `SELECT count(*) FROM snapshots WHERE wheel_id = '00000000-0000-0000-0000-000000000010'` returns 3
- `avatar_url` column present in profiles table
- `feature_requests` table exists and accessible
- `npm run build` passes (no TypeScript errors, chunk size warnings pre-existing)
- `npm test` passes: 213 tests, 18 test files, 0 failures

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- supabase/migrations/20260318000001_profile_avatar_feature_requests.sql — FOUND (commit a0f8056)
- src/types/database.ts — modified (commit 9a81da1)
- supabase/seed.sql — modified (commit 9a81da1)
- Snapshot count verification: 3 rows confirmed via db query
- TypeScript build: clean
