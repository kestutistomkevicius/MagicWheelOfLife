# Research Summary: JustAWheelOfLife

**Synthesized from:** STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md

---

## Stack

**Settled decisions (no change):** React + TypeScript + Tailwind + Vite + Supabase + Vercel

**New recommendations:**

| Layer | Choice | Why |
|-------|--------|-----|
| Radar chart | Recharts `<RadarChart>` | React-native, declarative, no D3 fight; sufficient for polygon wheel |
| UI components | shadcn/ui (Radix + Tailwind) | Accessible, own your code, Tailwind v4 compatible |
| Forms | React Hook Form + Zod | Industry standard, TypeScript-first, minimal re-renders |
| Unit/integration tests | Vitest + React Testing Library | Vite-native, Jest-compatible API |
| E2E tests | Playwright | Best for testing full auth → snapshot flows |
| Server state | TanStack Query v5 | Clean Supabase sync without manual useEffect chains |

---

## Table Stakes Features (Competitors Already Have These)

- Radar chart that re-renders in real time as sliders move
- 1–10 scoring per category (universal convention — don't deviate)
- Default 8-category template + blank canvas option
- Persistent user accounts
- View previous assessment history

---

## Differentiators (Our Edge)

- **Named snapshots** — user-controlled point-in-time captures (not just "last saved")
- **Overlay comparison** — two wheels on one chart; no competitor does this cleanly in web
- **Score history table** — precise deltas per category across snapshots
- **Action items with completion tracking** — most wheel tools stop at scoring
- **Trend chart** — most tools show only current state; we show trajectory

---

## Watch Out For (Critical Pitfalls)

1. **RLS is disabled by default** — add `ALTER TABLE ENABLE ROW LEVEL SECURITY` to every migration
2. **Always add `WITH CHECK`** to INSERT/UPDATE policies — missing it allows ownership forging
3. **Never test RLS in SQL Editor** — it bypasses RLS (runs as superuser); always test via client SDK
4. **Snapshot immutability** — `snapshot_scores` must copy values (name, color), not FK to categories; editing categories after a snapshot must not rewrite history
5. **Frontend-only tier gating is bypassable** — enforce free tier wheel limit in RLS INSERT policy, not just React
6. **Index all RLS columns** — `user_id`, `wheel_id`, `snapshot_id` need indexes or policies cause full table scans
7. **Auth session race condition** — resolve session before rendering the app; `undefined` = loading, `null` = unauthenticated

---

## Recommended Build Order

```
1. Auth + Profiles (RLS foundation)
2. Wheels + Categories CRUD
3. Scoring (sliders → live chart)
4. Action Items
5. Snapshots (copy-on-save pattern)
6. Comparison (overlay + score history table)
7. Trend Chart (requires 3+ snapshots)
8. Landing Page
9. Deployment (Vercel + Supabase Cloud)
```

---

## Schema Highlights

- `snapshot_scores` stores **value copies** (not FKs) — immutability guaranteed
- `profiles.tier` ('free' | 'premium') — RLS enforces wheel count limit at DB level
- All tables indexed on their FK columns (user_id, wheel_id, etc.)
- Dev seed: free user + premium user with pre-built wheel and 4+ snapshots
