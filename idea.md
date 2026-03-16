# idea.md — Wheel of Life SaaS Product Vision

*Last updated: 2026-03-14*

## The Problem

People know they want to improve their lives but lack a structured way to:
1. Assess where they actually stand across multiple life areas
2. Define where they want to be
3. Create concrete action steps to close the gap
4. Track whether they're making progress over time

Coaches use the "Wheel of Life" exercise constantly — but typically on paper, whiteboards, or generic spreadsheets. There's no dedicated tool that makes the wheel *persistent, trackable, and actionable*.

## The Insight

The Wheel of Life is one of the most widely used coaching exercises in the world. It's simple enough that anyone can do it alone, but powerful enough that it opens the door to deeper coaching work. This makes it a **natural bridge between self-service and paid coaching**.

A free, high-quality wheel tool attracts individuals → some percentage want help → coaching becomes the monetization layer.

## Target Users

### Persona 1: The Self-Improver
- 25–45, interested in personal development
- Reads self-help content, listens to podcasts
- Wants structure but not necessarily a coach
- **Arrives via**: Google search ("wheel of life tool"), blog content, social media
- **Pays for**: Premium features (history, reminders, multiple wheels)

### Persona 2: The Coaching-Curious
- Feeling stuck in one or more life areas
- Has considered coaching but hasn't committed
- Wants to "see where they stand" before investing
- **Arrives via**: Direct link, blog, coach referral
- **Pays for**: Premium features → eventually coaching sessions

### Persona 3: The Coach
- Life coach, executive coach, therapist, mentor
- Uses the Wheel of Life with clients regularly
- Wants a professional digital tool instead of paper/PDF
- **Arrives via**: Word of mouth, coach communities, directory listing
- **Pays for**: Directory listing, white-label (future)

## Core Value Proposition

**For individuals**: "See your whole life at a glance. Track your growth over time. Take action on what matters."

**For coaches**: "Your clients arrive already assessed. Spend sessions on breakthroughs, not setup."

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + TypeScript + Tailwind CSS | Best charting ecosystem, Claude Code's strongest output |
| Backend | Supabase (managed PostgreSQL + auto-generated APIs) | Eliminates custom API layer, auth built-in, open-source |
| Auth | Supabase Auth (email + Google/Apple social login) | 50K MAU free, no separate provider needed |
| Database | Supabase-managed PostgreSQL with RLS | Same Postgres everywhere, no vendor lock-in |
| Hosting (frontend) | Vercel | Git-push deploys, preview URLs, global CDN |
| Hosting (backend) | Supabase Cloud | Database, auth, storage, edge functions — one platform |
| Future API | .NET 10 (C#) | Only if logic outgrows Edge Functions (AI features, batch processing) |

See `decisions.md` DEC-001 for full evaluation of alternatives.

## Feature Set by Phase

### Phase 1 — MVP (Validate the tool)
| Feature | Purpose |
|---|---|
| User registration + secure login (Supabase Auth) | Data persistence, return visits |
| Create wheel with custom categories | Core functionality |
| Default 8-category template | Reduce friction for new users |
| Score categories (as-is 1–10, to-be 1–10) | The assessment itself |
| Action items per category (max 7, free text, optional deadline) | Bridge from insight to action |
| Save snapshots | Enable progress tracking |
| Side-by-side snapshot comparison | Visualize change |
| Historical trend chart (3+ snapshots) | Long-term motivation |
| Landing page with value proposition | Conversion |
| Deploy on Vercel + Supabase Cloud | Production-ready from day one |

### Phase 2 — Growth (Validate the funnel)
| Feature | Purpose |
|---|---|
| Free / Premium tier gating ($5–9/mo) | Revenue from day one of growth phase |
| Blog with life goals content | SEO, thought leadership, trust |
| Email list (opt-in, easy opt-out) | Nurture leads |
| Email nudge reminders | Drive re-engagement and re-assessment |
| Calendar reminder integration | Habit formation |
| "Popular categories" suggestions (20+ users) | Social proof, discovery |
| AI SMART goal check on action items | Differentiation |
| A/B domain testing | Optimize brand/positioning |

### Phase 3 — Scale (Expand reach)
| Feature | Purpose |
|---|---|
| Advanced analytics & insights | Premium differentiation |
| Mobile-optimized layout | Broader reach |
| API for integrations | Platform play |
| Social sharing (wheel image export with branding) | Organic growth |

### Phase 4 — Coach Platform (Two-sided value)
| Feature | Purpose |
|---|---|
| Coach directory (coaches pay monthly listing fee) | Monetization layer 2 |
| Coach dashboard (view client wheels with consent) | Coach value prop |
| Coach referral attribution (UTM / referral codes) | Track coach-driven signups |
| White-label for coaches | Higher-ticket revenue |

## Monetization Strategy

### Revenue Streams (phased)

**Stream 1 — Premium subscriptions ($5–9/mo) — from Phase 2**
- Free tier: 1 wheel, 1 snapshot, 3 action items per category. No login required to try, login to save.
- Premium tier: unlimited wheels, full history, reminders, snapshot comparisons, blog content.
- Subscriptions introduced alongside growth features — not deferred to Phase 3.
- Target: convert 3–5% of free users.

**Stream 2 — Coach directory listings ($29–49/mo) — Phase 4**
- Coaches pay a flat monthly fee to appear in an in-app directory
- Coaches link to their own booking system (Calendly, Acuity, etc.) — no in-app scheduling
- No transaction fee, no commission — simple and predictable for coaches
- Only introduce once there is a meaningful user base to offer coaches
- ⚠️ OPEN: Should coaches get analytics on how many users clicked their profile?

**Stream 3 — White-label / embedded tool (Phase 4, pricing TBD)**
- Coaches embed a branded version of the wheel on their own website
- Higher price point ($99–199/mo?) — replaces their current paper/PDF workflow entirely
- Includes coach dashboard with client management

### Why NOT a full marketplace
Building a two-sided marketplace (with scheduling, payments, reviews, disputes) is a product in itself. It introduces massive complexity and the chicken-and-egg bootstrapping problem. The coach directory model is simpler:
- Coaches pay for visibility, not transactions
- No payment processing between coach and client
- No scheduling infrastructure
- No review/rating system to moderate (initially)
- Coaches manage their own client relationships

### Monetization sequence
1. Launch free MVP → build user base → prove the tool has retention
2. Introduce premium tier in Phase 2 → prove people will pay for progress tracking
3. Grow organically with blog, SEO, email → build a user base worth selling access to
4. Open coach directory in Phase 4 → prove coaches will pay for leads
5. Offer white-label → prove coaches want the tool on their own site

Each step validates the next. Don't skip ahead.

## Growth & Marketing Plan

### Organic (Phase 1–2)
- SEO blog content: "how to use wheel of life", "life assessment tools", "personal development exercises"
- Free tool as lead magnet (no login required to try, login to save)
- Social sharing of wheel results (image export with branding)
- Email nurture sequence for registered users

### Coach network (Phase 4)
- Each listed coach becomes a distribution channel — they send clients to the tool
- Coach referral tracking (UTM or unique links)
- Coaches share the tool in their own marketing

### Paid (Phase 3+, if unit economics work)
- Google Ads on "wheel of life" and coaching-related terms
- Retargeting users who created a wheel but didn't subscribe

## Key Assumptions to Validate

| # | Assumption | How to validate | Phase |
|---|---|---|---|
| 1 | People want a digital wheel of life tool | Landing page signups + first 50 users | 1 |
| 2 | Users return to update their scores | Retention metrics (30-day return rate) | 1 |
| 3 | Action items drive engagement beyond one-time use | Track action item creation and completion | 1 |
| 4 | Premium features justify $5–9/mo | Conversion rate from free to paid | 2 |
| 5 | A percentage of users want coaching | Add "find a coach" CTA, measure clicks | 3 |
| 6 | Coaches will pay for directory listing | Outreach to 10 coaches, gauge interest | 4 |

## Competitive Landscape

| Competitor | What they do | Our edge |
|---|---|---|
| Generic PDF/printable wheels | One-time exercise, no tracking | Persistent, trackable, actionable |
| Spreadsheet templates | Functional but ugly, no visualization | Beautiful wheel visualization, progress comparison |
| Coaching platforms (BetterUp, CoachAccountable) | Full coaching management | We're lightweight — assessment-first, coaching-optional |
| Life assessment apps (various) | Often too broad, not wheel-specific | Focused on the single most popular coaching exercise |

## Open Questions

- ⚠️ OPEN: Brand name — Evolve360, LifeCompass, or MyLifeWheel?
- ⚠️ OPEN: Should the free tier require login, or allow anonymous wheel creation with login-to-save?
- ⚠️ OPEN: Image export of wheel for social sharing — Phase 1 or Phase 2?
- ⚠️ OPEN: Multi-language support — English only for MVP, or plan for i18n from the start?
- ⚠️ OPEN: Coach referral attribution model — UTM links or built-in referral codes?
- ⚠️ OPEN: Data residency considerations for EU users (GDPR)? Supabase offers EU regions.
- ⚠️ OPEN: Vercel Pro ($20/mo) needed once commercial — budget in Phase 2.
- ⚠️ OPEN: When does .NET 10 API layer become necessary? Define trigger criteria.
