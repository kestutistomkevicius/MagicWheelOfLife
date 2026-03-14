# JustAWheelOfLife

## What This Is

JustAWheelOfLife is a persistent, trackable Wheel of Life SaaS tool. Users create custom life-area wheels, score each area (as-is and to-be) using sliders, define checkable action items, save manual snapshots, and track their progress over time through visual comparisons and trend charts. The tool serves individuals who want structured self-improvement and coaches who want to digitize their assessment workflow.

## Core Value

The wheel is always there when you return — you can see where you stood, where you are now, and take action on the gap.

## Requirements

### Validated

(None yet — ship to validate)

### Active

**Authentication**
- [ ] User can register with email and password
- [ ] User can log in and stay logged in across sessions
- [ ] User can log out
- [ ] Dev environment has seeded users (free tier and premium tier) for local testing

**Wheel**
- [ ] User can create a wheel from the default 8-category template or a blank canvas
- [ ] User can add, rename, and remove categories (3–12 range) with a warning if snapshots already exist
- [ ] User can score each category (as-is and to-be) using a 1–10 slider
- [ ] Free tier: 1 wheel. Premium tier: unlimited wheels.

**Action Items**
- [ ] User can add up to 7 action items per category (free text, optional deadline)
- [ ] User can check off action items as complete

**Snapshots**
- [ ] User can manually save a named snapshot of their current wheel state
- [ ] User can compare any two snapshots: overlay view (two wheels with different colors) + score history table for a selected category
- [ ] User can view a trend chart for their scores (both all-categories overview and single-category detail; see DEC-005)

**Landing Page**
- [ ] Landing page with a clear value proposition and a single CTA: "Start your wheel" → drives signup

**Deployment**
- [ ] Production deploy on Vercel (frontend) + Supabase Cloud (backend/database)

### Out of Scope

- Image export of wheel — deferred to Phase 2 (no viral loop needed until user base exists)
- Coach dashboard / client management — Phase 4 (two-sided platform)
- Coach directory listing — Phase 4
- White-label — Phase 4
- Premium subscription gating (Stripe) — Phase 2 (build it first, monetize second)
- Email reminders / nudges — Phase 2
- AI SMART goal check on action items — Phase 2
- Social sharing — Phase 2/3
- Mobile-optimized layout — Phase 1 stretch goal
- Multi-language / i18n — deferred (English-only for MVP)
- Anonymous/guest wheel creation — rejected (login required; simpler data model)

## Context

- Solo founder with .NET background; no prior frontend experience — Claude owns all frontend code.
- Stack is decided: React + TypeScript + Tailwind CSS (Vite) + Supabase + Vercel. See `decisions.md` DEC-001.
- The Wheel of Life is one of the most widely used coaching exercises globally — it's a known concept with SEO demand. No need to invent the category.
- Growth model: free tool as lead magnet → premium subscription → coach directory (phased).
- Local dev is fully offline via Supabase CLI + Docker. No cloud accounts needed during build.
- Dev auth: seed a pre-created user in local Supabase (free and premium variants) for frictionless development.

## Constraints

- **Tech stack**: React + TypeScript + Tailwind + Supabase — no deviations without logging in decisions.md
- **Timeline**: Phase 1 MVP first; revenue features strictly Phase 2+
- **Hosting budget**: Vercel Hobby (free, non-commercial during build). Upgrade to Pro ($20/mo) at Phase 2 launch.
- **Solo build**: No team. Architecture must be simple enough for one person to maintain.
- **Database**: Every table requires RLS enabled with explicit policies — no exceptions.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Supabase-centered stack over .NET full-stack | Solo founder, MVP speed over architectural purity | — Pending |
| Login required (no anonymous mode) | Simpler data model; guest session complexity not justified for MVP | — Pending |
| Slider scoring (1–10) | Tactile, visual, works on touch — better UX than number inputs | — Pending |
| Checkable action items | Completion state drives engagement; pure free-text loses momentum | — Pending |
| Manual snapshot saves only | User controls when a moment is captured; avoids auto-save clutter | — Pending |
| Category edits allowed with warning | Flexibility wins over strict immutability; user warned about comparison impact | — Pending |
| Snapshot comparison: overlay + score history table | Overlay gives instant visual diff; table gives precise numbers per category | — Pending |
| Trend chart: both views (all categories + single category detail) | Start with both; revert to single-category if overwhelming. See DEC-005 | — Pending |
| Brand name: JustAWheelOfLife (working title) | Literal, no-pretense placeholder; lock in final brand at Phase 2 launch | — Pending |

---
*Last updated: 2026-03-14 after initialization*
