# Stack Research: JustAWheelOfLife

**Domain:** Wheel of Life SaaS (React + Supabase — already decided)
**Focus:** Undecided layers: visualization, UI components, forms, testing

---

## Already Decided (do not re-evaluate)

| Layer | Choice |
|-------|--------|
| Frontend | React 18 + TypeScript + Tailwind CSS (Vite) |
| Backend | Supabase (PostgreSQL + Auth + RLS) |
| Hosting | Vercel (frontend) + Supabase Cloud (backend) |

---

## Visualization — Radar / Spider Chart

### Recommendation: **Recharts** ✓ (High confidence)

**Why Recharts over D3:**
- Built specifically for React — uses declarative JSX components, not imperative DOM manipulation
- Has a native `<RadarChart>` + `<Radar>` component — the wheel is achievable with minimal code
- TypeScript support is solid
- Actively maintained, 23k+ GitHub stars
- D3 requires significantly more code and fights React's rendering model — not worth it for this use case

**Why not Victory or Nivo:**
- Victory: smaller ecosystem, less community support
- Nivo: heavier bundle, more opinionated styling, harder to customize with Tailwind

**Caveat:** Recharts' radar chart is a standard polygon spider chart. For a true "wheel" aesthetic (filled circle segments like a pie/donut hybrid), you may need light D3 or custom SVG for the visual polish. Evaluate after first render — Recharts polygon may be sufficient.

**Versions (2025):**
- `recharts@2.x` (stable) — install via `npm install recharts`

---

## UI Components

### Recommendation: **shadcn/ui** ✓ (High confidence)

**Why shadcn/ui:**
- Copy-paste components (you own the code — no dependency lock-in)
- Built on Radix UI primitives — accessible by default (keyboard nav, ARIA, focus traps)
- Tailwind CSS native — works with your existing setup, no style conflicts
- Supports Tailwind v4 in 2025 — uses OKLCH color tokens, `@theme` directive
- Zero runtime overhead — no extra JS bundle shipped

**Components needed from shadcn:**
- `Button`, `Input`, `Label` (auth forms)
- `Slider` (scoring)
- `Dialog` / `Sheet` (modals for snapshot naming, category editing)
- `Tabs` (switching between as-is / to-be views, comparison views)
- `Card` (wheel summary cards, action item lists)
- `Tooltip` (score labels on slider)
- `Badge` (free/premium tier indicator)

**Install pattern:**
```bash
npx shadcn@latest init
npx shadcn@latest add button slider dialog tabs card tooltip badge
```

---

## Forms

### Recommendation: **React Hook Form + Zod** ✓ (High confidence)

**Why React Hook Form:**
- Uncontrolled inputs — minimal re-renders, better performance than controlled state
- Best TypeScript support in the ecosystem
- Works natively with shadcn/ui form components

**Why Zod:**
- TypeScript-first schema validation — infer types from schema, no duplicate type definitions
- Reuse same schema for client validation and any future server-side checks
- `zodResolver` bridges RHF and Zod cleanly

**Versions:**
- `react-hook-form@7.x`
- `zod@3.x`
- `@hookform/resolvers@3.x`

**Use cases in this app:**
- Auth forms (signup, login)
- Wheel creation form (name field)
- Category add/rename form
- Action item form (text + optional deadline)
- Snapshot naming modal

---

## Testing

### Recommendation: **Vitest + React Testing Library** for unit/integration, **Playwright** for E2E (High confidence)

**Vitest (unit/integration):**
- Vite-native — shares config, no separate Jest setup, faster cold start
- Drop-in Jest replacement — same API (`describe`, `it`, `expect`)
- Works with `jsdom` for React component testing
- `@testing-library/react` integrates directly

**React Testing Library:**
- Test behavior, not implementation — aligns with how users interact with the UI
- Pairs with `@testing-library/user-event` for slider interactions, form submissions

**Playwright (E2E):**
- Framework-agnostic, runs real Chromium/Firefox/WebKit
- Critical for testing: auth flow end-to-end, Supabase client interactions, snapshot save/compare flows
- Vitest browser mode with Playwright provider available for component-level browser tests

**Setup:**
```bash
npm install -D vitest @testing-library/react @testing-library/user-event jsdom
npm install -D @playwright/test
```

**Testing strategy:**
- Unit: utility functions (score calculations, date formatting)
- Component: WheelChart render, SliderInput behavior, ActionItem check/uncheck
- E2E: full auth flow, wheel creation → scoring → snapshot → comparison

---

## State Management

### Recommendation: **TanStack Query (React Query)** for server state + minimal `useState`/`useContext` for local UI state (High confidence)

**Why TanStack Query:**
- Supabase realtime doesn't stream full snapshots — you get change events. TanStack Query keeps UI in sync cleanly.
- Built-in caching, background refetch, loading/error states
- Eliminates manual `useEffect` + `useState` for data fetching
- Works cleanly with Supabase client

**What goes where:**
- TanStack Query: wheels, categories, snapshots, action items (server data)
- `useState`: form state (handled by React Hook Form anyway), UI toggles (modal open, active tab)
- `useContext` / Zustand: auth session (from Supabase's `onAuthStateChange`), user tier

**Version:** `@tanstack/react-query@5.x`

---

## Supabase Client Patterns

**Type generation:** Run after every migration:
```bash
supabase gen types typescript --local > src/types/database.ts
```

**Client singleton:** Initialize once in `src/lib/supabase.ts`, import everywhere.

**Auth session pattern:**
```typescript
// In a top-level AuthProvider
supabase.auth.onAuthStateChange((event, session) => {
  setSession(session)
})
```
Watch for race condition: component mounts before `onAuthStateChange` fires — always check `supabase.auth.getSession()` on mount first.

---

## Summary Recommendations

| Layer | Choice | Confidence |
|-------|--------|------------|
| Radar chart | Recharts `<RadarChart>` | High |
| UI components | shadcn/ui (Radix + Tailwind) | High |
| Forms | React Hook Form + Zod | High |
| Unit tests | Vitest + React Testing Library | High |
| E2E tests | Playwright | High |
| Server state | TanStack Query v5 | High |
| Local state | useState + useContext | High |
