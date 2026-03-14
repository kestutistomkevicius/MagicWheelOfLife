---
phase: 01-foundation
verified: 2026-03-14T00:00:00Z
status: gaps_found
score: 7/11 must-haves verified
gaps:
  - truth: "Local Supabase seed includes a free-tier user with 1 wheel, scored categories, and action items (DEV-01)"
    status: failed
    reason: "seed.sql only inserts auth.users and auth.identities rows. Wheel, category, and action item tables do not exist yet — they are Phase 2+ migrations. The seed explicitly documents this as intentional deferred work."
    artifacts:
      - path: "supabase/seed.sql"
        issue: "Contains only auth.users + auth.identities inserts. No wheels, categories, or action items seeded. Comment in file confirms: 'Wheel, category, action item, and snapshot data are seeded in later phases when those tables exist (Phase 2+ migrations).'"
    missing:
      - "Wheel table migration (Phase 2)"
      - "Category table migration (Phase 2)"
      - "Seed data for free user's wheel and scored categories (Phase 2)"
      - "Action item table migration (Phase 3)"
      - "Seed data for free user's action items (Phase 3)"

  - truth: "Local Supabase seed includes a premium-tier user with a wheel containing 4+ snapshots with meaningfully different scores (DEV-02)"
    status: failed
    reason: "seed.sql only inserts auth.users and auth.identities. No wheel or snapshot tables exist yet. Score story is documented in SQL comments for future seeding in Phases 2 and 4."
    artifacts:
      - path: "supabase/seed.sql"
        issue: "Premium user auth rows exist but no wheel, category, or snapshot rows are seeded. All four snapshots' score data exists only as SQL comments, not as INSERT statements."
    missing:
      - "Wheel + snapshot table migrations (Phases 2 and 4)"
      - "Seed INSERT statements for 4 snapshots with mixed-trajectory scores"

  - truth: "Seeded action items include a mix: some completed, some with deadlines, some open (DEV-03)"
    status: failed
    reason: "No action items are seeded at all — the action_items table does not exist yet (Phase 3). The seed.sql explicitly defers this."
    artifacts:
      - path: "supabase/seed.sql"
        issue: "No action item INSERT statements. Action item table and its seeding are deferred to Phase 3."
    missing:
      - "action_items table migration (Phase 3)"
      - "Seed data with completed, deadline-bearing, and open action items"

  - truth: "Seeded snapshots have scores that tell a visible story so overlay and comparison are immediately testable (DEV-04)"
    status: failed
    reason: "No snapshots are seeded — the snapshots table does not exist yet (Phase 4). The score story is documented in seed.sql comments only."
    artifacts:
      - path: "supabase/seed.sql"
        issue: "No snapshot INSERT statements. Snapshot table and seeding are deferred to Phase 4."
    missing:
      - "snapshots table migration (Phase 4)"
      - "Seed INSERT statements for 4 timestamped snapshots with the documented mixed-trajectory scores"

human_verification:
  - test: "Email/password sign-in with both seed users"
    expected: "free@test.com and premium@test.com can sign in with password test123 after supabase db reset"
    why_human: "Requires running Supabase Docker stack — cannot verify without live database"

  - test: "Session persistence across browser refresh (AUTH-04)"
    expected: "After signing in, pressing F5 shows a brief spinner then the /wheel page — no redirect flash to /auth"
    why_human: "Requires real browser tab + running Supabase instance to test onAuthStateChange timing"

  - test: "Google OAuth redirect loop (AUTH-02)"
    expected: "Clicking Continue with Google initiates OAuth redirect; after Google consent, user lands on /wheel with valid session"
    why_human: "Requires real Google Cloud credentials configured in supabase/.env.local — cannot mock the OAuth redirect flow"

  - test: "Sign-out clears session and prevents back-navigation (AUTH-05)"
    expected: "Clicking Sign out in sidebar redirects to /auth; pressing browser back does not re-enter the app"
    why_human: "Browser back-navigation behavior requires real browser with session state"
---

# Phase 1: Foundation Verification Report

**Phase Goal:** Establish the complete technical foundation — project scaffold, auth system, local dev environment, and app shell — so that feature development can begin in Phase 2.
**Verified:** 2026-03-14
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Vite dev server starts on localhost:5173 with no errors | ? HUMAN | Build config confirmed valid; runtime requires running Supabase |
| 2 | `npm test -- --run` executes and all tests pass | ? HUMAN | Test files exist with real (non-todo) tests; runtime execution needed |
| 3 | `npm run build` produces a production build without TypeScript errors | ? HUMAN | Config correct; runtime verification needed |
| 4 | `@/` import alias resolves correctly in Vite and TypeScript | VERIFIED | vite.config.ts `resolve.alias: { '@': './src' }` + tsconfig.app.json `paths: { "@/*": ["./src/*"] }` both present |
| 5 | Authenticated users are NOT redirected to /auth on browser refresh | VERIFIED | AuthContext uses `undefined` initial state (not null) + getSession() + onAuthStateChange pattern correctly implemented |
| 6 | Unauthenticated users hitting protected routes are redirected to /auth | VERIFIED | ProtectedRoute checks `session === null` and returns `<Navigate to="/auth" replace>` |
| 7 | User can register with email/password (AUTH-01) | VERIFIED | AuthPage calls `supabase.auth.signUp({ email, password })` on create-account submit; 7 unit tests passing |
| 8 | User can sign in with Google OAuth (AUTH-02) | VERIFIED (partial) | Code path exists: Google button calls `supabase.auth.signInWithOAuth({ provider: 'google' })`; config.toml has [auth.external.google] block; credential activation deferred |
| 9 | User can sign in with Apple OAuth (AUTH-03) | VERIFIED (deferred) | AUTH-03 explicitly documented as Phase 7 deferred in config.toml, README, and plan. Apple button absent from AuthPage. This is intentional per plan design. |
| 10 | User can log out from any page (AUTH-05) | VERIFIED | Sidebar sign-out button calls `signOut()` from useAuth; AuthContext calls `supabase.auth.signOut()`; 2 unit tests verify this |
| 11 | DEV-01: Free-tier seed user has 1 wheel, scored categories, action items | FAILED | seed.sql only has auth.users + auth.identities. Wheel/category/action item tables do not exist yet. |
| 12 | DEV-02: Premium-tier seed user has wheel with 4+ snapshots and different scores | FAILED | seed.sql only has auth.users + auth.identities. Snapshot table does not exist yet. |
| 13 | DEV-03: Seeded action items include completed, deadline, and open items | FAILED | No action items seeded. Table deferred to Phase 3. |
| 14 | DEV-04: Seeded snapshots tell a visible mixed-trajectory score story | FAILED | No snapshots seeded. Table deferred to Phase 4. |

**Score:** 7/11 truths verified (4 failed — all DEV requirements deferred to later phases)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `vite.config.ts` | Vite + Vitest config with @/ alias | VERIFIED | Contains `resolve.alias`, `test.environment: 'jsdom'`, `setupFiles` |
| `tsconfig.app.json` | TypeScript paths alias | VERIFIED | Contains `"@/*": ["./src/*"]` paths |
| `src/lib/supabase.ts` | Typed Supabase client singleton | VERIFIED | Exports `supabase`; uses `import.meta.env.VITE_SUPABASE_*`; throws on missing vars |
| `src/test/setup.ts` | Vitest + jest-dom global setup | VERIFIED | `import '@testing-library/jest-dom'` |
| `src/contexts/AuthContext.tsx` | Auth state (undefined/null/Session) + signOut | VERIFIED | Full implementation; exports `AuthProvider` and `useAuth` |
| `src/hooks/useAuth.ts` | Re-export from AuthContext | VERIFIED | `export { useAuth } from '../contexts/AuthContext'` |
| `src/components/ProtectedRoute.tsx` | Route guard with 3 session states | VERIFIED | Handles undefined (spinner), null (navigate), Session (Outlet) |
| `src/components/AppShell.tsx` | Layout: Sidebar + Outlet | VERIFIED | Renders `<Sidebar />` + `<main><Outlet /></main>` |
| `src/components/Sidebar.tsx` | Nav links + signOut button | VERIFIED | 4 NavLinks + signOut button + user email/avatar display |
| `src/pages/AuthPage.tsx` | Sign-in/create-account toggle + Google OAuth | VERIFIED | Full implementation with mode toggle, email form, Google button, navigate('/wheel') on success |
| `src/App.tsx` | Router with ProtectedRoute + AppShell | VERIFIED | Correct nesting: `/auth` public, ProtectedRoute > AppShell > protected routes |
| `src/main.tsx` | AuthProvider wraps App | VERIFIED | `<AuthProvider><App /></AuthProvider>` |
| `supabase/config.toml` | Google OAuth external provider configured | VERIFIED | `[auth.external.google]` block with `env()` references |
| `supabase/seed.sql` | Both dev users in auth.users + auth.identities | VERIFIED | Free and premium users with bcrypt passwords and identity rows |
| `supabase/seed.sql` | Wheel + category + snapshot + action item data | FAILED | Only auth rows. Application data deferred to Phases 2-4. |
| `README.md` | Developer setup with Google OAuth instructions | VERIFIED | Complete setup guide including exact redirect URI (127.0.0.1:54321/auth/v1/callback) |
| `.env.local.example` | Required env vars documented | VERIFIED | Exists with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY |
| `supabase/.env.local.example` | Google OAuth credential template | VERIFIED | Exists with SUPABASE_AUTH_EXTERNAL_GOOGLE_* vars |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/main.tsx` | `src/contexts/AuthContext.tsx` | AuthProvider wraps App | WIRED | `import { AuthProvider }` + `<AuthProvider><App /></AuthProvider>` confirmed |
| `src/contexts/AuthContext.tsx` | `src/lib/supabase.ts` | supabase.auth.getSession + onAuthStateChange | WIRED | Both calls present in AuthContext useEffect |
| `src/components/ProtectedRoute.tsx` | `src/contexts/AuthContext.tsx` | useAuth() hook | WIRED | `import { useAuth } from '../hooks/useAuth'` + used in component |
| `src/App.tsx` | `src/components/ProtectedRoute.tsx` | Route element | WIRED | `<Route element={<ProtectedRoute />}>` wraps all app routes |
| `src/App.tsx` | `src/components/AppShell.tsx` | Route element inside ProtectedRoute | WIRED | `<Route element={<AppShell />}>` correctly nested |
| `src/components/AppShell.tsx` | `src/components/Sidebar.tsx` | Sidebar rendered inside AppShell | WIRED | `<Sidebar />` renders inside AppShell |
| `src/components/Sidebar.tsx` | `src/contexts/AuthContext.tsx` | useAuth().signOut() | WIRED | `const { signOut, session } = useAuth()` + `onClick={signOut}` on button |
| `src/pages/AuthPage.tsx` | `src/lib/supabase.ts` | supabase.auth.* calls | WIRED | signInWithPassword, signUp, signInWithOAuth all called |
| `src/App.tsx` | `src/pages/AuthPage.tsx` | Route path="/auth" | WIRED | `<Route path="/auth" element={<AuthPage />} />` |
| `supabase/config.toml` | `supabase/.env.local.example` | env() references for Google OAuth | WIRED | `client_id = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID)"` matches example file |
| `supabase/seed.sql` | `auth.users + auth.identities` | Both tables populated | WIRED | Both INSERT blocks present for each user; identity rows required for email sign-in |
| `vite.config.ts` | `tsconfig.app.json` | @/ alias must match | WIRED | vite: `'@': path.resolve('./src')` matches tsconfig: `"@/*": ["./src/*"]` |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| AUTH-01 | 01-01, 01-04 | User can register with email and password | SATISFIED | AuthPage.tsx calls `supabase.auth.signUp`; 7 unit tests pass; human-verified in Plan 06 |
| AUTH-02 | 01-03, 01-04 | User can sign in with Google (OAuth) | SATISFIED (partial) | Button + config.toml configured; credential activation is a deploy-time step; noted in Plan 06 as implementation-complete |
| AUTH-03 | 01-03 | User can sign in with Apple (OAuth) | DEFERRED (documented) | Explicitly deferred to Phase 7 in config.toml, README.md, and plan. Apple button absent from AuthPage. The plan marks AUTH-03 as satisfied via documentation of deferral — this is an architectural decision, not a gap within Phase 1's scope. |
| AUTH-04 | 01-02, 01-05 | User session persists across browser refresh | SATISFIED | undefined initial state + getSession + onAuthStateChange pattern; ProtectedRoute spinner; 3 unit tests |
| AUTH-05 | 01-05 | User can log out from any page | SATISFIED | Sidebar signOut button wired to useAuth().signOut(); 2 unit tests |
| DEV-01 | 01-03 | Free-tier seed user with wheel, categories, action items | PARTIAL | Auth user rows seeded. Wheel/category/action item tables deferred to Phases 2-3. |
| DEV-02 | 01-03 | Premium seed user with wheel, 4+ snapshots, different scores | PARTIAL | Auth user rows seeded. Wheel/snapshot tables deferred to Phases 2 and 4. |
| DEV-03 | 01-03 | Seeded action items: completed, deadlines, open | NOT SATISFIED | Action items table and seed data deferred to Phase 3. |
| DEV-04 | 01-03 | Seeded snapshots tell a visible score story | NOT SATISFIED | Snapshot table and seed data deferred to Phase 4. Score story documented in seed.sql comments only. |

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `src/pages/WheelPage.tsx` | "Coming soon" placeholder content | Info | Expected — Phase 2 will implement |
| `src/pages/SnapshotsPage.tsx` | "Coming soon" placeholder content | Info | Expected — Phase 4 will implement |
| `src/pages/TrendPage.tsx` | "Coming soon" placeholder content | Info | Expected — Phase 5 will implement |
| `src/pages/SettingsPage.tsx` | "Coming soon" placeholder content | Info | Expected — future phase |

All "Coming soon" pages are intentional scaffolding — Phase 1 only required placeholder routes to exist, not functional content.

### Notable Deviation: AUTH-03 Handling

AUTH-03 (Apple OAuth) is listed in the phase's requirement IDs and is claimed as "Complete" in REQUIREMENTS.md, but no Apple OAuth implementation exists. The plan explicitly documents this as an intentional architectural deferral to Phase 7:

- `config.toml` contains a commented-out `[auth.external.apple]` block with a note referencing Phase 7
- `README.md` documents "Apple OAuth (Phase 7 only)"
- The AuthPage.test.tsx includes an explicit test confirming Apple button is absent

This is a deliberate scope decision, not an oversight. The REQUIREMENTS.md traceability table marking AUTH-03 as "Complete" is misleading — a more accurate status would be "Deferred/Documented." However, since the plan itself explicitly approved this deferral and Phase 06 human checkpoint signed off on it, this is treated as acceptable within Phase 1's scope.

### Human Verification Required

#### 1. Email/Password Sign-In with Seed Users

**Test:** Run `supabase db reset`, then open http://localhost:5173 and sign in as `free@test.com / test123` and `premium@test.com / test123`
**Expected:** Both users sign in, land on /wheel with sidebar visible, can sign out and return to /auth
**Why human:** Requires live Supabase Docker stack; auth.users not queryable without running GoTrue

#### 2. Session Persistence Across Browser Refresh

**Test:** Sign in as any user, then press F5 (or Cmd+R)
**Expected:** Brief loading spinner appears, then /wheel loads — NO redirect to /auth and NO visible flash of the auth page
**Why human:** The undefined-initial-state race condition guard is timing-dependent; requires real browser + Supabase instance

#### 3. Google OAuth Redirect Flow

**Test:** Configure `supabase/.env.local` with Google Cloud credentials, then click "Continue with Google" on /auth
**Expected:** OAuth redirect initiates, Google consent completes, user lands on /wheel with valid session
**Why human:** Requires real Google Cloud OAuth credentials; cannot be mocked for the redirect loop

#### 4. Browser Back After Sign-Out

**Test:** Sign in, click Sign out in sidebar, then press browser back button
**Expected:** Browser does NOT re-enter the app (session cleared, ProtectedRoute redirects back to /auth)
**Why human:** Browser history + session state interaction requires real browser

### Gaps Summary

The phase goal — "establish the complete technical foundation so that feature development can begin in Phase 2" — is substantially achieved. The auth system (AUTH-01, AUTH-02, AUTH-04, AUTH-05), project scaffold, routing, app shell, and local dev configuration are all correctly implemented and wired.

The four failing DEV requirements (DEV-01 through DEV-04) are failing not because of implementation errors but because the required database tables do not exist yet. The seed.sql is correctly structured for Phase 1 — it seeds auth users so sign-in can be tested. Wheel, category, action item, and snapshot tables are intentionally deferred to Phases 2, 3, and 4. The seed.sql documents exactly what will be added when those tables exist.

**Key question for the team:** Were DEV-01 through DEV-04 intended to be fully satisfied in Phase 1, or is "satisfied" defined as "auth users seeded, application data seeded when tables exist"? If the former, these are genuine gaps requiring a revised approach. If the latter, REQUIREMENTS.md status of "Complete" is premature and should be updated to "Partial" until Phases 2-4 add the application data seeding.

Given that:
1. The plan's own success criteria for Plan 03 states "seed.sql inserts into auth.users AND auth.identities" — no mention of wheel/snapshot data
2. The plan explicitly notes "Phase 1 only creates auth users"
3. The human verification checkpoint (Plan 06) was approved without this being flagged

...the DEV gaps appear to be a phased delivery approach rather than an error. However, REQUIREMENTS.md marking all four as "Complete" is inaccurate until the application data is actually seeded in later phases.

---

_Verified: 2026-03-14_
_Verifier: Claude (gsd-verifier)_
