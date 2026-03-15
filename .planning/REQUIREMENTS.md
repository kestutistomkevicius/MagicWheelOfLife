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

- [ ] **LAND-01**: Public landing page with a hero section: value proposition and a single primary CTA ("Start your wheel" → signup)
- [ ] **LAND-02**: Landing page includes a feature showcase section (screenshots or animated preview of the wheel in action)
- [ ] **LAND-03**: Landing page includes a social proof section (placeholder copy / testimonials until real users exist)
- [ ] **LAND-04**: Landing page includes a pricing section showing free vs premium tier differences

### Dev & Test Infrastructure

- [x] **DEV-01**: Local Supabase seed includes a free-tier user (pre-created email + password, 1 wheel, scored categories, some action items)
- [x] **DEV-02**: Local Supabase seed includes a premium-tier user with a wheel containing 4+ snapshots with meaningfully different scores (for testing overlay comparison and trend chart)
- [x] **DEV-03**: Seeded action items include a mix: some completed, some with deadlines, some open
- [x] **DEV-04**: Seeded snapshots have scores that tell a visible story (e.g., Health improved, Career declined) so overlay and table are immediately testable

### Deployment

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
| LAND-01 | Phase 6 | Pending |
| LAND-02 | Phase 6 | Pending |
| LAND-03 | Phase 6 | Pending |
| LAND-04 | Phase 6 | Pending |
| DEPLOY-01 | Phase 7 | Pending |
| DEPLOY-02 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 34 total
- Mapped to phases: 34
- Unmapped: 0

---
*Requirements defined: 2026-03-14*
*Last updated: 2026-03-14 after roadmap creation — all 34 requirements mapped*
