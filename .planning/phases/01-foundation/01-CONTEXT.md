# Phase 1: Foundation - Context

**Gathered:** 2026-03-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Project scaffold, authentication, and dev seed data. Developers can clone, run `supabase start` + `npm run dev`, and log in as a seeded user. Authenticated users reach the app shell. Nothing visible to end users yet — this phase makes the project runnable. All wheel/scoring/snapshot features are separate phases.

</domain>

<decisions>
## Implementation Decisions

### App Shell Layout
- Left sidebar navigation
- Sidebar items: My Wheel, Snapshots, Trend, Settings — all wired to real routes with placeholder pages from day 1 (not disabled, not grayed — just placeholder content)
- Authenticated placeholder content: blank shell + "Coming soon" text on non-wheel routes
- Color/branding direction: warm/earthy palette (not neutral gray, not dark theme)
- Layout: sidebar on left, content area on right — standard SaaS dashboard shape

### Routing
- Unauthenticated visitors hitting any route → redirect to `/auth`
- After successful login → redirect to `/wheel`
- All 4 nav routes scaffolded: `/wheel`, `/snapshots`, `/trend`, `/settings`

### Auth UX
- Single `/auth` page with a toggle between "Sign in" and "Create account" modes
- OAuth buttons: Google only (Apple omitted entirely — see Apple OAuth decision)
- Auth errors: inline form errors (below field or below submit button), not toasts or banners

### Apple OAuth
- Deferred to Phase 7 (production launch)
- No Apple Developer account exists; Apple OAuth requires cloud callback URLs (rejects localhost)
- Apple sign-in button NOT included in Phase 1 UI — omit entirely, add back in Phase 7
- Phase 1 supports: email/password + Google OAuth only

### Seed Users
- **Free-tier user**: `free@test.com` / `test123`
  - Persona: generic mid-career professional
  - Wheel: default 8 categories (Health, Career, Relationships, Finance, Fun & Recreation, Personal Growth, Physical Environment, Family & Friends)
  - Scores: realistic mid-range (4–7 range), some to-be scores higher than as-is
  - Action items: mix of open, completed, and deadline-bearing items
- **Premium-tier user**: `premium@test.com` / `test123`
  - Wheel: same 8 categories, 4+ snapshots with meaningfully different scores
  - Score story: **mixed trajectory** — some categories improve across snapshots (e.g., Career up), others decline (e.g., Relationships down). Tests both directions in overlay comparison simultaneously.
  - Snapshots spaced to tell a believable time story (not all the same values)

### Claude's Discretion
- Exact warm/earthy color values (Tailwind palette choices within the warm/earthy direction)
- Specific sidebar width, typography, spacing
- Loading skeleton / spinner during auth session resolution
- Exact placeholder copy for non-wheel routes
- Specific score values for seed data (as long as they tell the mixed-trajectory story)
- Settings page placeholder content

</decisions>

<specifics>
## Specific Ideas

- Auth page toggle pattern: "Sign in" / "Create account" tabs or toggle — similar to how Vercel/Linear handle it (one URL, one page, mode switch)
- The warm/earthy palette should feel coaching/wellness-adjacent, not sterile SaaS gray
- Seed data scores should tell a story visible at a glance in the overlay chart — Career clearly up, Relationships clearly down across 4+ snapshots

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- None yet — greenfield project. No existing components, hooks, or utilities.

### Established Patterns
- Stack decided: React + TypeScript + Tailwind CSS + Vite + Supabase + shadcn/ui (Radix + Tailwind)
- RLS required on every table migration — must include `WITH CHECK` on INSERT/UPDATE policies
- Auth session handling: undefined = loading, null = unauthenticated, session object = authenticated

### Integration Points
- Supabase Auth → React context/provider → protected route wrapper
- All subsequent phases (Wheel, Snapshots, Trend) render inside the app shell scaffolded here

</code_context>

<deferred>
## Deferred Ideas

- Apple OAuth (AUTH-03) — deferred to Phase 7 (production launch). No Apple Developer account; Apple rejects localhost callbacks anyway.

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-14*
