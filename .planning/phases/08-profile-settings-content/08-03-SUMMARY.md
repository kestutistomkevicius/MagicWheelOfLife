---
phase: 08-profile-settings-content
plan: "03"
subsystem: profile
tags: [hook, avatar, storage, sidebar, tdd]
dependency_graph:
  requires:
    - 08-01 (profiles table + avatars storage bucket)
    - 08-02 (wave 0 test stubs)
  provides:
    - useProfile hook (tier, avatarUrl, updateAvatar, updateTier)
    - Sidebar avatar display
  affects:
    - src/components/Sidebar.tsx
    - src/hooks/useProfile.ts
tech_stack:
  added: []
  patterns:
    - vi.hoisted() for mock variables inside vi.mock() factory
    - act() wrapping for state-updating async hook mutations in tests
key_files:
  created:
    - src/hooks/useProfile.ts
    - src/hooks/useProfile.test.ts (replaced stub)
  modified:
    - src/components/Sidebar.tsx
    - src/components/Sidebar.test.tsx
decisions:
  - "act() wrapping required for updateAvatar/updateTier test assertions — state updates from async mutations outside useEffect need explicit act() in renderHook tests"
metrics:
  duration: 178s
  completed_date: "2026-03-19"
  tasks_completed: 2
  files_changed: 4
---

# Phase 08 Plan 03: useProfile Hook and Sidebar Avatar Summary

**One-liner:** useProfile hook fetches avatar_url + tier from Supabase profiles, uploads avatars to storage bucket with 2MB validation, and Sidebar conditionally renders an img or letter initial.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | useProfile hook implementation (TDD) | d38f734 | src/hooks/useProfile.ts, src/hooks/useProfile.test.ts |
| 2 | Sidebar avatar display | 2471155 | src/components/Sidebar.tsx, src/components/Sidebar.test.tsx |

## What Was Built

**useProfile hook** (`src/hooks/useProfile.ts`):
- Fetches `profiles` row on mount via `select('id, tier, avatar_url').eq('id', userId).limit(1)`
- Returns `{ tier, avatarUrl, loading, updateAvatar, updateTier }`
- `updateAvatar(file)`: validates file.size <= 2MB (throws `'File must be under 2 MB'`), uploads to `${userId}/avatar.${ext}` with `upsert: true`, gets public URL, updates `profiles.avatar_url`, sets local `avatarUrl` state
- `updateTier(newTier)`: updates `profiles.tier` and sets local state

**Sidebar** (`src/components/Sidebar.tsx`):
- Calls `useProfile(userId)` where `userId = session?.user?.id ?? ''`
- Renders `<img src={avatarUrl} alt="Your avatar" ...>` when `avatarUrl` is non-null
- Falls back to letter-initial `<div>` when `avatarUrl` is null

## Verification

- `npm test -- --run useProfile`: 5/5 passed
- `npm test -- --run Sidebar`: 4/4 passed
- `npm test -- --run`: 220 passed, 0 failures

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added `act()` wrapping for async mutation assertions**
- **Found during:** Task 1 (GREEN phase)
- **Issue:** `updateAvatar` and `updateTier` set React state after `await` resolution; without `act()` wrapping the test assertion, React's state update wasn't flushed, causing `avatarUrl` and `tier` to read stale values
- **Fix:** Imported `act` from `@testing-library/react` and wrapped mutation calls in `await act(async () => { ... })` before assertions
- **Files modified:** src/hooks/useProfile.test.ts
- **Commit:** d38f734

## Decisions Made

- `act()` wrapping required for async mutations in renderHook tests — `updateAvatar` and `updateTier` trigger `setState` after `await`, which needs `act()` to flush synchronously in test assertions. This matches React Testing Library best practices for hook mutation tests.

## Self-Check

- [x] src/hooks/useProfile.ts — created
- [x] src/hooks/useProfile.test.ts — updated with 5 real tests
- [x] src/components/Sidebar.tsx — updated with avatar conditional
- [x] src/components/Sidebar.test.tsx — extended with 2 avatar tests
- [x] Commits d38f734, 2471155 exist
