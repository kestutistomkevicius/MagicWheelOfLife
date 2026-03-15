---
phase: 07-action-items-and-wheel-polish
plan: 01
subsystem: database, types, components
tags: [migration, typescript, stub, wave-0]
dependency_graph:
  requires: []
  provides:
    - completed_at and note columns on action_items
    - is_important column on categories
    - updated ActionItemRow and CategoryRow TypeScript types
    - DueSoonWidget component stub with exported types
    - WheelChart stub props (highlightedCategory, importantCategories)
  affects:
    - src/types/database.ts
    - src/components/WheelChart.tsx
    - src/hooks/useActionItems.ts
    - src/hooks/useCategories.ts
    - src/hooks/useWheel.ts
tech_stack:
  added: []
  patterns:
    - Wave-0 stub pattern: it.todo() stubs run as pending so verify commands pass immediately
    - Optional Insert fields for columns with server-side defaults (Omit + intersection type)
key_files:
  created:
    - supabase/migrations/20260315000003_polish.sql
    - src/components/DueSoonWidget.tsx
    - src/components/DueSoonWidget.test.tsx
  modified:
    - supabase/seed.sql
    - src/types/database.ts
    - src/components/WheelChart.tsx
decisions:
  - Insert types use Omit + optional intersection for new nullable/defaulted columns — preserves call-site compatibility without requiring callers to pass new fields
  - is_important excluded from Omit and re-added as optional boolean — DB has NOT NULL DEFAULT false so callers never need to supply it
  - completed_at and note excluded from Omit and re-added as optional — both are nullable and insertable but not required
metrics:
  duration: 166s
  completed_date: "2026-03-16"
  tasks_completed: 2
  files_created: 3
  files_modified: 3
---

# Phase 7 Plan 01: Wave-0 Foundation (DB Migration + Types + Stubs) Summary

Wave-0 DB migration adding completed_at/note to action_items and is_important to categories, with TypeScript type updates and DueSoonWidget/WheelChart stubs so all wave-2 plans compile without type errors.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | DB migration — completed_at, note, is_important columns | e9c62bf | supabase/migrations/20260315000003_polish.sql, supabase/seed.sql |
| 2 | TypeScript types + WheelChart stubs + DueSoonWidget stub + test stubs | 0e640d4 | src/types/database.ts, src/components/WheelChart.tsx, src/components/DueSoonWidget.tsx, src/components/DueSoonWidget.test.tsx |

## Verification Results

- `supabase db reset --local`: completed without SQL errors; all 3 migrations applied
- `npm test -- --run`: 17 test files, 132 tests passed, 9 todo (DueSoonWidget stubs pending — expected)
- `npm run build`: succeeded with no TypeScript errors

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Insert types broke build for CategoryRow and ActionItemRow**

- **Found during:** Task 2 verification (`npm run build`)
- **Issue:** Adding `is_important: boolean` (non-optional) to `CategoryRow` and `completed_at/note` to `ActionItemRow` caused `useCategories.ts`, `useWheel.ts`, and `useActionItems.ts` to fail TypeScript because their `.insert()` calls don't supply these new fields. The plan stated these should be optional in Insert.
- **Fix:** Changed Insert types from plain `Omit<Row, ...>` to `Omit<Row, ...| 'field'> & { field?: type }` so new columns are optional at call sites while still typed correctly.
- **Files modified:** src/types/database.ts
- **Commit:** 0e640d4 (included in Task 2 commit)

## Self-Check: PASSED

Files exist:
- supabase/migrations/20260315000003_polish.sql: FOUND
- src/types/database.ts: FOUND
- src/components/DueSoonWidget.tsx: FOUND
- src/components/DueSoonWidget.test.tsx: FOUND
- src/components/WheelChart.tsx: FOUND

Commits:
- e9c62bf: FOUND
- 0e640d4: FOUND
