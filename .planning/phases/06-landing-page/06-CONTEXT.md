# Phase 6: Landing Page - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

A public landing page at `/` that communicates product value and drives unauthenticated visitor sign-ups. Covers hero section with CTA, feature showcase, social proof (placeholder testimonials), and pricing section. The landing page is a standalone public route — existing authenticated app routes (`/wheel`, `/snapshots`, etc.) are unchanged.

</domain>

<decisions>
## Implementation Decisions

### Hero section
- Tone: coaching/aspirational — "Design your best life" direction (not functional/descriptive, not problem-first)
- Layout: warm gradient background, split layout — headline + subline + CTAs on the left, live WheelChart preview on the right
- Primary CTA: "Start your wheel →" links to `/auth` (signup)
- Secondary CTA: ghost/outline button "See how it works" anchors to the features section
- Brand: wordmark only — "JustAWheelOfLife" plain text, no icon/logo for MVP (brand locked at Phase 7)

### Feature showcase
- Format: live demo — embed real WheelChart and ComparisonChart components with static/seeded data (read-only)
- Features highlighted (in order): Wheel scoring, Snapshot comparison, Action items
- Layout: alternating left/right rows on desktop, stacked on mobile
- Section intro: title + 1–2 sentence description before the feature rows (e.g., "Everything you need to take stock, and take action.")
- Action items visualization: styled static checklist card (HTML/Tailwind mockup, not embedded component) — shows category name + 3–4 items with mixed checked/unchecked state

### Social proof / testimonials
- 3 placeholder testimonials with coaching-adjacent personas (life coach, professional, student)
- Layout: 3 cards in a row on desktop, stacked on mobile
- Each card: quote + name + role + initials avatar (colored circle with initials — no AI-generated photos, no external image service needed)
- Section headline: "What people are saying"

### Pricing section
- Two columns: Free ($0/mo) and Premium ($5/mo)
- Tier gate: wheel count only — Free = 1 wheel; Premium = unlimited wheels. All other features (scoring, snapshots, trend charts, action items) available to both tiers
- Feature list: show shared features checked on both sides, plus "Unlimited wheels" as the Premium differentiator. Note "More coming soon" under Premium to signal future value
- Premium CTA: disabled button labeled "Coming soon" (Stripe not wired yet)
- Free CTA: "Start free →" links to `/auth`
- No "recommended" highlight on either tier — neutral presentation for MVP

### Overall page structure
- Minimal but polished: Nav → Hero → Feature showcase → Social proof → Pricing → Final CTA → Footer
- Nav: wordmark on left, "Sign in" text link + "Start free →" primary button on right
- Final CTA section: closing headline (e.g., "Ready to see your life clearly?") + "Start your wheel →" button
- Footer: copyright + Privacy Policy link + Terms of Service links (both link to placeholder stub pages)
- Privacy Policy and Terms of Service: placeholder stub pages ("Coming soon, check back before launch")
- No additional nav links (no About, Blog, etc.)

### Routing behavior
- `/` unauthenticated → landing page
- `/` authenticated → redirect to `/wheel` immediately
- Current `App.tsx` needs update: remove the `<Navigate to="/wheel" replace />` default for `/` and add a public landing page route

### Scroll behavior
- Subtle fade-in animation on scroll (Intersection Observer API — no animation library)
- Sections animate into view as user scrolls down

### Responsive design
- Fully responsive: mobile + desktop
- Mobile: all sections stack vertically; hero is full-width centered text + chart below
- Desktop: alternating left/right feature layout, 3-column testimonials, 2-column pricing

### SEO / meta tags
- Page title: "JustAWheelOfLife — Wheel of Life Self-Assessment Tool"
- Meta description: "Score your life areas, set goals, and track progress with the Wheel of Life. Free to start."
- Open Graph: static 1200x630 PNG placeholder image (wordmark + tagline on warm background)

### Analytics
- Plausible Analytics script stub — added as a commented-out script tag in `index.html` with a placeholder `data-domain` attribute. Not active until account is set up. Easy to swap for GA4. No cookie banner needed when activated (cookieless).

### Claude's Discretion
- Exact warm gradient colors for hero (must stay within warm/earthy palette established in Phase 1)
- Specific headline copy and subline wording (within coaching/aspirational tone)
- Exact testimonial names, quotes, and personas
- Testimonial card styling details
- Loading/animation timing for scroll fade-in
- Exact feature row copy (titles and descriptions)
- WheelChart sample data for the hero preview (use seeded free-tier data or a static prop)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Button` (src/components/ui/button.tsx): variants include `default`, `outline`, `ghost`, `secondary`, `link` — use `default` for primary CTA, `outline` for secondary "See how it works" CTA
- `WheelChart` (src/components/WheelChart.tsx): can be embedded in hero and feature showcase with static category/score props
- `ComparisonChart` (src/components/ComparisonChart.tsx): can be used in feature showcase for snapshot comparison row
- CSS variables in `src/index.css`: `--primary`, `--secondary`, `--muted`, `--background`, etc. — warm/earthy palette already defined, landing page uses same tokens

### Established Patterns
- shadcn/ui components (Radix + Tailwind v3) — all UI components follow this pattern
- Tailwind class-based styling, no CSS modules
- React Router: routes defined in `src/App.tsx` — landing page needs a new public `<Route path="/" element={<LandingPage />} />` outside the `<ProtectedRoute>` wrapper
- TypeScript + tsx — all components follow this convention

### Integration Points
- `src/App.tsx`: Add public landing page route at `/`. Move the `<Navigate to="/wheel" replace />` inside the ProtectedRoute so only authenticated users default to `/wheel`. Unauthenticated visitors get the landing page.
- `src/pages/AuthPage.tsx`: "Start your wheel →" CTA links here (`/auth`)
- `index.html`: Analytics script stub goes here (commented out)
- `public/`: OG image PNG goes here

</code_context>

<specifics>
## Specific Ideas

- Hero wheel preview: use the existing WheelChart component with static prop data (8 categories, realistic scores) — no backend call needed for the landing page
- The "See how it works" ghost CTA should scroll smoothly to the feature showcase section anchor
- Fade-in animation: use a simple custom hook with Intersection Observer (no Framer Motion, no additional library)
- Testimonial persona 1: life coach. Persona 2: mid-career professional. Persona 3: student/young adult
- Pricing note: "Premium features expanding over time" or similar line below the Premium column to justify the price with future value

</specifics>

<deferred>
## Deferred Ideas

- **Multi-language / i18n** — English-only for MVP (PROJECT.md out-of-scope). Priority languages when added: English, Spanish, Lithuanian. Requires react-i18n or similar.
- **Blog** — Coaching/SEO-focused content (articles about Wheel of Life methodology, self-improvement tips). Separate phase after core product is live. Will need its own route, content management, and potentially a headless CMS.
- **Referral system** — "$1 discount for both parties after new user has been Premium for 3 months." Requires Stripe integration (Phase 2+) and referral tracking.
- **Email notifications/reminders** — Task deadlines and reassessment nudges (v2 ENGAGE-01/02). Phase 2.
- **Brand name configurable in settings** — Allow admin/owner to change the displayed brand name without code changes. Requires a settings/config system.
- **Admin area** — Internal admin panel for managing content, users, config. Future phase.
- **Configurable color palettes (theme system)** — Allow switching between visual themes. Phase 2+ after brand is locked.
- **A/B testing** — Test landing page copy/layout variants. Add after real traffic exists.
- **Full analytics setup** — Activate Plausible (or switch to GA4) with real domain when ready for production traffic.
- **Privacy Policy / Terms of Service (real)** — Replace placeholder stub pages with actual legal copy before Phase 7 production launch.
- **Apple OAuth** — Already deferred to Phase 7 (from Phase 1 context).
- **Password strength enforcement + email confirmation** — v2 auth requirements (AUTH-V2-01, AUTH-V2-02).

</deferred>

---

*Phase: 06-landing-page*
*Context gathered: 2026-03-15*
