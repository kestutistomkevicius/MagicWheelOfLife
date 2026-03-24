# Roadmap: JustAWheelOfLife

## Overview

JustAWheelOfLife is built in 37 phases across two milestones. The first 10 phases (Milestone 1) delivered the core product: authentication, interactive wheel, action items, snapshots, trend analysis, landing page, gamification, profile/settings, AI coaching, and pre-launch polish. Phases 11–37 (Milestone 2) add strategic depth: security hardening, multi-wheel UX, design refresh, values discovery, assessment, focus planning, daily check-ins, weekly AI synthesis, Stripe subscriptions, admin tooling, referral system, and coaching conversion. Deploy to production follows Phase 37.

**Primary strategic reference for Phases 11–37:** `way-forward/Summary_v2.md` — Values-Integrated Transformational Wheel System.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

### Milestone 1 — Core Product (complete)

- [x] **Phase 1: Foundation** - Project scaffold, authentication, and dev seed data (completed 2026-03-14)
- [x] **Phase 2: Wheel & Scoring** - Interactive wheel creation, category management, and live slider scoring (completed 2026-03-15)
- [x] **Phase 3: Action Items** - Per-category action tracking with deadlines and completion state (completed 2026-03-15)
- [x] **Phase 4: Snapshots & Comparison** - Manual snapshot saves and two-wheel overlay comparison (completed 2026-03-15)
- [x] **Phase 5: Trend Chart** - Single-category score trajectory over time (completed 2026-03-15)
- [x] **Phase 6: Landing Page** - Public acquisition page with value proposition and CTAs (completed 2026-03-15)
- [x] **Phase 7: Action Items & Wheel Polish** - Gamification, expiry widget, trend markers, important categories, tier limits, wheel rename (completed 2026-03-20)
- [x] **Phase 8: Profile, Settings & Content** - Settings page, avatar, terms/privacy, feature requests, snapshot UX, wheel selector on trends (completed 2026-03-20)
- [x] **Phase 9: AI & Premium** - AI-assisted category scoring chat, tier switching, color scheme personalization (completed 2026-03-21)
- [x] **Phase 10: Pre-Launch Improvements** - Soft-delete wheels with 10-min recovery, delete snapshots, authenticated footer, hover highlight fix (completed 2026-03-22)

### Milestone 2 — Strategic Depth

- [x] **Phase 11: Security Fix** - Close DEC-006: prevent free users from self-elevating to premium via direct API (completed 2026-03-24)
- [ ] **Phase 12: Multi-Wheel UX** - Fix broken multi-wheel experience; pluralise sidebar label for premium users
- [ ] **Phase 13: Design Refresh** - Implement incoming design assets; add coaching CTA to landing page
- [ ] **Phase 14: Trend Chart Rethink** - Replace broken exact-date markers with between-snapshot interval approach
- [ ] **Phase 15: Admin Foundation** - Minimum viable admin: feature requests view, email notifications, admin role
- [ ] **Phase 16: Visual & UX Fixes** - Celebration animation, ROADMAP cleanup, close stale todos, final QA pass
- [ ] **Phase 17: Compliance Research** - GDPR/UK GDPR research; produce COMPLIANCE-FINDINGS.md before personal data phases
- [ ] **Phase 18: Values DB & Admin Library** - values, user_values, value_domain_mappings schema; admin CRUD for values library
- [ ] **Phase 19: Values Discovery Flow** - Card sort, narrowing, forced tradeoffs, behavior tests; values shortlist + enacted/aspirational split
- [ ] **Phase 20: Values-Domain Mapping** - Connect values to wheel categories; show values as tags on wheel
- [ ] **Phase 21: Assessment DB & Page** - Multi-dimensional scores (alignment, consistency, friction); AI-guided assessment page
- [ ] **Phase 22: Wheel Alignment View** - Toggle on WheelPage: opportunity zones, strength zones, hidden conflict zones (premium)
- [ ] **Phase 23: Focus & Action Plan** - Strategic focus page: identity statement, 30-day direction, weekly habit, AI micro-actions
- [ ] **Phase 24: All-Tasks View** - Cross-category flat task list with filter by status/category/due date
- [ ] **Phase 25: Stripe Integration** - Subscription checkout, webhook-driven tier upgrade, cancel/reactivate
- [ ] **Phase 26: Pricing Config & Free Tier Hardening** - Admin-configurable pricing copy; enforce free limits from real subscription state
- [ ] **Phase 27: Daily Check-in** - ~5-min daily reflection loop with streak tracker and Stan Tatkin option
- [ ] **Phase 28: Weekly Review & AI Synthesis** - Weekly reflection + AI synthesis of check-ins, values, domain changes (premium)
- [ ] **Phase 29: User Data Controls** - View and permanently delete personal reflection data (GDPR compliance)
- [ ] **Phase 30: Admin Expansion** - User management, invite users, content management, all admin config in one panel
- [ ] **Phase 31: Referral System** - Unique referral links, conversion tracking, user dashboard, admin view
- [ ] **Phase 32: AI Coach Extended Context** - Per-category AI upgraded with values, alignment scores, recent reflections, contradictions
- [ ] **Phase 33: Contradiction Detection** - AI detects behavioural misalignment; non-judgmental insight cards
- [ ] **Phase 34: AI Synthesis Upgrade** - Post-assessment summary, cross-domain weekly synthesis, trend alignment overlay
- [ ] **Phase 35: Coaching CTA & Offers Page** - Trigger-based coaching CTAs; coaching offers page with 3–4 program descriptions
- [ ] **Phase 36: Coach-Ready Summary** - PDF alignment summary for coaching session prep (premium)
- [ ] **Phase 37: Referral Strategy & Founder Analytics** - Referral incentives, landing page, email flows, CTA conversion analytics

### Deploy — Vercel + Supabase Cloud
Timing: After Phase 37 is verified. No fixed phase number — deploy when ready.

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
- [x] 01-01-PLAN.md — Vite + React + TypeScript + Tailwind + shadcn scaffold, Vitest setup, test stubs
- [x] 01-02-PLAN.md — Supabase AuthContext, ProtectedRoute, React Router structure, placeholder pages
- [x] 01-03-PLAN.md — Supabase config.toml (Google OAuth), seed.sql (free + premium dev users)
- [x] 01-04-PLAN.md — AuthPage: sign-in/create-account toggle, email form, Google OAuth button
- [x] 01-05-PLAN.md — AppShell layout, Sidebar navigation, sign-out wiring
- [x] 01-06-PLAN.md — Human verification checkpoint: end-to-end auth flows

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
- [x] 02-01-PLAN.md — DB migration: profiles, wheels, categories tables + RLS + SECURITY DEFINER function + seed data
- [x] 02-02-PLAN.md — Wave 0 test scaffolds: it.todo stubs for all hooks and components
- [x] 02-03-PLAN.md — Data hooks: useWheel (load, create, updateScore) + useCategories (add, rename, remove)
- [x] 02-04-PLAN.md — UI components: WheelChart (dual-series radar) + CategorySlider (as-is/to-be sliders)
- [x] 02-05-PLAN.md — WheelPage integration: wire hooks + components, CreateWheelModal, SnapshotWarningDialog
- [x] 02-06-PLAN.md — Human verification checkpoint: end-to-end wheel flows

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
- [x] 03-01-PLAN.md — Wave 0: ActionItemRow type, shadcn Checkbox install, test stubs for useActionItems and ActionItemList
- [x] 03-02-PLAN.md — DB migration: action_items table + RLS + seed data for both dev users
- [x] 03-03-PLAN.md — useActionItems hook: load, add (7-item limit), toggle, setDeadline, delete
- [x] 03-04-PLAN.md — ActionItemList component: add/toggle/deadline/delete with optimistic UI
- [x] 03-05-PLAN.md — WheelPage + CategorySlider integration: expand/collapse per category, lazy load, rename UX fix
- [x] 03-06-PLAN.md — Human verification checkpoint: end-to-end action item flows

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
- [x] 04-01-PLAN.md — Wave 0: DB migration (snapshots + snapshot_scores + RLS), seed data (4 quarterly snapshots for premium user), test stubs
- [x] 04-02-PLAN.md — Types (SnapshotRow, SnapshotScoreRow) + useSnapshots hook (saveSnapshot, listSnapshots, fetchSnapshotScores, checkSnapshotsExist)
- [x] 04-03-PLAN.md — SnapshotNameDialog component + ComparisonChart (four-series amber/blue radar overlay)
- [x] 04-04-PLAN.md — SnapshotsPage full implementation (list, comparison picker, score history table) + WheelPage hasSnapshots activation
- [x] 04-05-PLAN.md — Human verification checkpoint: end-to-end snapshot flows

### Phase 5: Trend Chart
**Goal**: Users can see how a single category's scores have moved over time
**Depends on**: Phase 4
**Requirements**: TREND-01
**Success Criteria** (what must be TRUE):
  1. User can select a category and view a line chart showing its as-is and to-be scores at each snapshot date
  2. When fewer than 3 snapshots exist, the trend chart area shows a graceful empty state (message, not a broken chart)
**Plans**: 3 plans

Plans:
- [x] 05-01-PLAN.md — TrendChart component (Recharts LineChart, amber/blue) + Wave 0 TrendPage test stubs
- [x] 05-02-PLAN.md — TrendPage full implementation: data loading, category select, empty state, test suite
- [x] 05-03-PLAN.md — Human verification checkpoint: end-to-end trend chart flows

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
- [x] 06-01-PLAN.md — Wave 0: LandingPage test stubs, useInView hook, stub pages (Privacy/Terms), SEO meta in index.html, OG image placeholder
- [x] 06-02-PLAN.md — App.tsx routing restructure (/ as public route) + LandingPage Nav + Hero with WheelChart preview
- [x] 06-03-PLAN.md — LandingPage content sections: Feature showcase, Testimonials, Pricing, Final CTA, Footer
- [x] 06-04-PLAN.md — Human verification checkpoint: end-to-end landing page flows

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
- [x] 07-01-PLAN.md — Wave 0: DB migration (completed_at, note, is_important columns), TypeScript type updates, DueSoonWidget stub + test stubs
- [x] 07-02-PLAN.md — useActionItems extension: toggleActionItem writes completed_at, saveCompletionNote, reopenActionItem
- [x] 07-03-PLAN.md — useWheel extension: expose tier, renameWheel, updateCategoryImportant + reorderWithImportantFirst
- [x] 07-04-PLAN.md — ActionItemList: celebration animation (CSS keyframes), completion modal (note-to-self), completed items table with reopen
- [x] 07-05-PLAN.md — WheelPage + DueSoonWidget: inline wheel rename, free-tier category gate, auto-naming, Due Soon widget with hover highlight
- [x] 07-06-PLAN.md — CategorySlider star icon + WheelChart important category layer + hover highlight layer
- [x] 07-07-PLAN.md — TrendChart ReferenceLine markers + TrendPage marker computation from action items
- [x] 07-08-PLAN.md — Human verification checkpoint: end-to-end all POLISH-01 through POLISH-08 flows

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
- [x] 08-01-PLAN.md — DB migration (avatar_url + feature_requests table + storage bucket), TypeScript types, premium seed second wheel
- [x] 08-02-PLAN.md — Wave 0: test stubs for useProfile, SettingsPage, FeatureRequestModal
- [x] 08-03-PLAN.md — useProfile hook (avatar upload, tier) + Sidebar avatar display
- [x] 08-04-PLAN.md — AvatarUpload component + SettingsPage full implementation (avatar, tier badge, dev toggle)
- [x] 08-05-PLAN.md — FeatureRequestModal + Sidebar feedback nav entry
- [x] 08-06-PLAN.md — Full Terms of Service + Privacy Policy legal content
- [x] 08-07-PLAN.md — SnapshotsPage onboarding callout + TrendPage wheel selector tests (CONTENT-04, CONTENT-05)
- [x] 08-08-PLAN.md — Human verification checkpoint: end-to-end all PROFILE and CONTENT flows

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
- [x] 09-01-PLAN.md — Wave 0: test stubs for useAiChat, AiCoachDrawer, ColorSchemePicker, PaletteContext
- [x] 09-02-PLAN.md — DB migrations: ai_chat_messages table + RLS + pg_cron + profiles.color_scheme column + TypeScript types
- [x] 09-03-PLAN.md — Supabase Edge Function: ai-coach (JWT gate + premium check + Anthropic streaming proxy)
- [x] 09-04-PLAN.md — PaletteContext (PALETTES, applyPalette, PaletteProvider, usePalette) + useProfile color_scheme extension + tailwind.config.ts palette tokens
- [x] 09-05-PLAN.md — useAiChat hook: streaming fetch, sentinel detection, DB persistence, history load, error/retry
- [x] 09-06-PLAN.md — AiCoachDrawer component: chat thread, streaming bubbles, proposal card with Apply buttons
- [x] 09-07-PLAN.md — ColorSchemePicker component: swatch grid, selection indicator, free-tier lock overlay
- [x] 09-08-PLAN.md — WheelChart color props refactor + AppShell PaletteProvider wrap + Sidebar palette-accent
- [x] 09-09-PLAN.md — Wire-up: CategorySlider AI button + WheelPage drawer + SettingsPage color picker + PREMIUM-01 toggle fix
- [x] 09-10-PLAN.md — Human verification checkpoint: end-to-end all AI-01, PREMIUM-01, PREMIUM-02 flows

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
- [x] 10-01-PLAN.md — Wave 0: apply soft-delete migration, extend WheelRow type with deleted_at, add it.todo stubs to 5 test files
- [x] 10-02-PLAN.md — useWheel hook: softDeleteWheel, undoDeleteWheel, canCreateWheel fix, deleted_at in select
- [x] 10-03-PLAN.md — SnapshotsPage: snapshot hard-delete with inline confirmation and optimistic state removal
- [x] 10-04-PLAN.md — Sidebar: Terms + Privacy footer links pinned at bottom
- [x] 10-05-PLAN.md — WheelChart customTick: spoke line SVG element for DueSoon hover highlight
- [x] 10-06-PLAN.md — WheelPage: soft-delete button, pending-deletion banner, Undo, empty state recovery section
- [x] 10-07-PLAN.md — Human verification checkpoint: all 5 success criteria end-to-end

### Phase 11: Security Fix
**Goal**: Close DEC-006 — free users must not be able to self-elevate to premium tier via direct API call
**Depends on**: Phase 10
**Requirements**: SEC-01, SEC-02, SEC-03
**Success Criteria** (what must be TRUE):
  1. A free user cannot patch their own `tier` column to `premium` via direct Supabase API call
  2. Tier assignment path exists exclusively via service-role (Edge Function or subscriptions table)
  3. Existing tier-gated features continue working correctly after the RLS change
**Plans**: 3 plans

Plans:
- [ ] 11-01-PLAN.md — DB migration (column-level REVOKE/GRANT on profiles.tier) + set-tier Edge Function
- [ ] 11-02-PLAN.md — useProfile.updateTier refactor: direct DB write → functions.invoke + test mock update
- [ ] 11-03-PLAN.md — Human verification checkpoint: direct tier PATCH blocked, dev toggle works, avatar unaffected

### Phase 12: Multi-Wheel UX
**Goal**: Fix broken multi-wheel experience for premium users
**Depends on**: Phase 11
**Success Criteria** (what must be TRUE):
  1. Premium user with 2 wheels can select each wheel independently on TrendPage with correct snapshot data
  2. Sidebar label reads "My wheels" when user has more than 1 wheel

### Phase 13: Design Refresh
**Goal**: Implement incoming design assets across the full app; add coaching CTA to landing page
**Depends on**: Phase 12
**Open question**: Confirm design asset delivery format (MD file or Google Stitch MCP) before planning.
**Success Criteria** (what must be TRUE):
  1. New visual design is applied consistently across all pages
  2. Landing page has coaching CTA at top linking to coaching website (placeholder URL)

### Phase 14: Trend Chart Rethink
**Goal**: Fix the broken action marker feature on the trend chart
**Depends on**: Phase 13
**Open question**: Keep all-categories overview + single-category detail, or simplify to single-category only?
**Success Criteria** (what must be TRUE):
  1. Action items completed between two snapshots are surfaced alongside the chart when score improved in that interval
  2. Markers are no longer tied to exact date matching (previous approach almost never fired)

### Phase 15: Admin Foundation
**Goal**: Minimum viable admin tooling for the founder to operate during development
**Depends on**: Phase 14
**Success Criteria** (what must be TRUE):
  1. Admin role exists in `profiles` table; admin nav item only visible to admin users
  2. Admin can view all feature request submissions (user email, text, timestamp)
  3. New feature request submission triggers an email notification to admin address

### Phase 16: Visual & UX Fixes
**Goal**: QA pass and UX cleanup before the strategic phases begin
**Depends on**: Phase 15
**Success Criteria** (what must be TRUE):
  1. Celebration animation timing/visual feel is decided and shipped
  2. All stale todos from phases 7–10 are closed
  3. All Phase 10 launch success criteria pass on seeded local data

### Phase 17: Compliance Research
**Goal**: Understand data protection requirements before storing personal reflection data
**Depends on**: Phase 16
**Success Criteria** (what must be TRUE):
  1. `docs/COMPLIANCE-FINDINGS.md` produced with GO/NO-GO checklist per data-collecting phase
  2. GDPR, UK GDPR, and applicable equivalents researched
  3. Schema or architecture changes required before Phase 27 are identified

### Phase 18: Values DB & Admin Library
**Goal**: Lay the data foundation for values; give admin tools to manage the values library
**Depends on**: Phase 17
**Success Criteria** (what must be TRUE):
  1. `values`, `user_values`, `value_domain_mappings` tables exist with RLS
  2. Admin can CRUD values with publish/draft state — changes only go live when explicitly published
  3. Values are grouped by category for the card sort UI

### Phase 19: Values Discovery Flow
**Goal**: Let users discover their core values through a structured interactive process
**Depends on**: Phase 18
**Open question**: Full onboarding wizard vs standalone "discover your values" page accessible from sidebar.
**Success Criteria** (what must be TRUE):
  1. User can complete card sort, narrowing, forced tradeoffs, and behaviour tests
  2. Output: Top 5 core values + domain-specific values + enacted vs aspirational split
  3. Free users get values shortlist (top 5); full mapping gated to premium

### Phase 20: Values-Domain Mapping
**Goal**: Let users connect their values to wheel categories; surface values as tags on the wheel
**Depends on**: Phase 19
**Success Criteria** (what must be TRUE):
  1. User can map their shortlisted values to wheel categories
  2. Values appear as subtle tags on each category in WheelPage

### Phase 21: Assessment DB & Page
**Goal**: Add multi-dimensional scoring; give users an AI-guided assessment experience
**Depends on**: Phase 20
**Success Criteria** (what must be TRUE):
  1. `categories` table has nullable `score_alignment`, `score_consistency`, `score_friction` columns captured at snapshot time
  2. Dedicated assessment page guides user through each domain with AI-assisted prompts
  3. AI generates diagnostic summary after completing assessment

### Phase 22: Wheel Alignment View
**Goal**: Visualise multi-dimensional scores on the wheel to reveal opportunity and conflict zones (premium)
**Depends on**: Phase 21
**Success Criteria** (what must be TRUE):
  1. WheelPage has toggle: Overview (as-is / to-be) vs Alignment view
  2. Alignment view shows opportunity zones, strength zones, hidden conflict zones
  3. Feature is premium-gated

### Phase 23: Focus & Action Plan
**Goal**: Give users a dedicated strategic space to commit to one primary focus domain
**Depends on**: Phase 22
**Success Criteria** (what must be TRUE):
  1. User can select 1 primary domain (optionally 1 secondary); system discourages more than 2
  2. Per domain: identity statement, 30-day direction, weekly habit, next action, fallback action, avoidance trigger, proof signal
  3. AI generates micro-actions: small, realistic, value-aligned suggestions

### Phase 24: All-Tasks View
**Goal**: Tactical cross-category view of all action items
**Depends on**: Phase 23
**Success Criteria** (what must be TRUE):
  1. Flat list of all action items across all categories
  2. Filterable by status, category, due date

### Phase 25: Stripe Integration
**Goal**: Wire up real payment processing; make premium subscriptions purchasable
**Depends on**: Phase 24
**Success Criteria** (what must be TRUE):
  1. User can complete Stripe Checkout to subscribe to premium
  2. Stripe webhook updates `profiles.tier` via service role on successful payment
  3. User can cancel or reactivate subscription
  4. Infrastructure supports a second paid tier without rebuild

### Phase 26: Pricing Config & Free Tier Hardening
**Goal**: Admin-configurable pricing display; enforce free tier limits from real subscription state
**Depends on**: Phase 25
**Success Criteria** (what must be TRUE):
  1. Admin can update displayed pricing copy without code deploy
  2. Free tier limits enforced from subscription status, not manual `tier` column
  3. Dev tier toggle replaced by real subscription state
  4. Coaching website URL configurable from admin; Phase 13 CTA placeholder goes live

### Phase 27: Daily Check-in
**Goal**: Build the daily ~5-minute reflection loop with streak tracking
**Depends on**: Phase 26 + Phase 17 compliance findings
**Open question**: Free tier limit (days or count of check-ins).
**Success Criteria** (what must be TRUE):
  1. User can complete ~5 reflection prompts daily; streak tracker increments on completion
  2. Stan Tatkin-based check-in option available
  3. Recovery/restart prompt shown after missed check-ins ("Welcome back — no judgment, just reset")
  4. Premium: full history and streak tracking

### Phase 28: Weekly Review & AI Synthesis
**Goal**: Weekly reflection loop with AI-generated synthesis of the week
**Depends on**: Phase 27
**Success Criteria** (what must be TRUE):
  1. Weekly review triggered after 5+ check-ins in a week (or manually)
  2. AI reads all daily check-ins + reflection text + domain score changes → generates weekly synthesis
  3. User responses and AI evaluations stored in separate tables
  4. Feature is premium-gated

### Phase 29: User Data Controls
**Goal**: Give users full control over their personal reflection data (GDPR compliance)
**Depends on**: Phase 28
**Success Criteria** (what must be TRUE):
  1. User can view all their check-in and weekly review responses
  2. User can permanently delete any or all check-in responses (no recovery)
  3. AI evaluation deletion policy implemented per Phase 17 compliance findings

### Phase 30: Admin Expansion
**Goal**: Full operational admin for the founder to manage users and content
**Depends on**: Phase 29
**Success Criteria** (what must be TRUE):
  1. Admin can view all registered users, manually set tier, suspend/revoke access
  2. Admin can edit reflection prompts, onboarding questions, values library
  3. Admin can generate invite links
  4. All admin config in one panel: coaching URL, pricing copy, values library, prompts

### Phase 31: Referral System
**Goal**: Enable users to refer others; track conversions
**Depends on**: Phase 30
**Success Criteria** (what must be TRUE):
  1. Each user has a unique referral link
  2. Referred user signup is tracked via referral code
  3. User dashboard shows referral count and conversions
  4. Admin can view users with converted referrals

### Phase 32: AI Coach Extended Context
**Goal**: Make per-category AI coaching significantly richer with full user context
**Depends on**: Phase 31
**Success Criteria** (what must be TRUE):
  1. Per-category AI Coach has context: user values list, alignment scores, recent reflections, active contradictions
  2. Edge Function `ai-coach` updated with extended context payload

### Phase 33: Contradiction Detection
**Goal**: Automatically detect and surface behavioural misalignment between declared values and actions
**Depends on**: Phase 32
**Success Criteria** (what must be TRUE):
  1. AI detects patterns like: "Family is a top value but no family-related actions completed in 3 weeks"
  2. Insight surfaced as non-judgmental, dismissible card
  3. Separate `ai-synthesis` Edge Function handles contradiction detection

### Phase 34: AI Synthesis Upgrade
**Goal**: Extend AI from weekly synthesis to cross-domain post-assessment assessor and pattern detector
**Depends on**: Phase 33
**Success Criteria** (what must be TRUE):
  1. After first full assessment: AI generates "initial alignment summary" with 3–5 insight statements and suggested first focus domain
  2. Weekly synthesis upgraded with cross-domain awareness (values, alignment scores, contradiction signals)
  3. Alignment score trend line available as optional overlay on trend chart

### Phase 35: Coaching CTA & Offers Page
**Goal**: Structured coaching conversion entry points based on defined trigger conditions
**Depends on**: Phase 34
**Success Criteria** (what must be TRUE):
  1. Trigger conditions fire correctly: low domain for 3+ months, recurring contradiction 4+ weeks, user marks domain "stuck", 3+ missed commitments
  2. CTA card appears non-modally, is dismissible, and trigger thresholds are admin-configurable
  3. Coaching offers page exists with 3–4 program descriptions linking to coaching website

### Phase 36: Coach-Ready Summary
**Goal**: Let premium users download a formatted alignment summary to share with a coach
**Depends on**: Phase 35
**Success Criteria** (what must be TRUE):
  1. Premium user can download PDF alignment summary covering: values profile, all domain scores, 3-month trend, patterns, active contradictions, AI insight notes
  2. Feature is premium-gated

### Phase 37: Referral Strategy & Founder Analytics
**Goal**: Activate referral marketing; give founder visibility into CTA and conversion data
**Depends on**: Phase 36
**Success Criteria** (what must be TRUE):
  1. Referral incentive implemented (e.g. free month of premium per converted referral)
  2. Referral landing page exists
  3. Admin can view coaching CTA trigger events, click-through rates, referral conversion funnel

### Deploy — Vercel + Supabase Cloud
**Goal**: Ship to production
**Timing**: After Phase 37 is verified
**Scope**:
- Supabase Cloud project: apply all migrations, seed admin user
- Vercel deploy: frontend build, environment variables wired
- Supabase secrets: ANTHROPIC_API_KEY, ANTHROPIC_MODEL, admin email, Stripe keys
- Domain config
- Stripe production keys + webhook endpoints
- Production smoke test: all critical user flows end-to-end
- Coaching website URL live and wired into admin config

## Open Questions (flagged for individual phase planning)

| Question | Phase |
|----------|-------|
| Values discovery: guided wizard vs standalone page | Phase 19 |
| Stan Tatkin check-in: specific questions/structure | Phase 27 |
| Free tier daily check-in limit (days or count) | Phase 27 |
| AI evaluation deletion policy (GDPR) | Phase 17 → Phase 29 |
| Trend chart: keep both views or simplify to single-category | Phase 14 |
| Contradiction detection: migrate to hybrid (C) when? | Phase 33 → post-launch |
| Design asset delivery format | Phase 13 |

## Post-Launch Backlog

### Role model review (first coaching client)
When the first external coaching client is onboarded, revisit DEC-007 and design the `coach` role:
- Coach role in `profiles` (separate from `admin` — see DEC-007)
- Admin can hold both `admin` + `coach` roles simultaneously
- Consent model: user explicitly grants coach access to their wheel
- Coach can view consented wheels (read-only)
- Coach dashboard, session notes, CRM (scope TBD at that time)

| Item | Stage |
|------|-------|
| Coach role + consent model + dashboard | Post-launch — first coaching client (see DEC-007) |
| Specialized wheels (Values Alignment, Relationship, Men's Reset, Burnout, Leadership, Parenting) | Post-launch Phase 2 product |
| Gamification / badge system | Post-launch Phase 2 |
| Life seasons model | Post-launch Phase 2 |
| Calendar / time alignment audit | Post-launch Phase 3 |
| White-label / B2B mode | Post-launch Phase 4 |
| Partner / couple / buddy mode | Post-launch Phase 4 |
| Shadow value audit | Post-launch Phase 3 |
| Decision filter | Post-launch Phase 3 |
| Contradiction detection hybrid migration (C) | Post-launch Phase 2 |

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → … → 37 → Deploy

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 6/6 | Complete | 2026-03-14 |
| 2. Wheel & Scoring | 6/6 | Complete | 2026-03-15 |
| 3. Action Items | 6/6 | Complete | 2026-03-15 |
| 4. Snapshots & Comparison | 5/5 | Complete | 2026-03-15 |
| 5. Trend Chart | 3/3 | Complete | 2026-03-15 |
| 6. Landing Page | 4/4 | Complete | 2026-03-15 |
| 7. Action Items & Wheel Polish | 8/8 | Complete | 2026-03-20 |
| 8. Profile, Settings & Content | 8/8 | Complete | 2026-03-20 |
| 9. AI & Premium | 10/10 | Complete | 2026-03-21 |
| 10. Pre-Launch Improvements | 7/7 | Complete | 2026-03-22 |
| 11. Security Fix | 3/3 | Complete   | 2026-03-24 |
| 12. Multi-Wheel UX | 0/TBD | Not started | - |
| 13. Design Refresh | 0/TBD | Not started | - |
| 14. Trend Chart Rethink | 0/TBD | Not started | - |
| 15. Admin Foundation | 0/TBD | Not started | - |
| 16. Visual & UX Fixes | 0/TBD | Not started | - |
| 17. Compliance Research | 0/TBD | Not started | - |
| 18. Values DB & Admin Library | 0/TBD | Not started | - |
| 19. Values Discovery Flow | 0/TBD | Not started | - |
| 20. Values-Domain Mapping | 0/TBD | Not started | - |
| 21. Assessment DB & Page | 0/TBD | Not started | - |
| 22. Wheel Alignment View | 0/TBD | Not started | - |
| 23. Focus & Action Plan | 0/TBD | Not started | - |
| 24. All-Tasks View | 0/TBD | Not started | - |
| 25. Stripe Integration | 0/TBD | Not started | - |
| 26. Pricing Config & Free Tier Hardening | 0/TBD | Not started | - |
| 27. Daily Check-in | 0/TBD | Not started | - |
| 28. Weekly Review & AI Synthesis | 0/TBD | Not started | - |
| 29. User Data Controls | 0/TBD | Not started | - |
| 30. Admin Expansion | 0/TBD | Not started | - |
| 31. Referral System | 0/TBD | Not started | - |
| 32. AI Coach Extended Context | 0/TBD | Not started | - |
| 33. Contradiction Detection | 0/TBD | Not started | - |
| 34. AI Synthesis Upgrade | 0/TBD | Not started | - |
| 35. Coaching CTA & Offers Page | 0/TBD | Not started | - |
| 36. Coach-Ready Summary | 0/TBD | Not started | - |
| 37. Referral Strategy & Founder Analytics | 0/TBD | Not started | - |
| Deploy | - | Not started | - |
