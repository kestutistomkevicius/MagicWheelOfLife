# Roadmap: JustAWheelOfLife

## Overview

Starting from zero, this roadmap builds JustAWheelOfLife in seven phases. The first phase establishes the project scaffold and secure user authentication — nothing else works without it. Phases 2 through 5 build the core product sequentially: the interactive wheel, action items, snapshot captures, and historical trend analysis. Phase 6 adds the public landing page that converts visitors into users. Phase 7 ships to production. Each phase delivers a complete, independently verifiable capability.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Project scaffold, authentication, and dev seed data (completed 2026-03-14)
- [x] **Phase 2: Wheel & Scoring** - Interactive wheel creation, category management, and live slider scoring (completed 2026-03-15)
- [ ] **Phase 3: Action Items** - Per-category action tracking with deadlines and completion state
- [ ] **Phase 4: Snapshots & Comparison** - Manual snapshot saves and two-wheel overlay comparison
- [ ] **Phase 5: Trend Chart** - Single-category score trajectory over time
- [ ] **Phase 6: Landing Page** - Public acquisition page with value proposition and CTAs
- [ ] **Phase 7: Launch** - Production deployment on Vercel and Supabase Cloud

## Phase Details

### Phase 1: Foundation
**Goal**: Developers can log in as a seeded user and the project compiles; authenticated users can access the app shell
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, DEV-01, DEV-02, DEV-03, DEV-04
**Success Criteria** (what must be TRUE):
  1. A new developer can clone the repo, run `supabase start` and `npm run dev`, and reach the app at localhost:5173 with no manual setup beyond env vars
  2. User can register with email and password, and the new account persists in the local database
  3. User can sign in with Google OAuth (Apple OAuth deferred to Phase 7)
  4. User session survives a browser refresh — the user remains logged in
  5. User can log out from any page and is redirected to the public (unauthenticated) state
**Plans**: 6 plans

Plans:
- [ ] 01-01-PLAN.md — Vite + React + TypeScript + Tailwind + shadcn scaffold, Vitest setup, test stubs
- [ ] 01-02-PLAN.md — Supabase AuthContext, ProtectedRoute, React Router structure, placeholder pages
- [ ] 01-03-PLAN.md — Supabase config.toml (Google OAuth), seed.sql (free + premium dev users)
- [ ] 01-04-PLAN.md — AuthPage: sign-in/create-account toggle, email form, Google OAuth button
- [ ] 01-05-PLAN.md — AppShell layout, Sidebar navigation, sign-out wiring
- [ ] 01-06-PLAN.md — Human verification checkpoint: end-to-end auth flows

### Phase 2: Wheel & Scoring
**Goal**: Users can create a wheel, manage its life-area categories, score each area with sliders, and see the radar chart update in real time
**Depends on**: Phase 1
**Requirements**: WHEEL-01, WHEEL-02, WHEEL-03, WHEEL-04, WHEEL-05, WHEEL-06, WHEEL-07, SCORE-01, SCORE-02, SCORE-03
**Success Criteria** (what must be TRUE):
  1. User can create a wheel from the default 8-category template and see a pre-filled radar chart immediately
  2. User can create a wheel from a blank canvas, add categories one at a time, and reach a wheel with 3–12 categories
  3. User can rename or remove a category; when snapshots exist, a warning dialog appears before the change is applied
  4. User can drag an as-is or to-be slider and watch the radar chart redraw in real time without any save action
  5. A free-tier user attempting to create a second wheel sees an upgrade prompt instead of a creation form; a premium-tier user succeeds
**Plans**: 6 plans

Plans:
- [ ] 02-01-PLAN.md — DB migration: profiles, wheels, categories tables + RLS + SECURITY DEFINER function + seed data
- [ ] 02-02-PLAN.md — Wave 0 test scaffolds: it.todo stubs for all hooks and components
- [ ] 02-03-PLAN.md — Data hooks: useWheel (load, create, updateScore) + useCategories (add, rename, remove)
- [ ] 02-04-PLAN.md — UI components: WheelChart (dual-series radar) + CategorySlider (as-is/to-be sliders)
- [ ] 02-05-PLAN.md — WheelPage integration: wire hooks + components, CreateWheelModal, SnapshotWarningDialog
- [ ] 02-06-PLAN.md — Human verification checkpoint: end-to-end wheel flows

### Phase 3: Action Items
**Goal**: Users can attach actionable tasks to each category, set deadlines, check them off, and delete them
**Depends on**: Phase 2
**Requirements**: ACTION-01, ACTION-02, ACTION-03, ACTION-04
**Success Criteria** (what must be TRUE):
  1. User can add up to 7 action items (free text) to a category; an eighth is blocked
  2. User can set an optional deadline date on an action item and see the date displayed
  3. User can check an action item as complete and see the visual state change (checked, struck-through, or equivalent)
  4. User can delete an action item and it disappears immediately
**Plans**: 6 plans

Plans:
- [ ] 03-01-PLAN.md — Wave 0: ActionItemRow type, shadcn Checkbox install, test stubs for useActionItems and ActionItemList
- [ ] 03-02-PLAN.md — DB migration: action_items table + RLS + seed data for both dev users
- [ ] 03-03-PLAN.md — useActionItems hook: load, add (7-item limit), toggle, setDeadline, delete
- [ ] 03-04-PLAN.md — ActionItemList component: add/toggle/deadline/delete with optimistic UI
- [ ] 03-05-PLAN.md — WheelPage + CategorySlider integration: expand/collapse per category, lazy load, rename UX fix
- [ ] 03-06-PLAN.md — Human verification checkpoint: end-to-end action item flows

### Phase 4: Snapshots & Comparison
**Goal**: Users can save named point-in-time captures of their wheel and compare any two captures side by side
**Depends on**: Phase 3
**Requirements**: SNAP-01, SNAP-02, COMP-01, COMP-02
**Success Criteria** (what must be TRUE):
  1. User can save a snapshot with a custom name; the saved entry shows the name and the current date appended
  2. User can view a chronological list of all saved snapshots for their wheel
  3. User can select any two snapshots and see both wheels rendered on the same radar chart in distinct colors (overlay view)
  4. User can select a category and view a table showing that category's as-is and to-be scores across every saved snapshot
**Plans**: TBD

### Phase 5: Trend Chart
**Goal**: Users can see how a single category's scores have moved over time
**Depends on**: Phase 4
**Requirements**: TREND-01
**Success Criteria** (what must be TRUE):
  1. User can select a category and view a line chart showing its as-is and to-be scores at each snapshot date
  2. When fewer than 3 snapshots exist, the trend chart area shows a graceful empty state (message, not a broken chart)
**Plans**: TBD

### Phase 6: Landing Page
**Goal**: A public landing page communicates the product value and drives visitor sign-ups
**Depends on**: Phase 1 (auth routes must exist for the CTA to land on)
**Requirements**: LAND-01, LAND-02, LAND-03, LAND-04
**Success Criteria** (what must be TRUE):
  1. An unauthenticated visitor can load the landing page and see a hero section with a value proposition and a "Start your wheel" CTA that leads to signup
  2. Visitor can scroll to a feature showcase section displaying screenshots or an animated preview of the wheel
  3. Visitor can scroll to a social proof section (placeholder testimonials are acceptable) and a pricing section showing free vs. premium tier differences
**Plans**: TBD

### Phase 7: Launch
**Goal**: The application is publicly accessible in production with all data secured and RLS enforced
**Depends on**: Phase 6
**Requirements**: DEPLOY-01, DEPLOY-02
**Success Criteria** (what must be TRUE):
  1. The frontend is live at a public Vercel URL and loads the landing page without errors
  2. Supabase Cloud has all migrations applied; every table has RLS enabled; a real user can register, create a wheel, and save a snapshot through the production URL
**Security Checklist** (OWASP gaps to close before go-live):
  - A05: Supabase Cloud dashboard → Auth → Email confirmation is ON (local config.toml has it disabled for dev)
  - A06: `npm audit --audit-level=high` passes with zero high/critical vulnerabilities
  - A08: `package-lock.json` is committed and up to date (ensures dependency integrity)
  - A09: Supabase Cloud dashboard → Logs → Auth logs enabled and reviewed for anomalies
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 6/6 | Complete   | 2026-03-14 |
| 2. Wheel & Scoring | 6/6 | Complete   | 2026-03-15 |
| 3. Action Items | 3/6 | In Progress|  |
| 4. Snapshots & Comparison | 0/TBD | Not started | - |
| 5. Trend Chart | 0/TBD | Not started | - |
| 6. Landing Page | 0/TBD | Not started | - |
| 7. Launch | 0/TBD | Not started | - |
