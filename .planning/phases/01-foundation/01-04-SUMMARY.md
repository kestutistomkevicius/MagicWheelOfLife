---
phase: 01-foundation
plan: 04
subsystem: auth
tags: [react, supabase, shadcn, tailwind, vitest, testing-library]

# Dependency graph
requires:
  - phase: 01-02
    provides: Supabase client (src/lib/supabase.ts), AuthContext, ProtectedRoute wired in App.tsx
provides:
  - Single auth page at /auth with sign-in/create-account toggle
  - Email/password form calling supabase.auth.signInWithPassword and signUp
  - Google OAuth button calling supabase.auth.signInWithOAuth
  - Inline error display via role="alert"
  - shadcn Button, Input, Label UI components
  - 7 passing unit tests covering all auth flows
affects: [05-wheel-view, 06-snapshots, 07-trend]

# Tech tracking
tech-stack:
  added:
    - "@radix-ui/react-label ^2.x — Radix Label primitive for accessible form labels"
    - "@testing-library/user-event ^14.x — realistic user interaction simulation in tests"
    - "class-variance-authority — already installed, used for shadcn Button variants"
  patterns:
    - "shadcn UI components (Button, Input, Label) placed in src/components/ui/"
    - "Supabase auth methods mocked at module level via vi.mock('@/lib/supabase')"
    - "Toggle pattern: single contextual button (shows opposite mode) avoids duplicate button names in tests"

key-files:
  created:
    - src/pages/AuthPage.tsx
    - src/pages/AuthPage.test.tsx
    - src/components/ui/button.tsx
    - src/components/ui/input.tsx
    - src/components/ui/label.tsx
  modified:
    - src/App.tsx (replaced AuthPagePlaceholder with real AuthPage import)
    - package.json (added @radix-ui/react-label, @testing-library/user-event)

key-decisions:
  - "Toggle implemented as single contextual link button (shows opposite mode label) rather than a two-tab toggle — avoids duplicate accessible names for submit vs. toggle buttons in tests"
  - "shadcn UI components created manually (CLI skipped) because tsconfig.app.json alias not in root tsconfig.json — shadcn CLI could not find @/* alias"
  - "Apple OAuth button absent — deferred to Phase 7 per plan (AUTH-03)"

patterns-established:
  - "shadcn component pattern: forwardRef + cva variants in src/components/ui/"
  - "Supabase auth mock pattern: vi.mock at module level with vi.mocked() typed helpers"
  - "Inline error via role=alert paragraph below submit button — no toast/banner pattern"

requirements-completed: [AUTH-01, AUTH-02]

# Metrics
duration: 25min
completed: 2026-03-14
---

# Phase 1 Plan 4: AuthPage — Sign-in, Create Account, Google OAuth Summary

**Email/password auth page with Google OAuth button wired to Supabase, 7 passing unit tests, shadcn Button/Input/Label components bootstrapped**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-03-14T22:10:00Z
- **Completed:** 2026-03-14T22:20:00Z
- **Tasks:** 2 (TDD: RED then GREEN for each)
- **Files modified:** 7

## Accomplishments
- AuthPage renders at /auth: email + password fields, inline error display (role="alert"), Google OAuth button, no Apple button
- Mode toggle between Sign in and Create account on same page/URL without navigation
- 7 unit tests covering signInWithPassword, signUp, OAuth, error display, Apple button absence
- shadcn UI components (Button, Input, Label) bootstrapped in src/components/ui/
- App.tsx updated to use real AuthPage instead of placeholder

## Task Commits

Each task was committed atomically:

1. **Task 1 + 2: AuthPage implementation + tests** - `c53f19b` (fix) — committed by prior plan-04 agent run under 01-05 label
2. **shadcn UI components + dependencies** - `a80686b` (feat)

## Files Created/Modified
- `src/pages/AuthPage.tsx` — Full auth page with sign-in/create-account toggle, email form, Google OAuth, inline error
- `src/pages/AuthPage.test.tsx` — 7 tests: form fields, signInWithPassword, signUp, error display, Google OAuth, no Apple button
- `src/components/ui/button.tsx` — shadcn Button with CVA variants (default, outline, ghost, etc.)
- `src/components/ui/input.tsx` — shadcn Input wrapping native input
- `src/components/ui/label.tsx` — shadcn Label using @radix-ui/react-label
- `src/App.tsx` — Replaced AuthPagePlaceholder with `import { AuthPage } from './pages/AuthPage'`
- `package.json` — Added @radix-ui/react-label and @testing-library/user-event

## Decisions Made
- Toggle implemented as a single contextual button (showing the opposite mode name) rather than side-by-side tabs — this avoids ambiguous button names in tests where both the toggle and submit button would match the same text
- shadcn components created manually because the shadcn CLI requires path aliases in the root tsconfig.json, but this project uses tsconfig.app.json for the `@/*` alias — the CLI could not find it and exited with an error
- Apple OAuth absent from AuthPage — deferred to Phase 7 per plan requirements

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] shadcn CLI could not initialize — aliases in tsconfig.app.json not root tsconfig.json**
- **Found during:** Task 1 (AuthPage implementation)
- **Issue:** `npx shadcn@latest init --defaults` exited with "No import alias found in your tsconfig.json file" — the CLI only reads the root tsconfig.json, but aliases are defined in tsconfig.app.json
- **Fix:** Created Button, Input, Label components manually in src/components/ui/ following shadcn patterns; also installed @radix-ui/react-label separately
- **Files modified:** src/components/ui/button.tsx, src/components/ui/input.tsx, src/components/ui/label.tsx, package.json
- **Verification:** Components import correctly, build passes, 7 tests pass
- **Committed in:** a80686b

**2. [Rule 1 - Bug] Button name ambiguity broke tests — toggle and submit both said "Sign in"**
- **Found during:** Task 2 (test execution)
- **Issue:** `getByRole('button', { name: /sign in/i })` matched both the toggle button and the submit button, causing 4 test failures with "Found multiple elements"
- **Fix:** Redesigned toggle from two-tab buttons to a single contextual link button showing the opposite mode; this gives each button a unique accessible name (toggle shows "Create account" or "Sign in instead", submit shows the current mode action)
- **Files modified:** src/pages/AuthPage.tsx, src/pages/AuthPage.test.tsx
- **Verification:** All 7 tests pass, no ambiguous button queries
- **Committed in:** c53f19b

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes were necessary for correctness. The toggle redesign still satisfies the plan requirement of mode toggle on same page/URL.

## Issues Encountered
- The linter (Claude style suggestions) modified AuthPage.tsx multiple times during execution, changing toggle buttons to role="presentation" divs and aria-labels — resolved by reading the current file state before each write and adapting tests to the final component structure

## Next Phase Readiness
- Auth entry point is complete and tested — users can sign in, create accounts, and trigger Google OAuth
- ProtectedRoute from 01-02 will redirect unauthenticated users to /auth
- Apple OAuth (AUTH-03) remains deferred to Phase 7

---
*Phase: 01-foundation*
*Completed: 2026-03-14*
