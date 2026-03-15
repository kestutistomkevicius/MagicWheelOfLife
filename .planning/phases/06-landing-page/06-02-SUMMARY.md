---
phase: 06-landing-page
plan: "02"
subsystem: frontend-routing-landing
tags: [landing-page, routing, auth-guard, hero, nav]
dependency_graph:
  requires: ["06-01"]
  provides: ["public-landing-route", "landing-nav", "landing-hero", "auth-guard-pattern"]
  affects: ["src/App.tsx", "src/pages/LandingPage.tsx", "src/index.css"]
tech_stack:
  added: []
  patterns: ["three-state-session-guard", "public-route-outside-protected", "asChild-button-pattern"]
key_files:
  created:
    - src/pages/LandingPage.tsx
  modified:
    - src/App.tsx
    - src/pages/LandingPage.test.tsx
    - src/index.css
decisions:
  - "/ route moved outside ProtectedRoute — prevents unauthenticated visitors being redirected to /auth before LandingPage renders"
  - "Auth guard uses three-state session: undefined=loading (return null), session=truthy (navigate+return null), null=show page"
  - "Secondary CTA uses plain <a href='#features'> (not Link) — prevents React Router from intercepting hash anchor"
  - "HERO_WHEEL_DATA is module-level const — static, no backend calls, no hooks needed"
metrics:
  duration: "~4 minutes"
  completed_date: "2026-03-15"
  tasks_completed: 2
  files_changed: 4
---

# Phase 6 Plan 02: Routing Restructure and Landing Page Foundation Summary

Public route at `/` with three-state auth guard, sticky Nav (wordmark + sign-in + start-free), gradient Hero (headline + two CTAs + WheelChart static preview), smooth scroll enabled.

## What Was Built

**App.tsx restructured:** `/` is now a public route outside `<ProtectedRoute>`, alongside `/privacy` and `/terms`. The `<Route path="/" element={<Navigate to="/wheel" replace />}` inside AppShell was removed. The `path="*"` catch-all inside AppShell remains.

**LandingPage.tsx created:**
- Auth guard: `useEffect` navigates authenticated users to `/wheel`; returns `null` while session is undefined (prevents flash) or when session is truthy (prevents flicker before redirect)
- `LandingNav`: sticky nav with `JustAWheelOfLife` wordmark, Sign in text link, Start free button
- `HeroSection`: warm gradient background, `h1` headline, subline, two CTAs (primary to `/auth`, secondary `#features` anchor), `WheelChart` with 8-category static data
- TODO placeholders for Plans 03+ sections (Feature showcase, Testimonials, Pricing, Final CTA, Footer)

**index.css:** `scroll-behavior: smooth` added to `html` selector inside existing `@layer base` block.

**LAND-01 tests implemented:** three tests converted from `it.todo` to passing assertions (null render on undefined session, redirect on authenticated session, heading visible on null session).

## Verification

- `npm test -- --run src/pages/LandingPage.test.tsx`: 3 passed, 7 todo
- `npm run build`: clean build (941KB chunk warning is pre-existing Recharts bundle, not introduced here)

## Deviations from Plan

**1. [Rule 2 - Combined tasks] LandingPage.tsx created during Task 1 (TDD GREEN phase)**
- Task 1 was marked TDD and required implementing LandingPage.tsx to make the tests pass
- Task 2 added only the `scroll-behavior: smooth` CSS change since LandingPage was already complete
- This is a sequencing detail, not a deviation — both tasks' outputs are fully present and committed

No other deviations — plan executed as written.

## Self-Check

- [x] `src/App.tsx` — modified, public routes added
- [x] `src/pages/LandingPage.tsx` — created with auth-guard, Nav, Hero
- [x] `src/pages/LandingPage.test.tsx` — LAND-01 tests implemented
- [x] `src/index.css` — scroll-behavior: smooth added
- [x] Commits: 486bcfc (task 1), 76827ad (task 2)
