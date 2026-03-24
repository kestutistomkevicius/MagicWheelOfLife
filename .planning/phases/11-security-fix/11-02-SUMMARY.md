---
phase: 11-security-fix
plan: "02"
subsystem: ui
tags: [react, hooks, supabase, edge-functions, testing, vitest]

# Dependency graph
requires:
  - phase: 11-security-fix
    plan: "01"
    provides: "set-tier Edge Function that accepts JWT and writes tier via service-role"
provides:
  - "useProfile.updateTier routes through set-tier Edge Function (not direct DB write)"
  - "useProfile.test.ts covers functions.invoke path with mockInvoke"
affects:
  - SettingsPage (uses updateTier from useProfile)
  - Any future premium gating that calls updateTier

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "supabase.functions.invoke for privileged writes (tier column)"
    - "TDD RED-GREEN with vi.hoisted mockInvoke for Edge Function testing"

key-files:
  created: []
  modified:
    - src/hooks/useProfile.ts
    - src/hooks/useProfile.test.ts

key-decisions:
  - "updateTier routes through set-tier Edge Function — direct DB write revoked at DB layer in Plan 01"
  - "Error propagation: functions.invoke error is re-thrown before setTier — state never updated on failure"
  - "mockInvoke added to vi.hoisted block alongside existing mocks — consistent pattern with rest of test suite"
  - "Two updateTier tests added: premium and free transitions — both assert functions.invoke call and state update"

patterns-established:
  - "Edge Function integration test pattern: mockInvoke in vi.hoisted, functions: { invoke: mockInvoke } in vi.mock factory"

requirements-completed: [SEC-01, SEC-03]

# Metrics
duration: 3min
completed: 2026-03-24
---

# Phase 11 Plan 02: Security Fix — useProfile Edge Function Refactor Summary

**useProfile.updateTier now routes through supabase.functions.invoke('set-tier') instead of direct DB write, completing the server-side tier enforcement chain**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-24T08:42:59Z
- **Completed:** 2026-03-24T08:45:22Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Replaced insecure direct `supabase.from('profiles').update({ tier })` with `supabase.functions.invoke('set-tier', { body: { tier } })`
- Error from Edge Function is now thrown before state update — tier state only changes on success
- Test suite updated: `mockInvoke` added to `vi.hoisted` block and `supabase.functions` mock; `updateTier` tests rewritten to assert `functions.invoke` path
- Added second `updateTier` test covering the `'free'` transition direction
- Full suite: 329 tests passed, 29 test files, 0 failures
- TypeScript compiles clean (`npx tsc --noEmit` exits 0)

## Task Commits

1. **Task 1: Refactor useProfile.updateTier + update test mock** - `f1e46ba` (refactor)
2. **Task 2: Full test suite green check** - (verification only, no files changed)

## Files Created/Modified

- `src/hooks/useProfile.ts` - `updateTier` now calls `supabase.functions.invoke('set-tier', { body: { tier } })`, throws on error before `setTier`
- `src/hooks/useProfile.test.ts` - `mockInvoke` added to `vi.hoisted`; `supabase.functions.invoke` mocked; `updateTier` tests rewritten to assert Edge Function path

## Decisions Made

- Error propagation: when `functions.invoke` returns `{ error }`, we throw before calling `setTier` — this is correct behavior: state should only update on confirmed success.
- `updateAvatar` and `updateColorScheme` remain on the direct `supabase.from('profiles').update(...)` path — Plan 01 granted UPDATE on `avatar_url` and `color_scheme` columns explicitly.

## Deviations from Plan

None — plan executed exactly as written. TDD flow confirmed RED (2 new tests failing, 9 passing) before GREEN (all 11 passing).

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Plan 03 (manual E2E verification of the full tier-write security chain) is ready to run.
- The set-tier Edge Function (Plan 01) + this hook refactor (Plan 02) form the complete application-layer security fix for DEC-006.
- SettingsPage tier toggle will route correctly through the Edge Function in the browser.

---
*Phase: 11-security-fix*
*Completed: 2026-03-24*
