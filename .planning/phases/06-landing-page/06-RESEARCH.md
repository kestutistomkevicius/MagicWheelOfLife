# Phase 6: Landing Page - Research

**Researched:** 2026-03-15
**Domain:** React landing page — public route, Intersection Observer animations, SEO meta tags, reusing Recharts components with static data
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Hero section**
- Tone: coaching/aspirational — "Design your best life" direction (not functional/descriptive, not problem-first)
- Layout: warm gradient background, split layout — headline + subline + CTAs on the left, live WheelChart preview on the right
- Primary CTA: "Start your wheel →" links to `/auth` (signup)
- Secondary CTA: ghost/outline button "See how it works" anchors to the features section
- Brand: wordmark only — "JustAWheelOfLife" plain text, no icon/logo for MVP (brand locked at Phase 7)

**Feature showcase**
- Format: live demo — embed real WheelChart and ComparisonChart components with static/seeded data (read-only)
- Features highlighted (in order): Wheel scoring, Snapshot comparison, Action items
- Layout: alternating left/right rows on desktop, stacked on mobile
- Section intro: title + 1–2 sentence description before the feature rows
- Action items visualization: styled static checklist card (HTML/Tailwind mockup, not embedded component)

**Social proof / testimonials**
- 3 placeholder testimonials with coaching-adjacent personas (life coach, professional, student)
- Layout: 3 cards in a row on desktop, stacked on mobile
- Each card: quote + name + role + initials avatar (colored circle with initials — no AI-generated photos, no external image service)
- Section headline: "What people are saying"

**Pricing section**
- Two columns: Free ($0/mo) and Premium ($5/mo)
- Tier gate: wheel count only — Free = 1 wheel; Premium = unlimited wheels
- Shared features checked on both sides; "Unlimited wheels" as Premium differentiator; "More coming soon" under Premium
- Premium CTA: disabled button labeled "Coming soon" (Stripe not wired yet)
- Free CTA: "Start free →" links to `/auth`
- No "recommended" highlight on either tier

**Overall page structure**
- Nav → Hero → Feature showcase → Social proof → Pricing → Final CTA → Footer
- Nav: wordmark on left, "Sign in" text link + "Start free →" primary button on right
- Final CTA section: closing headline + "Start your wheel →" button
- Footer: copyright + Privacy Policy link + Terms of Service links (placeholder stub pages)
- No additional nav links

**Routing behavior**
- `/` unauthenticated → landing page
- `/` authenticated → redirect to `/wheel` immediately
- `App.tsx` update: remove `<Navigate to="/wheel" replace />` for `/`, add public landing page route outside ProtectedRoute

**Scroll behavior**
- Subtle fade-in animation on scroll (Intersection Observer API — no animation library)

**Responsive design**
- Fully responsive: mobile + desktop
- Mobile: all sections stack vertically; hero is full-width centered text + chart below
- Desktop: alternating left/right feature layout, 3-column testimonials, 2-column pricing

**SEO / meta tags**
- Page title: "JustAWheelOfLife — Wheel of Life Self-Assessment Tool"
- Meta description: "Score your life areas, set goals, and track progress with the Wheel of Life. Free to start."
- Open Graph: static 1200x630 PNG placeholder image (wordmark + tagline on warm background)

**Analytics**
- Plausible Analytics script stub — commented-out `<script>` tag in `index.html` with placeholder `data-domain`

### Claude's Discretion
- Exact warm gradient colors for hero (must stay within warm/earthy palette established in Phase 1)
- Specific headline copy and subline wording (within coaching/aspirational tone)
- Exact testimonial names, quotes, and personas
- Testimonial card styling details
- Loading/animation timing for scroll fade-in
- Exact feature row copy (titles and descriptions)
- WheelChart sample data for the hero preview (use seeded free-tier data or a static prop)

### Deferred Ideas (OUT OF SCOPE)
- Multi-language / i18n
- Blog
- Referral system
- Email notifications/reminders
- Brand name configurable in settings
- Admin area
- Configurable color palettes (theme system)
- A/B testing
- Full analytics setup
- Privacy Policy / Terms of Service (real legal copy)
- Apple OAuth
- Password strength enforcement + email confirmation
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LAND-01 | Public landing page with hero section: value proposition and a primary CTA ("Start your wheel" → signup) | Route setup in App.tsx, LandingPage component with hero section, WheelChart embedded with static data |
| LAND-02 | Landing page includes a feature showcase section (screenshots or animated preview) | WheelChart + ComparisonChart reused with static prop data, alternating layout, Intersection Observer fade-in |
| LAND-03 | Landing page includes a social proof section (placeholder testimonials) | Static testimonial data array, 3-card grid layout, initials avatar pattern |
| LAND-04 | Landing page includes a pricing section showing free vs premium tier differences | Two-column pricing card layout, feature checklist, disabled "Coming soon" CTA |
</phase_requirements>

---

## Summary

Phase 6 is a pure frontend concern — no new Supabase tables, no new hooks, no data fetching from the database. The landing page is a single public React component at `/` that reuses existing `WheelChart` and `ComparisonChart` components fed with hardcoded static data. The only structural complexity is the routing change: the current `App.tsx` redirects `/` inside `ProtectedRoute`, so it must be restructured to expose `/` as a public route and handle the "authenticated user visits `/`" case by redirecting them to `/wheel`.

All decisions are locked. The research focus is confirming the right implementation patterns for: (1) routing restructure without breaking existing routes, (2) Intersection Observer scroll animation as a custom hook, (3) SEO meta injection with React (no external library since no SSR), and (4) reusing Recharts charts with static data safely.

No new npm packages are needed for this phase. Intersection Observer is native browser API available in all supported browsers. React Helmet/react-helmet-async would be the typical approach for meta tags, but since this is a SPA with Vite and only one page needing custom meta, updating `index.html` directly is simpler and fully sufficient for Phase 6 (the dynamic title change from inside React is a minor enhancement — Vite's `index.html` approach is good enough for MVP).

**Primary recommendation:** Build a single `src/pages/LandingPage.tsx` with all sections as sub-components in the same file or in `src/pages/landing/` sub-folder, wire it into `App.tsx` as a fully public route, use a `useIntersectionObserver` custom hook for scroll animations, and update `index.html` for SEO meta.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React + TypeScript | 19 / 5.7 | Component rendering | Already in project |
| Tailwind CSS v3 | 3.4 | Styling, responsive layout | Already in project — v3 locked for shadcn compat |
| React Router v7 | 7.5 | Routing (public route at `/`) | Already in project |
| Recharts | 3.8 | WheelChart + ComparisonChart components | Already in project — reused as-is |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui Button | existing | Primary/ghost CTA buttons | All CTAs on the page |
| lucide-react | 0.487 | Check icons in pricing feature list | Already in project |
| Intersection Observer API | native browser | Scroll fade-in | No package needed — native in all modern browsers |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native Intersection Observer | Framer Motion | Framer Motion is overkill for simple fade-in; adds ~100KB; explicitly excluded by user |
| index.html meta update | react-helmet-async | No SSR = meta in index.html is sufficient; react-helmet-async adds complexity for no SEO gain in SPA |
| Inline static data | DB seed data | Landing page must work without auth/Supabase; static data in the component file is the only option |

**Installation:** No new packages required.

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── pages/
│   ├── LandingPage.tsx          # main landing page component
│   ├── PrivacyPage.tsx          # placeholder stub
│   ├── TermsPage.tsx            # placeholder stub
│   └── [existing pages...]
public/
│   └── og-image.png             # 1200x630 OG placeholder image
index.html                       # updated: title, meta description, OG tags, analytics stub
```

All landing page sections can live in `LandingPage.tsx` as internal sub-components (not exported). If the file grows beyond ~350 lines, extracting named section components into `src/pages/landing/` is reasonable, but not required upfront.

### Pattern 1: Routing Restructure — Public Route + Auth-aware Redirect

The current routing puts `/` inside `<ProtectedRoute>`. The restructure moves `/` outside, but still needs to redirect authenticated users to `/wheel`.

**Current App.tsx structure:**
```tsx
<Route element={<ProtectedRoute />}>
  <Route element={<AppShell />}>
    <Route path="/" element={<Navigate to="/wheel" replace />} />  // remove this
    ...
  </Route>
</Route>
```

**New structure:**
```tsx
// PUBLIC: landing page — visible to everyone
<Route path="/" element={<LandingPage />} />
<Route path="/privacy" element={<PrivacyPage />} />
<Route path="/terms" element={<TermsPage />} />
<Route path="/auth" element={<AuthPage />} />

// PROTECTED: app shell — redirects to /auth if unauthenticated
<Route element={<ProtectedRoute />}>
  <Route element={<AppShell />}>
    <Route path="/wheel" element={<WheelPage />} />
    <Route path="/snapshots" element={<SnapshotsPage />} />
    <Route path="/trend" element={<TrendPage />} />
    <Route path="/settings" element={<SettingsPage />} />
    <Route path="*" element={<Navigate to="/wheel" replace />} />
  </Route>
</Route>
```

**Authenticated user at `/` redirect inside LandingPage:**
```tsx
// Inside LandingPage.tsx — redirect authenticated users immediately
export function LandingPage() {
  const { session } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (session) {
      navigate('/wheel', { replace: true })
    }
  }, [session, navigate])

  // session === undefined = still loading (show nothing or spinner)
  // session === null = unauthenticated visitor (show landing page)
  if (session === undefined) return null  // or a minimal spinner
  if (session) return null  // navigating away

  return <LandingContent />
}
```

**Why useEffect redirect (not Navigate component):** The `session` value starts as `undefined` (loading). Using `<Navigate>` conditionally would flash the landing page for authenticated users before redirect. Using `useEffect` ensures the check happens after mount with the resolved session. Consistent with the project's established auth pattern (see STATE.md: "undefined session state (not null) prevents flash-to-auth").

**Pitfall:** If `session === undefined` renders the full landing page, authenticated users see a flash. Return `null` or a minimal loader while `session === undefined`.

### Pattern 2: Intersection Observer Custom Hook (Scroll Fade-in)

No library. Native `IntersectionObserver` — available in all modern browsers. Confidence: HIGH.

```tsx
// src/hooks/useIntersectionObserver.ts
import { useEffect, useRef, useState } from 'react'

export function useInView(threshold = 0.15) {
  const ref = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()  // fire once only
        }
      },
      { threshold }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, inView }
}
```

**Usage on each section:**
```tsx
function FeatureSection() {
  const { ref, inView } = useInView()
  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className={`transition-all duration-700 ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
    >
      ...
    </section>
  )
}
```

**Timing guidance (Claude's discretion):** `duration-700` (700ms) with `translate-y-6` (24px upward travel) is standard for marketing pages — noticeable but not distracting. Hero section should NOT animate (visible on initial load).

### Pattern 3: WheelChart with Static Data

`WheelChart` accepts `data: WheelChartPoint[]` — no hooks, no Supabase calls. Feed static data directly:

```tsx
const HERO_WHEEL_DATA: WheelChartPoint[] = [
  { category: 'Health',        asis: 6, tobe: 9 },
  { category: 'Career',        asis: 7, tobe: 8 },
  { category: 'Relationships', asis: 5, tobe: 8 },
  { category: 'Finance',       asis: 4, tobe: 7 },
  { category: 'Fun',           asis: 3, tobe: 7 },
  { category: 'Growth',        asis: 6, tobe: 9 },
  { category: 'Environment',   asis: 7, tobe: 8 },
  { category: 'Family',        asis: 8, tobe: 9 },
]
```

`ComparisonChart` requires `SnapshotScoreRow[]` arrays — these include `position`, `score_asis`, `score_tobe`, `category_name`, and other DB fields. To avoid importing the database type for pure static data, define minimal compatible objects inline:

```tsx
// Minimal objects compatible with SnapshotScoreRow shape
const SNAP1_SCORES = [
  { category_name: 'Health', score_asis: 5, score_tobe: 8, position: 0 },
  // ...
] as SnapshotScoreRow[]
```

Import `SnapshotScoreRow` from `@/types/database` (already exists in the project).

### Pattern 4: Smooth Scroll to Section Anchor

"See how it works" CTA anchors to `#features` section:

```tsx
// Button using <a> with hash href — works without JS
<Button variant="outline" asChild>
  <a href="#features">See how it works</a>
</Button>
```

For smooth scrolling behavior, add to `index.html` or `src/index.css`:
```css
html {
  scroll-behavior: smooth;
}
```

Or: use React Router `Link` with `hash` prop if on same page — but plain `<a href="#features">` is simpler and correct for this use case.

### Pattern 5: SEO Meta Tags in index.html

Since this is a Vite SPA with no SSR, update `index.html` directly. Social crawlers (Twitter, Facebook, LinkedIn) fetch HTML before JS runs, so static meta tags in `index.html` are the correct approach for MVP.

```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>JustAWheelOfLife — Wheel of Life Self-Assessment Tool</title>
  <meta name="description" content="Score your life areas, set goals, and track progress with the Wheel of Life. Free to start." />

  <!-- Open Graph -->
  <meta property="og:title" content="JustAWheelOfLife — Wheel of Life Self-Assessment Tool" />
  <meta property="og:description" content="Score your life areas, set goals, and track progress with the Wheel of Life. Free to start." />
  <meta property="og:image" content="/og-image.png" />
  <meta property="og:type" content="website" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="JustAWheelOfLife — Wheel of Life Self-Assessment Tool" />
  <meta name="twitter:description" content="Score your life areas, set goals, and track progress with the Wheel of Life. Free to start." />
  <meta name="twitter:image" content="/og-image.png" />

  <!-- Plausible Analytics (activate when domain is set up) -->
  <!-- <script defer data-domain="REPLACE_WITH_DOMAIN" src="https://plausible.io/js/script.js"></script> -->
</head>
```

OG image at `public/og-image.png` — Vite serves `public/` at root, so `/og-image.png` is the correct path. Create a simple placeholder: warm gradient background (matching brand-50/brand-400), wordmark text in dark color. This can be a hand-crafted PNG (800×420 minimum, 1200×630 ideal) or generated via browser canvas as a one-off.

### Pattern 6: Testimonial Card with Initials Avatar

No external image service. Colored circle with initials using Tailwind:

```tsx
function TestimonialCard({ quote, name, role, initials, avatarColor }: TestimonialProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <p className="text-muted-foreground mb-4 italic">"{quote}"</p>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${avatarColor}`}>
          {initials}
        </div>
        <div>
          <p className="font-medium text-sm">{name}</p>
          <p className="text-muted-foreground text-xs">{role}</p>
        </div>
      </div>
    </div>
  )
}
```

Avatar colors from project palette: `bg-brand-400` (amber), `bg-stone-500` (neutral), `bg-blue-400` (cool). These are safe values — `bg-brand-400` is defined in `tailwind.config.ts`, others are Tailwind defaults.

### Pattern 7: Pricing Feature List with Check Icons

Use `lucide-react` `Check` icon (already in project):

```tsx
import { Check } from 'lucide-react'

function FeatureRow({ label, available }: { label: string; available: boolean }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <Check className={`w-4 h-4 ${available ? 'text-brand-500' : 'text-muted-foreground/30'}`} />
      <span className={available ? '' : 'text-muted-foreground/50'}>{label}</span>
    </li>
  )
}
```

### Anti-Patterns to Avoid

- **Importing Supabase or hooks inside LandingPage:** Landing page is public and must render without auth state. Only `useAuth` is acceptable (to check session for redirect). No `useWheel`, `useCategories`, etc.
- **Triggering Recharts ResponsiveContainer before mount:** `ResponsiveContainer` needs a measured parent. Ensure the chart wrapper has a defined height/width — use `h-[400px]` or similar fixed height class. The existing `WheelChart` already uses `height={400}` internally so this is handled.
- **`session === undefined` flash:** Landing page shows during auth loading. Return `null` while `session === undefined` to prevent a flash of the landing page followed by immediate redirect for authenticated users.
- **Smooth scroll + hash navigation conflict:** If React Router intercepts `#features` hash clicks, use `<a>` directly instead of React Router `Link` for same-page anchor scrolling.
- **Tailwind purge of dynamic color classes:** If avatar color classes are built dynamically (e.g. `bg-${color}`), Tailwind will purge them. Use full class names in the static data array (e.g., `'bg-brand-400'`), not dynamic string interpolation.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Scroll animation | Custom CSS keyframes + JS scroll listener | Native `IntersectionObserver` hook | Scroll listeners are janky; `IntersectionObserver` fires off main thread |
| CTA buttons | Custom button HTML | `Button` from `src/components/ui/button.tsx` | Already has correct variants (default, outline, ghost); consistent styling |
| Wheel chart | SVG from scratch | Existing `WheelChart` component | Already built, tested, uses Recharts |
| Comparison chart | New chart component | Existing `ComparisonChart` component | Already built, tested |
| Check icons | Unicode checkmarks or SVG | `lucide-react` `Check` icon | Already in the project |
| Auth state check | Local storage / cookie check | `useAuth()` from existing `AuthContext` | Already handles the three-state (undefined/null/session) pattern |

**Key insight:** This phase is almost entirely composition — no new infrastructure. The main work is layout, copy, and wiring existing pieces together.

---

## Common Pitfalls

### Pitfall 1: Authenticated User Flash
**What goes wrong:** Authenticated user visits `/`. LandingPage renders, shows hero briefly, then `useEffect` fires and redirects to `/wheel`. Visible flash.
**Why it happens:** `session` starts as `undefined` (loading). The render-then-redirect pattern is unavoidable without blocking.
**How to avoid:** Return `null` (or an invisible div) while `session === undefined`. Only render landing page content when `session === null`.
**Warning signs:** Authenticated user sees the hero for ~50-200ms before being redirected.

### Pitfall 2: ComparisonChart Type Mismatch
**What goes wrong:** `ComparisonChart` expects `SnapshotScoreRow[]` from `@/types/database`. Static demo objects missing required fields cause TypeScript errors.
**Why it happens:** `SnapshotScoreRow` has DB fields like `id`, `snapshot_id`, `created_at`, `wheel_id` that the chart component may or may not use internally.
**How to avoid:** Check `ComparisonChart.tsx` — it only uses `category_name`, `score_asis`, `score_tobe`, `position`. Cast static objects with `as SnapshotScoreRow[]` after confirming the used fields are present.
**Warning signs:** TypeScript errors like "Property 'snapshot_id' is missing in type."

### Pitfall 3: Tailwind Class Purging for Dynamic Avatar Colors
**What goes wrong:** Avatar color classes built from data like `avatarColor: 'brand-400'` and applied as `` `bg-${avatarColor}` `` get purged from the production bundle.
**Why it happens:** Tailwind static analysis only keeps classes it sees as complete strings in source files.
**How to avoid:** Use full Tailwind class names in the static testimonial data array: `avatarColor: 'bg-brand-400'`.

### Pitfall 4: Smooth Scroll Not Working
**What goes wrong:** "See how it works" button doesn't scroll to `#features`. Clicks navigate to a new URL path.
**Why it happens:** React Router v7 may intercept hash navigation depending on how the `<a>` is rendered.
**How to avoid:** Use a plain `<a href="#features">` wrapped in `<Button asChild>` — React Router only intercepts `<Link>` components, not native `<a>` tags. Also add `scroll-behavior: smooth` to `html` in `index.css`.

### Pitfall 5: Recharts ResponsiveContainer Height Collapses to Zero
**What goes wrong:** Chart renders invisible (0px height) on the landing page.
**Why it happens:** `ResponsiveContainer` inherits height from its parent. If the parent has no explicit height, it collapses.
**How to avoid:** The existing `WheelChart` already passes `height={400}` to `ResponsiveContainer` — this is an explicit height value, not percentage, so it works fine. No change needed.

### Pitfall 6: ProtectedRoute Still Redirects to /auth for `/` Visitors
**What goes wrong:** Unauthenticated visitors to `/` get sent to `/auth` instead of seeing the landing page.
**Why it happens:** If `/` is accidentally left inside the `<ProtectedRoute>` wrapper in `App.tsx`.
**How to avoid:** Move the `/` route OUTSIDE the `<ProtectedRoute>` element — it must be a sibling, not a child. Double-check the final `App.tsx` structure.

---

## Code Examples

### App.tsx Restructure
```tsx
// Source: based on existing src/App.tsx + React Router v7 docs
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes — no auth required */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/auth" element={<AuthPage />} />

        {/* Protected routes — requires session */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/wheel" element={<WheelPage />} />
            <Route path="/snapshots" element={<SnapshotsPage />} />
            <Route path="/trend" element={<TrendPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/wheel" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
```

### LandingPage Auth-Check Pattern
```tsx
// Source: consistent with existing AuthContext pattern in this project
export function LandingPage() {
  const { session } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (session) {
      navigate('/wheel', { replace: true })
    }
  }, [session, navigate])

  // Do not render while session is resolving or while redirecting
  if (session === undefined || session) return null

  return (
    <>
      <LandingNav />
      <HeroSection />
      <FeatureShowcase id="features" />
      <TestimonialsSection />
      <PricingSection />
      <FinalCTASection />
      <LandingFooter />
    </>
  )
}
```

### Intersection Observer Hook
```tsx
// src/hooks/useInView.ts
import { useEffect, useRef, useState } from 'react'

export function useInView(threshold = 0.15) {
  const ref = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, inView }
}
```

### Hero Gradient (Claude's Discretion — within warm palette)
```tsx
// Tailwind v3 gradient using project brand tokens
// from-brand-50 = #fdf8f0, via-brand-100 = #faefd8, to-surface = #fdf8f0
<section className="bg-gradient-to-br from-brand-50 via-brand-100 to-surface min-h-[90vh] flex items-center">
```

### Pricing Card Layout
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
  {/* Free tier */}
  <div className="rounded-xl border border-border bg-card p-8">
    <h3 className="text-lg font-semibold">Free</h3>
    <p className="text-3xl font-bold mt-2">$0<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
    <ul className="mt-6 space-y-3">...</ul>
    <Button className="w-full mt-8" asChild>
      <a href="/auth">Start free →</a>
    </Button>
  </div>

  {/* Premium tier */}
  <div className="rounded-xl border border-border bg-card p-8">
    <h3 className="text-lg font-semibold">Premium</h3>
    <p className="text-3xl font-bold mt-2">$5<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
    <ul className="mt-6 space-y-3">...</ul>
    <p className="text-xs text-muted-foreground mt-2">More coming soon</p>
    <Button className="w-full mt-8" disabled>Coming soon</Button>
  </div>
</div>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `react-helmet` for meta tags | `react-helmet-async` or `index.html` direct | 2022+ | For SPA with no SSR, `index.html` is simpler; `react-helmet-async` is the React community standard if dynamic meta per route is needed |
| `window.addEventListener('scroll', ...)` | `IntersectionObserver` | 2018+ (widespread) | Scroll listeners run on main thread; `IntersectionObserver` is off-thread and more performant |
| Separate CSS animation files | Tailwind transition utilities | ~2021 | `transition-all duration-700 translate-y-6` replaces custom keyframes for simple fade-up |

**Not needed here:**
- Next.js `<Head>` component: this is a Vite SPA, not Next.js
- `react-helmet-async`: overkill for one landing page with static meta; no route-level meta needed in MVP

---

## Open Questions

1. **OG image creation method**
   - What we know: needs a 1200x630 PNG at `public/og-image.png`; content: wordmark + tagline on warm background
   - What's unclear: how to create it — hand-drawn in Figma/Canva, coded as HTML exported to PNG, or a minimal canvas script
   - Recommendation: Treat as a "create a placeholder file" task in the plan. A simple approach: create a minimal HTML file, screenshot it at 1200x630. Alternatively, the plan task can note that any 1200x630 placeholder PNG in `public/` is sufficient; the real asset comes in Phase 7 branding.

2. **PrivacyPage / TermsPage stub implementation**
   - What we know: footer links to these; they show "Coming soon, check back before launch"
   - What's unclear: whether these need their own files or a single generic `StubPage` component
   - Recommendation: A single `StubPage.tsx` with a `title` prop, reused at both `/privacy` and `/terms`. Minimal implementation, no navigation — just a heading and "Coming soon" paragraph.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.1 + @testing-library/react 16 |
| Config file | `vite.config.ts` (inline `test` block) |
| Quick run command | `npm test -- --run src/pages/LandingPage.test.tsx` |
| Full suite command | `npm test -- --run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LAND-01 | Unauthenticated visitor sees hero section with "Start your wheel" CTA linking to `/auth` | unit | `npm test -- --run src/pages/LandingPage.test.tsx` | Wave 0 |
| LAND-01 | Authenticated user at `/` is redirected to `/wheel` | unit | `npm test -- --run src/pages/LandingPage.test.tsx` | Wave 0 |
| LAND-01 | `session === undefined` renders null (no flash) | unit | `npm test -- --run src/pages/LandingPage.test.tsx` | Wave 0 |
| LAND-02 | Feature showcase section is present with 3 feature rows | unit | `npm test -- --run src/pages/LandingPage.test.tsx` | Wave 0 |
| LAND-03 | Social proof section shows 3 testimonial cards with quote, name, role | unit | `npm test -- --run src/pages/LandingPage.test.tsx` | Wave 0 |
| LAND-04 | Pricing section shows Free ($0) and Premium ($5) columns with CTA buttons | unit | `npm test -- --run src/pages/LandingPage.test.tsx` | Wave 0 |
| LAND-04 | Premium CTA button is disabled ("Coming soon") | unit | `npm test -- --run src/pages/LandingPage.test.tsx` | Wave 0 |
| LAND-01 | App.tsx: `/` route no longer inside ProtectedRoute (unauthenticated can access) | integration via ProtectedRoute.test | `npm test -- --run src/components/ProtectedRoute.test.tsx` | Exists (extend) |

**Note on mocking:** `useAuth` is already mocked in the existing test suite pattern (see `ProtectedRoute.test.tsx`). `LandingPage.test.tsx` must mock `useAuth` and `useNavigate` the same way.

`WheelChart` and `ComparisonChart` are Recharts-based. They render SVGs that jsdom doesn't fully support. Mock them in landing page tests as done in `WheelPage.test.tsx`:
```tsx
vi.mock('@/components/WheelChart', () => ({
  WheelChart: () => <div data-testid="wheel-chart-mock" />,
}))
```

### Sampling Rate
- **Per task commit:** `npm test -- --run src/pages/LandingPage.test.tsx`
- **Per wave merge:** `npm test -- --run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/pages/LandingPage.test.tsx` — covers LAND-01, LAND-02, LAND-03, LAND-04
- [ ] No new fixtures needed — mocks follow existing `useAuth` mock pattern

---

## Sources

### Primary (HIGH confidence)
- Direct inspection of `src/App.tsx`, `src/components/WheelChart.tsx`, `src/components/ComparisonChart.tsx`, `src/components/ProtectedRoute.tsx`, `src/contexts/AuthContext.tsx` — component APIs confirmed
- Direct inspection of `tailwind.config.ts` — brand color tokens (`brand-50` through `brand-900`, `surface`) confirmed
- Direct inspection of `package.json` — no Framer Motion, no react-helmet-async in dependencies; confirmed no new installs needed
- Direct inspection of `vite.config.ts` — vitest config confirmed: `globals: true`, `environment: jsdom`, `setupFiles: ['./src/test/setup.ts']`
- MDN IntersectionObserver API — widely supported, no polyfill needed for modern browsers

### Secondary (MEDIUM confidence)
- React Router v7 docs pattern — `<Route>` outside `<ProtectedRoute>` for public routes; consistent with existing project structure
- Tailwind v3 documentation — `transition-all`, `duration-700`, `translate-y-*` utility classes for CSS transitions

### Tertiary (LOW confidence)
- None — all claims verified against project source or native browser APIs

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries confirmed present in package.json; no new installs
- Architecture: HIGH — routing pattern confirmed against existing App.tsx; auth pattern confirmed against AuthContext; chart props confirmed against component source
- Pitfalls: HIGH — derived from direct code inspection (session=undefined flash, Tailwind purge, ProtectedRoute nesting)
- Test patterns: HIGH — existing test infrastructure inspected; mocking patterns confirmed from prior phases

**Research date:** 2026-03-15
**Valid until:** 2026-06-15 (90 days — stable libraries, no fast-moving dependencies in this phase)
