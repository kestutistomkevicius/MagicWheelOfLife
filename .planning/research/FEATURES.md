# Features Research: JustAWheelOfLife

**Domain:** Wheel of Life / Life Assessment SaaS
**Sources:** wheeloflife.noomii.com, wheeloflife.pro, wheeloflife.io, existing coaching tools, App Store apps

---

## Table Stakes (Must Have — Users Expect These)

### Visualization
- **Radar/spider chart** rendering the wheel — this IS the product. Must look good.
- **Color-coded segments** — each category has a distinct color or the filled area is colored
- **Score labels** visible on or around the chart (what score each segment is at)
- **As-is vs to-be** shown simultaneously or togglable — users want to see the gap

### Scoring
- **1–10 scale per category** — universal convention; changing it confuses users who know the exercise
- **Immediate visual feedback** — chart updates as user drags the slider (real-time re-render)
- **Save/persist scores** — scores must survive page refresh

### Categories
- **Default template** — new users need a starting point; blank canvas causes drop-off
- **Standard 8 areas** are the industry default: Health, Career, Relationships, Finance, Fun & Recreation, Personal Growth, Physical Environment, Family & Friends
- **Add / rename / remove** — coaches and self-improvers customize to their situation

### Account & Data
- **User accounts with persistence** — the core value prop over a paper exercise
- **Multiple assessment points over time** — at minimum "save current state" for later reference
- **View history** — some form of "here's what I scored before"

### Onboarding
- **Immediate value on first use** — user should see a wheel within 2 minutes of signup
- **Low-friction setup** — template start reduces time-to-value vs blank canvas

---

## Differentiators (Competitive Advantage)

### History & Progress
- **Named snapshots with dates** — richer than generic "last saved" — user can name check-ins ("Q1 review", "After therapy month")
- **Side-by-side snapshot comparison** — most tools show only current state; comparison is where insight happens
- **Trend chart over time** — 3+ snapshots → "I've been stuck on Career for 6 months" is a powerful realization
- **Score delta indicators** — show +/- change between snapshots per category

### Action Items
- **Per-category action items** — bridges assessment → action, which most wheel tools skip entirely
- **Completion tracking (checkboxes)** — creates engagement loop; users return to check off items
- **Deadlines on action items** — adds accountability without requiring a full task manager

### User Experience
- **Smooth slider interaction** — the tactile feel of dragging a score matters more than it seems
- **Overlay comparison view** — two wheels on the same canvas with color transparency is more powerful than side-by-side

### Tier Gating
- **Free tier with real value** — 1 wheel with full functionality drives signups; gate the second wheel
- **Visible upgrade prompt** — when user tries to create a second wheel, show clear value of premium

---

## Anti-Features (Deliberately Exclude in Phase 1)

| Feature | Why to Exclude |
|---------|---------------|
| Anonymous/guest wheels | Guest session complexity; saved wheels require auth anyway |
| Coaching client dashboard | Two-sided platform — Phase 4 problem |
| Real-time collaboration | High complexity, not core to individual self-assessment |
| In-app coaching booking | We're not a marketplace |
| Social sharing of wheel image | Phase 2 — needs polished export; premature for MVP |
| Email reminders | Phase 2 — needs user base first to validate engagement loop |
| AI SMART goal suggestions | Phase 2 — requires LLM integration; defer until core works |
| PDF export | Phase 2 — image export is the right primitive |
| Multiple preset templates | One good template + blank is enough; more choice = more friction |
| Review / rating system | Coach platform concern, Phase 4 |

---

## Competitive Landscape Observations

**wheeloflife.noomii.com:**
- Free tool, no account required for basic use
- CTA-first: captures lead generation for coaches
- Assessment results page has coach referral CTA

**wheeloflife.pro:**
- WordPress plugin model (coach-facing, not user-facing SaaS)
- Coaches embed on their site; users fill out, leads captured
- No persistent user accounts for self-improvers

**wheeloflife.io:**
- Coaching tool with client tracking
- More sophisticated: session notes, goal planning, 30-day action plans

**App Store apps (iOS):**
- Best-in-class offer: customizable categories, PDF export, goal planning
- Gap: no web companion, no coach integration

**Our edge:** Persistent, trackable, action-item-linked web SaaS that works as both a self-service tool AND a future coaching platform layer. None of the above do all three well.

---

## Feature Dependencies

| Feature | Depends On |
|---------|-----------|
| Snapshot comparison | Snapshots (SNAP-01/02) |
| Trend chart | 3+ snapshots |
| Score history table | Snapshot comparison + category selection |
| Premium tier gating | Auth (tier stored on user profile) |
| Action item deadlines | Action item creation |
| Category edit warning | Snapshots existing |
