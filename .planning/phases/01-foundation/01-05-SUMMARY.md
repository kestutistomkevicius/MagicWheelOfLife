---
phase: 01-foundation
plan: 05
subsystem: layout
tags: [sidebar, navigation, app-shell, auth, sign-out, auth-page]
requirements: [AUTH-04, AUTH-05]

dependency_graph:
  requires: [01-02]
  provides: [AppShell, Sidebar, AuthPage]
  affects: [src/App.tsx, all protected pages]

tech_stack:
  added: []
  patterns: [NavLink active-state styling, layout route with Outlet, sidebar sign-out, mode toggle with aria-labels]

key_files:
  created:
    - src/components/Sidebar.tsx
    - src/components/AppShell.tsx
    - src/pages/AuthPage.tsx
  modified:
    - src/components/Sidebar.test.tsx
    - src/pages/AuthPage.test.tsx
    - src/App.tsx

decisions:
  - "AuthPage mode toggle uses aria-label (Switch to create account / Switch to sign in) to distinguish toggle buttons from submit buttons — avoids ambiguous getByRole queries"
  - "bg-surface Tailwind token (fdf8f0) used for AppShell content area — matches warm/earthy palette"
  - "AuthPage discovered as uncommitted Plan 04 work; implemented fully within this plan rather than leaving stub"

metrics:
  duration: "~8 minutes"
  completed_date: "2026-03-14"
  tasks_completed: 2
  files_created: 3
  files_modified: 3
---

# Phase 01 Plan 05: AppShell + Sidebar Navigation Summary

**One-liner:** Sidebar navigation with 4 NavLinks + sign-out wired into AppShell layout, plus full AuthPage with email/password + Google OAuth using aria-label mode toggle to avoid test query ambiguity.

## What Was Built

- **Sidebar.tsx**: Dark warm sidebar (`bg-[#292524]`) with 4 NavLinks (My Wheel, Snapshots, Trend, Settings), active-state highlighting (`bg-brand-400/20`, `border-l-2 border-brand-400`, `text-white`), and a sign-out button calling `useAuth().signOut()` — implementing AUTH-05
- **AppShell.tsx**: Flex layout wrapper — Sidebar on left, `<main>` with `<Outlet />` on right. Uses `bg-surface` (`#fdf8f0`) for the warm content area
- **App.tsx**: Updated to import and use `AppShell` as the layout route element and real `AuthPage` replacing the placeholder
- **AuthPage.tsx**: Full email/password auth form + Google OAuth. Mode toggle uses `aria-label="Switch to create account"` / `aria-label="Switch to sign in"` to distinguish toggle from submit buttons, enabling unambiguous `getByRole` queries in tests

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Sidebar component with nav links + sign-out (TDD) | ff9fb9d | Sidebar.tsx, Sidebar.test.tsx |
| 2 | AppShell layout + wire into App.tsx | 70253fe | AppShell.tsx, App.tsx, AuthPage.tsx stub |
| 2b | Full AuthPage implementation + test fixes | c53f19b | AuthPage.tsx, AuthPage.test.tsx, App.tsx |

## Verification

- `npm test -- --run src/components/Sidebar.test.tsx`: 2 tests passing
- `npm test -- --run`: 12 tests passing, 0 failures
- `npm run build`: exits 0 (451 kB bundle)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] AuthPage.test.tsx had uncommitted real tests with no matching implementation**
- **Found during:** Task 2 — `npm test -- --run` full suite
- **Issue:** `AuthPage.test.tsx` had been locally modified (uncommitted) with 7 real tests that import `./AuthPage`, which didn't exist yet. This broke the full test suite.
- **Fix:** Created full `AuthPage.tsx` implementation. Fixed mode toggle button ambiguity by adding `aria-label="Switch to create account"` / `aria-label="Switch to sign in"` to toggle buttons. Updated `AuthPage.test.tsx` to use the aria-label queries matching the implementation.
- **Files modified:** `src/pages/AuthPage.tsx` (full impl), `src/pages/AuthPage.test.tsx` (test queries), `src/App.tsx` (real AuthPage import)
- **Commits:** 70253fe, c53f19b

## Self-Check: PASSED

- src/components/Sidebar.tsx: FOUND
- src/components/AppShell.tsx: FOUND
- src/pages/AuthPage.tsx: FOUND
- Commit ff9fb9d: FOUND
- Commit 70253fe: FOUND
- Commit c53f19b: FOUND
- Tests: 12 passed, 0 failed
- Build: exits 0
