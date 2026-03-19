# Requirements: JustAWheelOfLife

**Defined:** 2026-03-14
**Core Value:** The wheel is always there when you return — see where you stood, where you are now, and take action on the gap.

## v1 Requirements

### Authentication

- [x] **AUTH-01**: User can register with email and password
- [x] **AUTH-02**: User can sign in with Google (OAuth)
- [x] **AUTH-03**: User can sign in with Apple (OAuth)
- [x] **AUTH-04**: User session persists across browser refresh
- [x] **AUTH-05**: User can log out from any page

### Wheel Management

- [x] **WHEEL-01**: User can create a wheel from the default 8-category template
- [x] **WHEEL-02**: User can create a wheel from a blank canvas (0 categories, add own)
- [x] **WHEEL-03**: User can add a category to their wheel (max 12 total)
- [x] **WHEEL-04**: User can rename a category; shown a warning if snapshots already exist
- [x] **WHEEL-05**: User can remove a category (min 3 total); shown a warning if snapshots already exist
- [x] **WHEEL-06**: Free-tier user is limited to 1 wheel; sees upgrade prompt when attempting to create a second
- [x] **WHEEL-07**: Premium-tier user can create unlimited wheels

### Scoring

- [x] **SCORE-01**: User can set an as-is score (1–10) per category via a slider
- [x] **SCORE-02**: User can set a to-be score (1–10) per category via a slider
- [x] **SCORE-03**: Wheel chart updates in real time as the user drags a slider (no save needed to see the visual)

### Action Items

- [x] **ACTION-01**: User can add up to 7 action items per category (free text)
- [x] **ACTION-02**: User can set an optional deadline date on an action item
- [x] **ACTION-03**: User can mark an action item as complete (checkbox)
- [x] **ACTION-04**: User can delete an action item

### Snapshots

- [x] **SNAP-01**: User can manually save a snapshot with a user-provided name; snapshot name is auto-appended with the current date (non-negotiable — always shown)
- [x] **SNAP-02**: User can view a chronological list of all saved snapshots

### Snapshot Comparison

- [x] **COMP-01**: User can select any two snapshots and view an overlay comparison: both wheels drawn on the same radar chart canvas in different colors
- [x] **COMP-02**: User can select a category and view a score history table: as-is and to-be values for that category across all saved snapshots

### Trend Chart

- [x] **TREND-01**: User can view a single-category trend chart (as-is and to-be scores over time for a selected category); requires 3+ snapshots; graceful empty state shown below that threshold

### Landing Page

- [x] **LAND-01**: Public landing page with a hero section: value proposition and a single primary CTA ("Start your wheel" → signup)
- [x] **LAND-02**: Landing page includes a feature showcase section (screenshots or animated preview of the wheel in action)
- [x] **LAND-03**: Landing page includes a social proof section (placeholder copy / testimonials until real users exist)
- [x] **LAND-04**: Landing page includes a pricing section showing free vs premium tier differences

### Dev & Test Infrastructure

- [x] **DEV-01**: Local Supabase seed includes a free-tier user (pre-created email + password, 1 wheel, scored categories, some action items)
- [x] **DEV-02**: Local Supabase seed includes a premium-tier user with a wheel containing 4+ snapshots with meaningfully different scores (for testing overlay comparison and trend chart)
- [x] **DEV-03**: Seeded action items include a mix: some completed, some with deadlines, some open
- [x] **DEV-04**: Seeded snapshots have scores that tell a visible story (e.g., Health improved, Career declined) so overlay and table are immediately testable

### Action Items & Wheel Polish (Phase 7)

- [x] **POLISH-01**: Completing an action item triggers a visible celebratory feedback (animation, sound, or micro-interaction)
- [x] **POLISH-02**: A "due soon" widget on WheelPage surfaces action items with deadlines within 7 days without requiring the user to expand each category
- [ ] **POLISH-03**: Trend chart displays ◆ markers at action item due/completion dates; green = completed, amber = due soon, red = overdue; tooltip shows item text
- [x] **POLISH-04**: Premium users can mark up to 3 categories as most important; marked categories are visually distinct in the wheel chart; free users see the feature disabled with an upgrade prompt
- [x] **POLISH-05**: Adding a category without renaming it receives an auto-incremented name ("New category 2", "New category 3", etc.) instead of a duplicate "New category"
- [x] **POLISH-06**: Free users are blocked from adding a 9th category with an upgrade prompt; premium users are capped at 12; both minimums remain at 3
- [x] **POLISH-07**: Users can rename a wheel inline from the WheelPage heading
- [x] **POLISH-08**: Completed action items move to a separate "Completed" list below the active items, displayed as a table with three columns: task text, completion date (auto-recorded when checked off), and an optional short note the user can write to their future self; the completion date is stored in the database when the item is toggled complete

### Profile, Settings & Content (Phase 8)

- [x] **PROFILE-01**: User can upload or select an avatar/photo that appears near the sign-out button in the app shell
- [x] **PROFILE-02**: Settings page is complete: color scheme selector, avatar management, current tier display, and a dev-only tier toggle for testing
- [x] **CONTENT-01**: Terms of Service page has full legal content replacing the "coming soon" stub
- [x] **CONTENT-02**: Privacy Policy page has full legal content replacing the "coming soon" stub
- [x] **CONTENT-03**: In-app feature request form is accessible from the nav; submissions are persisted or forwarded to the founder
- [x] **CONTENT-04**: A new user encounters a clear explanation of what a snapshot is and why to use it before or during their first snapshot save
- [x] **CONTENT-05**: Premium users can select which wheel to view trends for via a dropdown on TrendPage; seed data includes snapshots for multiple wheels

### AI & Premium (Phase 9)

- [ ] **AI-01**: User can open a per-category AI chat; the AI asks guided questions and suggests an as-is or to-be score; user confirms before any score is saved
- [ ] **PREMIUM-01**: User can switch their tier between free and premium from Settings (dev/staging environment only); all tier-gated features respond immediately without a page reload
- [ ] **PREMIUM-02**: User can select a color scheme for their wheel from a set of predefined palettes; the wheel chart and UI accent color update immediately and persist across sessions

### Deployment (Phase 10)

- [ ] **DEPLOY-01**: Production frontend deployed and publicly accessible via Vercel
- [ ] **DEPLOY-02**: Production database and auth running on Supabase Cloud with all migrations applied and RLS enabled on all tables

## v2 Requirements

### Auth

- **AUTH-V2-01**: Password reset via email link
- **AUTH-V2-02**: Email verification on signup

### Wheel Templates

- **TEMPL-01**: Additional preset templates (career-focused, student, health-focused)
- **TEMPL-02**: "Popular categories" suggestions when building a wheel (after 20+ users)

### Snapshot Management

- **SNAP-V2-01**: User can delete a snapshot
- **SNAP-V2-02**: User can rename a saved snapshot

### Trend Chart

- **TREND-V2-01**: All-categories trend chart (all score lines plotted over time on one chart)

### Monetization

- **MONET-01**: Stripe subscription integration for premium tier ($5–9/mo)
- **MONET-02**: Paywall enforcement at DB level: free tier wheel limit enforced via RLS INSERT policy (exists in v1 schema, payment gating added in v2)
- **MONET-03**: Upgrade CTA shown inline when free-tier user hits wheel limit

### Re-engagement

- **ENGAGE-01**: Email nudge reminders (user-configured: weekly / monthly reassessment prompt)
- **ENGAGE-02**: Calendar reminder integration (add reassessment to Google Calendar)

### Sharing

- **SHARE-01**: User can export their wheel as an image (with JustAWheelOfLife branding)
- **SHARE-02**: User can share wheel image to social media

### AI

- **AI-01**: AI SMART goal check on action items (flags vague items, suggests improvements)

## Out of Scope

| Feature | Reason |
|---------|---------|
| Anonymous / guest wheel creation | Login required — simpler data model, no guest session complexity |
| Coach dashboard (view client wheels) | Phase 4 — two-sided platform concern |
| Coach directory listing | Phase 4 |
| White-label for coaches | Phase 4 |
| Real-time collaboration | High complexity, not core to individual self-assessment |
| Multi-language / i18n | English-only MVP; revisit if EU traction |
| Mobile native app | Web-first; mobile stretch goal only |
| In-app scheduling / booking | Not a marketplace |
| Review / rating system | Phase 4 coach platform concern |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 1 | Complete |
| AUTH-05 | Phase 1 | Complete |
| DEV-01 | Phase 1 | Complete |
| DEV-02 | Phase 1 | Complete |
| DEV-03 | Phase 1 | Complete |
| DEV-04 | Phase 1 | Complete |
| WHEEL-01 | Phase 2 | Complete |
| WHEEL-02 | Phase 2 | Complete |
| WHEEL-03 | Phase 2 | Complete |
| WHEEL-04 | Phase 2 | Complete |
| WHEEL-05 | Phase 2 | Complete |
| WHEEL-06 | Phase 2 | Complete |
| WHEEL-07 | Phase 2 | Complete |
| SCORE-01 | Phase 2 | Complete |
| SCORE-02 | Phase 2 | Complete |
| SCORE-03 | Phase 2 | Complete |
| ACTION-01 | Phase 3 | Complete |
| ACTION-02 | Phase 3 | Complete |
| ACTION-03 | Phase 3 | Complete |
| ACTION-04 | Phase 3 | Complete |
| SNAP-01 | Phase 4 | Complete |
| SNAP-02 | Phase 4 | Complete |
| COMP-01 | Phase 4 | Complete |
| COMP-02 | Phase 4 | Complete |
| TREND-01 | Phase 5 | Complete |
| LAND-01 | Phase 6 | Complete |
| LAND-02 | Phase 6 | Complete |
| LAND-03 | Phase 6 | Complete |
| LAND-04 | Phase 6 | Complete |
| DEPLOY-01 | Phase 7 | Pending |
| DEPLOY-02 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 34 total
- Mapped to phases: 34
- Unmapped: 0

---
*Requirements defined: 2026-03-14*
*Last updated: 2026-03-14 after roadmap creation — all 34 requirements mapped*
