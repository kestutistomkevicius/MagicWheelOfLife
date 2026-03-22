# Roadmap: JustAWheelOfLife

## Overview

Starting from zero, this roadmap builds JustAWheelOfLife in ten phases. The first phase establishes the project scaffold and secure user authentication. Phases 2 through 5 build the core product sequentially: the interactive wheel, action items, snapshot captures, and historical trend analysis. Phase 6 adds the public landing page. Phases 7 through 9 add the killer features: action item gamification, user profile and settings, AI-assisted scoring, and premium tier gating. Phase 10 ships to production. Each phase delivers a complete, independently verifiable capability.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Project scaffold, authentication, and dev seed data (completed 2026-03-14)
- [x] **Phase 2: Wheel & Scoring** - Interactive wheel creation, category management, and live slider scoring (completed 2026-03-15)
- [ ] **Phase 3: Action Items** - Per-category action tracking with deadlines and completion state
- [x] **Phase 4: Snapshots & Comparison** - Manual snapshot saves and two-wheel overlay comparison (completed 2026-03-15)
- [x] **Phase 5: Trend Chart** - Single-category score trajectory over time (completed 2026-03-15)
- [x] **Phase 6: Landing Page** - Public acquisition page with value proposition and CTAs (completed 2026-03-15)
- [ ] **Phase 7: Action Items & Wheel Polish** - Gamification, expiry widget, trend markers, important categories, tier limits, wheel rename
- [ ] **Phase 8: Profile, Settings & Content** - Settings page, avatar, terms/privacy, feature requests, snapshot UX, wheel selector on trends
- [x] **Phase 9: AI & Premium** - AI-assisted category scoring chat, tier switching, color scheme personalization (completed 2026-03-21)
- [ ] **Phase 10: Pre-Launch Improvements** - Soft-delete wheels with 10-min recovery, delete snapshots, authenticated footer, hover highlight fix
- [ ] **Phase 15: Launch** - Production deployment on Vercel and Supabase Cloud

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
**Plans**: 5 plans

Plans:
- [ ] 04-01-PLAN.md — Wave 0: DB migration (snapshots + snapshot_scores + RLS), seed data (4 quarterly snapshots for premium user), test stubs
- [ ] 04-02-PLAN.md — Types (SnapshotRow, SnapshotScoreRow) + useSnapshots hook (saveSnapshot, listSnapshots, fetchSnapshotScores, checkSnapshotsExist)
- [ ] 04-03-PLAN.md — SnapshotNameDialog component + ComparisonChart (four-series amber/blue radar overlay)
- [ ] 04-04-PLAN.md — SnapshotsPage full implementation (list, comparison picker, score history table) + WheelPage hasSnapshots activation
- [ ] 04-05-PLAN.md — Human verification checkpoint: end-to-end snapshot flows

### Phase 5: Trend Chart
**Goal**: Users can see how a single category's scores have moved over time
**Depends on**: Phase 4
**Requirements**: TREND-01
**Success Criteria** (what must be TRUE):
  1. User can select a category and view a line chart showing its as-is and to-be scores at each snapshot date
  2. When fewer than 3 snapshots exist, the trend chart area shows a graceful empty state (message, not a broken chart)
**Plans**: 3 plans

Plans:
- [ ] 05-01-PLAN.md — TrendChart component (Recharts LineChart, amber/blue) + Wave 0 TrendPage test stubs
- [ ] 05-02-PLAN.md — TrendPage full implementation: data loading, category select, empty state, test suite
- [ ] 05-03-PLAN.md — Human verification checkpoint: end-to-end trend chart flows

### Phase 6: Landing Page
**Goal**: A public landing page communicates the product value and drives visitor sign-ups
**Depends on**: Phase 1 (auth routes must exist for the CTA to land on)
**Requirements**: LAND-01, LAND-02, LAND-03, LAND-04
**Success Criteria** (what must be TRUE):
  1. An unauthenticated visitor can load the landing page and see a hero section with a value proposition and a "Start your wheel" CTA that leads to signup
  2. Visitor can scroll to a feature showcase section displaying screenshots or an animated preview of the wheel
  3. Visitor can scroll to a social proof section (placeholder testimonials are acceptable) and a pricing section showing free vs. premium tier differences
**Plans**: 4 plans

Plans:
- [ ] 06-01-PLAN.md — Wave 0: LandingPage test stubs, useInView hook, stub pages (Privacy/Terms), SEO meta in index.html, OG image placeholder
- [ ] 06-02-PLAN.md — App.tsx routing restructure (/ as public route) + LandingPage Nav + Hero with WheelChart preview
- [ ] 06-03-PLAN.md — LandingPage content sections: Feature showcase, Testimonials, Pricing, Final CTA, Footer
- [ ] 06-04-PLAN.md — Human verification checkpoint: end-to-end landing page flows

### Phase 7: Action Items & Wheel Polish
**Goal**: Action items feel alive and motivating; categories have hierarchy; the wheel adapts to user tier
**Depends on**: Phase 6
**Requirements**: POLISH-01, POLISH-02, POLISH-03, POLISH-04, POLISH-05, POLISH-06, POLISH-07, POLISH-08
**Success Criteria** (what must be TRUE):
  1. Completing an action item triggers a celebratory animation/feedback (gamification)
  2. A "due soon" widget surfaces action items expiring within 7 days, visible without expanding each category
  3. Trend chart shows ◆ markers at action item due/completion dates, color-coded by status
  4. Premium users can mark up to 3 categories as most important; marked categories are visually distinct in the wheel
  5. Adding a category without renaming it gets auto-named "New category 2", "New category 3", etc.
  6. Free users are blocked from adding a 9th category with an upgrade prompt; premium capped at 12
  7. Users can rename a wheel inline from the WheelPage heading
  8. Completed action items appear in a separate "Completed" table (task | completion date | note to future self) below the active list; completion date is recorded automatically
**Plans**: 8 plans

Plans:
- [ ] 07-01-PLAN.md — Wave 0: DB migration (completed_at, note, is_important columns), TypeScript type updates, DueSoonWidget stub + test stubs
- [ ] 07-02-PLAN.md — useActionItems extension: toggleActionItem writes completed_at, saveCompletionNote, reopenActionItem
- [ ] 07-03-PLAN.md — useWheel extension: expose tier, renameWheel, updateCategoryImportant + reorderWithImportantFirst
- [ ] 07-04-PLAN.md — ActionItemList: celebration animation (CSS keyframes), completion modal (note-to-self), completed items table with reopen
- [ ] 07-05-PLAN.md — WheelPage + DueSoonWidget: inline wheel rename, free-tier category gate, auto-naming, Due Soon widget with hover highlight
- [ ] 07-06-PLAN.md — CategorySlider star icon + WheelChart important category layer + hover highlight layer
- [ ] 07-07-PLAN.md — TrendChart ReferenceLine markers + TrendPage marker computation from action items
- [ ] 07-08-PLAN.md — Human verification checkpoint: end-to-end all POLISH-01 through POLISH-08 flows

### Phase 8: Profile, Settings & Content
**Goal**: Users have a complete profile, the app is legally ready, and premium wheel/snapshot UX is complete
**Depends on**: Phase 7
**Requirements**: PROFILE-01, PROFILE-02, CONTENT-01, CONTENT-02, CONTENT-03, CONTENT-04, CONTENT-05
**Success Criteria** (what must be TRUE):
  1. User can set an avatar/photo that appears near the sign-out button in the app shell
  2. Settings page is complete: color scheme, avatar, tier display, and dev tier toggle (dev env only)
  3. Terms & Privacy pages have full legal content (not "coming soon" stubs)
  4. In-app feature request form is accessible from the nav; submissions are stored or forwarded
  5. A new user sees a clear explanation of what a snapshot is and why to use it before their first save
  6. Premium users can select which wheel to view trends for on the TrendPage
**Plans**: 8 plans

Plans:
- [ ] 08-01-PLAN.md — DB migration (avatar_url + feature_requests table + storage bucket), TypeScript types, premium seed second wheel
- [ ] 08-02-PLAN.md — Wave 0: test stubs for useProfile, SettingsPage, FeatureRequestModal
- [ ] 08-03-PLAN.md — useProfile hook (avatar upload, tier) + Sidebar avatar display
- [ ] 08-04-PLAN.md — AvatarUpload component + SettingsPage full implementation (avatar, tier badge, dev toggle)
- [ ] 08-05-PLAN.md — FeatureRequestModal + Sidebar feedback nav entry
- [ ] 08-06-PLAN.md — Full Terms of Service + Privacy Policy legal content
- [ ] 08-07-PLAN.md — SnapshotsPage onboarding callout + TrendPage wheel selector tests (CONTENT-04, CONTENT-05)
- [ ] 08-08-PLAN.md — Human verification checkpoint: end-to-end all PROFILE and CONTENT flows

### Phase 9: AI & Premium
**Goal**: AI lowers the friction of scoring; premium tier is fully testable end-to-end
**Depends on**: Phase 8
**Requirements**: AI-01, PREMIUM-01, PREMIUM-02
**Success Criteria** (what must be TRUE):
  1. User can open an AI chat per category; the AI asks guided questions and suggests an as-is or to-be score; user confirms before any score is saved
  2. User can switch their tier between free and premium from Settings (dev/staging only); tier-gated features respond immediately
  3. User can select a color scheme for their wheel from a set of predefined palettes; the wheel and UI accent update immediately
**Plans**: 10 plans

Plans:
- [ ] 09-01-PLAN.md — Wave 0: test stubs for useAiChat, AiCoachDrawer, ColorSchemePicker, PaletteContext
- [ ] 09-02-PLAN.md — DB migrations: ai_chat_messages table + RLS + pg_cron + profiles.color_scheme column + TypeScript types
- [ ] 09-03-PLAN.md — Supabase Edge Function: ai-coach (JWT gate + premium check + Anthropic streaming proxy)
- [ ] 09-04-PLAN.md — PaletteContext (PALETTES, applyPalette, PaletteProvider, usePalette) + useProfile color_scheme extension + tailwind.config.ts palette tokens
- [ ] 09-05-PLAN.md — useAiChat hook: streaming fetch, sentinel detection, DB persistence, history load, error/retry
- [ ] 09-06-PLAN.md — AiCoachDrawer component: chat thread, streaming bubbles, proposal card with Apply buttons
- [ ] 09-07-PLAN.md — ColorSchemePicker component: swatch grid, selection indicator, free-tier lock overlay
- [ ] 09-08-PLAN.md — WheelChart color props refactor + AppShell PaletteProvider wrap + Sidebar palette-accent
- [ ] 09-09-PLAN.md — Wire-up: CategorySlider AI button + WheelPage drawer + SettingsPage color picker + PREMIUM-01 toggle fix
- [ ] 09-10-PLAN.md — Human verification checkpoint: end-to-end all AI-01, PREMIUM-01, PREMIUM-02 flows

### Phase 10: Pre-Launch Improvements
**Goal**: Users can delete wheels (with 10-minute undo), delete snapshots, access legal links from within the app, and the DueSoon hover highlight works correctly
**Depends on**: Phase 9
**Requirements**: (derived from todo backlog — no formal requirement IDs)
**Success Criteria** (what must be TRUE):
  1. Soft-deleting a wheel keeps it visible in the selector with "— Deleting in ~10 min" suffix; clicking Undo restores it; after 10 min the DB hard-deletes it
  2. When all wheels are soft-deleted the empty state shows a "Recover a wheel" section
  3. A snapshot can be deleted from the Snapshots page with a confirmation; it disappears immediately from all lists
  4. A pinned footer with Terms and Privacy links is visible on every authenticated page
  5. Hovering a due-soon item highlights the matching category axis in the wheel chart
**Plans**: 7 plans

Plans:
- [ ] 10-01-PLAN.md — Wave 0: apply soft-delete migration, extend WheelRow type with deleted_at, add it.todo stubs to 5 test files
- [ ] 10-02-PLAN.md — useWheel hook: softDeleteWheel, undoDeleteWheel, canCreateWheel fix, deleted_at in select
- [ ] 10-03-PLAN.md — SnapshotsPage: snapshot hard-delete with inline confirmation and optimistic state removal
- [ ] 10-04-PLAN.md — Sidebar: Terms + Privacy footer links pinned at bottom
- [ ] 10-05-PLAN.md — WheelChart customTick: spoke line SVG element for DueSoon hover highlight
- [ ] 10-06-PLAN.md — WheelPage: soft-delete button, pending-deletion banner, Undo, empty state recovery section
- [ ] 10-07-PLAN.md — Human verification checkpoint: all 5 success criteria end-to-end

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 6/6 | Complete | 2026-03-14 |
| 2. Wheel & Scoring | 6/6 | Complete | 2026-03-15 |
| 3. Action Items | 5/6 | In Progress | |
| 4. Snapshots & Comparison | 5/5 | Complete | 2026-03-15 |
| 5. Trend Chart | 3/3 | Complete | 2026-03-15 |
| 6. Landing Page | 4/4 | Complete | 2026-03-15 |
| 7. Action Items & Wheel Polish | 6/8 | In Progress|  |
| 8. Profile, Settings & Content | 7/8 | In Progress|  |
| 9. AI & Premium | 10/10 | Complete   | 2026-03-21 |
| 10. Pre-Launch Improvements | 0/7 | Not started | - |
| 15. Launch | 0/TBD | Not started | - |
