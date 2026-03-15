---
phase: 03-action-items
plan: "02"
subsystem: database
tags: [migration, rls, seed, action-items, postgresql]
dependency_graph:
  requires:
    - 03-01 (test stubs for action items — wave 0 scaffold)
    - 02-02 (wheel_schema migration — categories table must exist)
  provides:
    - action_items table in local PostgreSQL
    - RLS policies securing rows to their owner
    - Seed data for free and premium dev users
  affects:
    - All Phase 3 plans (03-03 to 03-06) — they build on this table
tech_stack:
  added: []
  patterns:
    - Denormalized user_id on action_items for RLS efficiency (no join through categories)
    - CREATE OR REPLACE FUNCTION for idempotent trigger function definition
    - Name-based category lookup in seed (categories have no deterministic UUIDs)
key_files:
  created:
    - supabase/migrations/20260315000001_action_items.sql
  modified:
    - supabase/seed.sql
decisions:
  - "action_items.user_id denormalized — RLS USING clause can reference user_id directly without joining categories → wheels"
  - "CREATE OR REPLACE FUNCTION set_updated_at() — idempotent if function added in a future migration for other tables"
  - "Phase 3 seed block uses name-based lookup (health_cat_id, career_cat_id, finance_cat_id) — category UUIDs not deterministic"
  - "NULL-guarded IF blocks in seed DO $$ block — prevents seed failure if category names change"
metrics:
  duration: "7 minutes"
  completed_date: "2026-03-15"
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
  files_modified: 1
---

# Phase 3 Plan 02: Action Items Migration and Seed Summary

action_items table created with RLS, ON DELETE CASCADE from categories, updated_at trigger, and seed data covering 6 rows for free user and 5 for premium user across open/complete/deadline scenarios.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create action_items migration | 29a2ccb | supabase/migrations/20260315000001_action_items.sql |
| 2 | Extend seed.sql with action item data | df1e5d7 | supabase/seed.sql |

## What Was Built

**Migration (`20260315000001_action_items.sql`):**
- `action_items` table with columns: id, category_id, user_id, text, is_complete, deadline, position, created_at, updated_at
- `category_id` FK references `categories(id)` ON DELETE CASCADE
- `user_id` FK references `auth.users(id)` ON DELETE CASCADE (denormalized for RLS)
- RLS enabled with 4 policies mirroring the categories table pattern from Phase 2
- `set_updated_at()` trigger function (CREATE OR REPLACE) + `action_items_updated_at` BEFORE UPDATE trigger

**Seed data (`seed.sql` Phase 3 block):**
- Free user: Health (Run 3x/week + Schedule checkup = open; Sleep before midnight = complete), Career (Finish course = open; Update LinkedIn = complete), Finance (Emergency fund = open) — 6 rows total
- Premium user: Health (Train for 5k = complete; Reduce caffeine + Monthly physio = open), Career (Give talk = open; Write blog = complete) — 5 rows total
- Mix of items with deadlines, without deadlines, open, and completed
- Name-based category lookup with NULL guards for robustness

## Verification

- `supabase db reset` exits code 0 with both migrations applied and seed seeded
- All 55 existing tests pass, 17 todo stubs unchanged, 2 Phase 3 stub files skipped (expected)

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- supabase/migrations/20260315000001_action_items.sql: EXISTS
- supabase/seed.sql Phase 3 block: EXISTS (appended after line 201)
- Commit 29a2ccb: migration file
- Commit df1e5d7: seed extension
