# Phase 2: Wheel & Scoring - Research

**Researched:** 2026-03-14
**Domain:** Recharts RadarChart, Supabase schema + RLS, shadcn/ui Slider + Dialog, React state for real-time chart updates
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| WHEEL-01 | User can create a wheel from the default 8-category template | Supabase INSERT into `wheels` + `categories` tables; seed 8 default categories; navigate to wheel view immediately |
| WHEEL-02 | User can create a wheel from a blank canvas (0 categories, add own) | Same INSERT flow with 0 initial categories; category add form inline |
| WHEEL-03 | User can add a category to their wheel (max 12 total) | INSERT into `categories` with count guard; `position` column for ordering |
| WHEEL-04 | User can rename a category; shown a warning if snapshots already exist | UPDATE `categories.name`; check `snapshots` count before mutating; AlertDialog |
| WHEEL-05 | User can remove a category (min 3 total); shown a warning if snapshots already exist | DELETE from `categories`; same snapshot-exists guard as WHEEL-04 |
| WHEEL-06 | Free-tier user is limited to 1 wheel; sees upgrade prompt when attempting to create a second | RLS INSERT policy with SECURITY DEFINER count function + `profiles.tier` column; upgrade prompt UI |
| WHEEL-07 | Premium-tier user can create unlimited wheels | RLS INSERT policy allows if `profiles.tier = 'premium'`; same count function returns true |
| SCORE-01 | User can set an as-is score (1–10) per category via a slider | shadcn Slider on `categories.score_asis` column; controlled React state |
| SCORE-02 | User can set a to-be score (1–10) per category via a slider | shadcn Slider on `categories.score_tobe` column; controlled React state |
| SCORE-03 | Wheel chart updates in real time as the user drags a slider (no save needed to see the visual) | Local React state drives Recharts RadarChart data; Supabase write on slider settle (debounce or onPointerUp) |
</phase_requirements>

---

## Summary

Phase 2 builds the entire wheel experience: the database schema for wheels and categories, the UI to create and manage them, a dual-series radar chart visualization, and slider-based scoring that redraws in real time. The foundation is already in place from Phase 1 — React 19 + TypeScript + Tailwind + shadcn/ui + Supabase client — so this phase adds the first real data tables and the most visually complex feature in the product.

Three distinct technical areas require careful attention. First, the Recharts RadarChart with two overlaid series (as-is and to-be) is the visual centrepiece. The chart must update instantly as sliders move, which means React state is the source of truth for rendering while Supabase writes are debounced or deferred to pointer-up events. Second, the free-tier wheel limit (WHEEL-06) must be enforced in the database via an RLS INSERT policy backed by a SECURITY DEFINER function — a plain subquery on the same table causes infinite recursion in Postgres RLS. Third, tier information (free vs. premium) must live in a `profiles` table, not in `raw_user_meta_data`, because user metadata can be self-modified by authenticated clients and is therefore unsafe for authorization.

**Primary recommendation:** Build schema first (migration with `wheels`, `categories`, `profiles`), then wire the Supabase queries into a custom hook, then build the chart, then add the slider controls. Each step is independently testable.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | 3.x (latest) | RadarChart visualization | Decided in Phase 1 research; React-native, no D3 required |
| @supabase/supabase-js | 2.x (already installed) | Database queries + mutations | Project stack, already installed |
| react | 19.x (already installed) | UI rendering | Project stack |
| tailwindcss | 3.x (already installed) | Styling | Project stack |

### shadcn/ui Components (add in this phase)
| Component | Install Command | Purpose |
|-----------|----------------|---------|
| Slider | `npx shadcn@latest add slider` | As-is / to-be score inputs |
| AlertDialog | `npx shadcn@latest add alert-dialog` | Rename/remove warning when snapshots exist |
| Dialog | `npx shadcn@latest add dialog` | Wheel creation modal (template vs. blank) |

Note: Button, Input, and Label are already installed from Phase 1.

### Recharts Version Decision
Recharts 3.x is the current stable version (3.8.0 as of research date). Recharts 3.x supports React 19. The project uses React 19 (confirmed in `package.json`). Install recharts 3.x directly — no `--legacy-peer-deps` needed for React 19 with recharts 3.x.

**Installation:**
```bash
npm install recharts
npx shadcn@latest add slider alert-dialog dialog
```

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Recharts RadarChart | D3 custom | D3 is far more flexible but requires low-level SVG math; Recharts already decided |
| shadcn Slider | `<input type="range">` | Native range input lacks styling consistency; shadcn Slider matches existing design system |
| shadcn AlertDialog | Custom modal | AlertDialog is purpose-built for destructive confirmations; consistent ARIA behavior |
| profiles.tier column | JWT custom claims | Custom claims require an Edge Function to set on signup; profiles table is simpler and already needed for user display data |

---

## Architecture Patterns

### Recommended Project Structure (additions for Phase 2)
```
src/
├── components/
│   ├── ui/
│   │   ├── slider.tsx        # shadcn Slider (new)
│   │   ├── alert-dialog.tsx  # shadcn AlertDialog (new)
│   │   └── dialog.tsx        # shadcn Dialog (new)
│   ├── WheelChart.tsx        # RadarChart wrapper (new)
│   ├── CategorySlider.tsx    # Single category row: name + two sliders (new)
│   └── CreateWheelModal.tsx  # Template vs. blank selection dialog (new)
├── hooks/
│   ├── useWheel.ts           # Load wheel + categories; create wheel (new)
│   └── useCategories.ts      # Add / rename / remove category mutations (new)
├── pages/
│   └── WheelPage.tsx         # Replace placeholder; orchestrates all Phase 2 UI (update)
├── types/
│   └── database.ts           # Regenerate after migration: wheels, categories, profiles
supabase/
├── migrations/
│   └── YYYYMMDDHHMMSS_wheel_schema.sql  # wheels, categories, profiles tables + RLS
└── seed.sql                  # Extend: INSERT wheels + categories for seed users
```

### Pattern 1: RadarChart with Dual Series (as-is + to-be)
**What:** Two `<Radar>` components inside one `<RadarChart>`, each reading a different `dataKey` from the same data array. Chart data is derived from React state, so slider drags cause instant redraws.
**When to use:** Always for the wheel visualization. `ResponsiveContainer` makes it fill its parent width.
**Example:**
```typescript
// Source: https://recharts.github.io/en-US/api/Radar/
// Source: https://recharts.org/en-US/api/RadarChart
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip
} from 'recharts'

type ChartDataPoint = {
  category: string  // displayed on angle axis
  asis: number      // 1–10
  tobe: number      // 1–10
}

interface WheelChartProps {
  data: ChartDataPoint[]
}

export function WheelChart({ data }: WheelChartProps) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid />
        <PolarAngleAxis dataKey="category" />
        <PolarRadiusAxis domain={[0, 10]} tickCount={6} />
        <Radar
          name="As-Is"
          dataKey="asis"
          stroke="#e8a23a"
          fill="#e8a23a"
          fillOpacity={0.4}
        />
        <Radar
          name="To-Be"
          dataKey="tobe"
          stroke="#4ade80"
          fill="#4ade80"
          fillOpacity={0.15}
        />
        <Legend />
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  )
}
```

**Key configuration:**
- `domain={[0, 10]}` on PolarRadiusAxis — must be explicit; defaults to data range which shifts as scores change
- `outerRadius="70%"` — leaves room for angle axis labels
- Two `<Radar>` elements share the same `data` prop on `<RadarChart>`

### Pattern 2: Real-Time Chart Updates from Sliders
**What:** Local React state drives the chart. Supabase writes are deferred to pointer-up (or debounced) so the DB is not flooded with updates on every drag pixel.
**When to use:** SCORE-03 requirement. Separates visual feedback (instant, local) from persistence (deferred, DB).
**Example:**
```typescript
// WheelPage.tsx — local state is the chart data source
const [categories, setCategories] = useState<CategoryRow[]>(loaded)

const handleScoreChange = (id: string, field: 'score_asis' | 'score_tobe', value: number) => {
  // Update local state immediately → chart redraws
  setCategories(prev =>
    prev.map(c => c.id === id ? { ...c, [field]: value } : c)
  )
}

const handleScoreCommit = async (id: string, field: 'score_asis' | 'score_tobe', value: number) => {
  // Write to Supabase only when slider thumb is released
  await supabase
    .from('categories')
    .update({ [field]: value })
    .eq('id', id)
}

// Chart data derived from state
const chartData = categories.map(c => ({
  category: c.name,
  asis: c.score_asis,
  tobe: c.score_tobe,
}))
```

Slider wires up:
```typescript
<Slider
  min={1} max={10} step={1}
  value={[category.score_asis]}
  onValueChange={([v]) => handleScoreChange(category.id, 'score_asis', v)}
  onValueCommit={([v]) => handleScoreCommit(category.id, 'score_asis', v)}
/>
```

`onValueChange` fires on every drag movement → chart redraws.
`onValueCommit` fires on pointer up → Supabase write.

### Pattern 3: Tier-Safe RLS for Wheel Limit
**What:** A SECURITY DEFINER PostgreSQL function counts existing wheels for the calling user. The INSERT policy calls this function in its WITH CHECK clause, avoiding RLS infinite recursion. A `profiles` table stores tier (not `raw_user_meta_data` which is user-modifiable).
**When to use:** WHEEL-06 + WHEEL-07.
**Example:**
```sql
-- Migration: create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tier text NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'premium')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "profiles: select own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

-- Users can update their own profile (tier changes handled server-side only in practice)
CREATE POLICY "profiles: update own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- Auto-create profile on signup via trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- SECURITY DEFINER function: count wheels without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.count_user_wheels()
RETURNS integer LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT COUNT(*)::integer FROM public.wheels WHERE user_id = (select auth.uid());
$$;

-- wheels table
CREATE TABLE public.wheels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'My Wheel',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.wheels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wheels: select own"
  ON public.wheels FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "wheels: insert own"
  ON public.wheels FOR INSERT
  TO authenticated
  WITH CHECK (
    (select auth.uid()) = user_id
    AND (
      -- premium: unlimited
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = (select auth.uid()) AND tier = 'premium'
      )
      OR
      -- free: max 1 wheel
      public.count_user_wheels() < 1
    )
  );

CREATE POLICY "wheels: update own"
  ON public.wheels FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "wheels: delete own"
  ON public.wheels FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);
```

### Pattern 4: Categories Table Schema
```sql
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wheel_id uuid NOT NULL REFERENCES public.wheels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  score_asis integer NOT NULL DEFAULT 5 CHECK (score_asis BETWEEN 1 AND 10),
  score_tobe integer NOT NULL DEFAULT 5 CHECK (score_tobe BETWEEN 1 AND 10),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Standard ownership policies
CREATE POLICY "categories: select own"
  ON public.categories FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "categories: insert own"
  ON public.categories FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "categories: update own"
  ON public.categories FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "categories: delete own"
  ON public.categories FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);
```

Note: `user_id` is denormalized onto `categories` so RLS policies stay simple (no join to `wheels` needed in policies). Position column allows ordered display without relying on `created_at`.

### Pattern 5: Warning Dialog Before Destructive Category Mutation
**What:** Before renaming or removing a category, check if any snapshots exist for the wheel. If yes, show an AlertDialog. If no, proceed without interruption. The check is a Supabase SELECT count from `snapshots` (Phase 4 table does not exist yet — check count = 0 in Phase 2, always proceed without warning until Phase 4 adds the table).
**When to use:** WHEEL-04, WHEEL-05.
**Example:**
```typescript
// Source: https://ui.shadcn.com/docs/components/alert-dialog
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog'

// In Phase 2: snapshots table does not exist yet — hasSnapshots is always false
// The check is wired up but returns false; Phase 4 activates it.
const [confirmState, setConfirmState] = useState<{
  type: 'rename' | 'remove'
  categoryId: string
  newName?: string
} | null>(null)

const handleRenameRequest = async (categoryId: string, newName: string) => {
  const hasSnapshots = await checkSnapshotsExist(wheelId)
  if (hasSnapshots) {
    setConfirmState({ type: 'rename', categoryId, newName })
  } else {
    await executeRename(categoryId, newName)
  }
}

// AlertDialog is controlled via confirmState !== null
```

### Anti-Patterns to Avoid
- **Storing tier in `raw_user_meta_data`:** Users can self-modify this field via `supabase.auth.updateUser()`. Always store authorization data in a server-side table (`profiles`) with restricted UPDATE policies.
- **Plain subquery in INSERT policy on the same table:** `WITH CHECK ((SELECT COUNT(*) FROM wheels WHERE user_id = auth.uid()) < 1)` causes infinite recursion. Use a SECURITY DEFINER function instead.
- **No `domain` on PolarRadiusAxis:** Without `domain={[0, 10]}`, the axis rescales to the current data range. Scores of 1 will look like 100% fill. Always pin to [0, 10].
- **Calling `supabase.from('categories').update()` on every `onValueChange` event:** This fires dozens of requests per second during drag. Use `onValueChange` for local state only and `onValueCommit` for DB writes.
- **Minimum category count enforced only in UI:** The 3-category minimum (WHEEL-05) should also be checked in the delete handler logic (not just UI disabled state). A check constraint on the DB is not required for this limit, but the mutation function should verify count before executing.
- **Position column gaps after delete:** When deleting a category, compact positions (re-number from 0) to avoid sparse ordering. Or use `ORDER BY position, created_at` to tolerate gaps.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Radar/spider chart | Custom SVG polygon | Recharts RadarChart | SVG math for N-sided polygon at arbitrary radii is non-trivial; Recharts handles all of it |
| Range slider (1–10) | `<input type="range">` with custom CSS | shadcn Slider | Consistent with existing design system; accessible keyboard/touch behavior; `onValueCommit` for deferred writes |
| Confirmation modal | Custom dialog component | shadcn AlertDialog | Focus trap, ARIA role="alertdialog", consistent styling |
| Tier enforcement | Frontend conditional only | RLS INSERT policy with SECURITY DEFINER function | Frontend checks are bypassable via direct API calls; DB-level enforcement is the only safe option |
| User profile | `raw_user_meta_data` | `profiles` table | User metadata is user-writable; profiles table with RLS is the secure alternative |
| Wheel creation modal | Custom modal | shadcn Dialog | Focus management, backdrop click to close, Escape key — all handled |

**Key insight:** The RLS tier enforcement is the single most security-critical piece of this phase. Any approach that doesn't enforce at the DB level (RLS or trigger) can be trivially bypassed by a user making direct requests to the Supabase REST API.

---

## Common Pitfalls

### Pitfall 1: RLS Infinite Recursion on Wheel Count
**What goes wrong:** The INSERT policy on `wheels` tries to `SELECT COUNT(*) FROM wheels WHERE user_id = auth.uid()` inside its WITH CHECK clause — this triggers the `wheels` SELECT policy, which triggers the INSERT policy's subquery again.
**Why it happens:** Postgres RLS policies apply to all access on a table including from within policies on the same table.
**How to avoid:** Wrap the count in a `SECURITY DEFINER` function (`count_user_wheels()`). SECURITY DEFINER functions run with the privileges of the function owner, bypassing RLS for their internal queries.
**Warning signs:** `infinite recursion detected in policy for relation "wheels"` error in Supabase logs.

### Pitfall 2: Tier Stored in User Metadata Is User-Modifiable
**What goes wrong:** An authenticated user calls `supabase.auth.updateUser({ data: { tier: 'premium' } })` from their browser console and gains premium access.
**Why it happens:** `raw_user_meta_data` is explicitly designed to be updatable by the user themselves.
**How to avoid:** Store tier in `profiles.tier`. Give users a SELECT policy on their own profile but never a direct UPDATE policy on the `tier` column (or limit UPDATE to non-tier columns if needed).
**Warning signs:** Free users accessing premium features.

### Pitfall 3: RadarChart Rescales on Score Changes
**What goes wrong:** When a user drags a slider from 8 to 1, the chart looks like the score is still high because the Y-axis rescaled from 0–8 to 0–1.
**Why it happens:** Recharts RadarChart defaults to auto-ranging the radius domain.
**How to avoid:** Always set `<PolarRadiusAxis domain={[0, 10]} />`. The domain is fixed regardless of data values.
**Warning signs:** Chart looks wrong when scores are at extreme values (1–2 or 9–10).

### Pitfall 4: Supabase Flooded with Score Update Requests
**What goes wrong:** User slowly drags a slider from 1 to 10, triggering 9 separate `UPDATE` calls to Supabase in rapid succession. Last write may not be the highest value (race condition).
**Why it happens:** Binding `onValueChange` directly to a Supabase call.
**How to avoid:** Separate `onValueChange` (update local state only) from `onValueCommit` (write to Supabase). The Radix Slider underlying shadcn Slider exposes both events.
**Warning signs:** Network tab shows many PATCH requests per slider drag.

### Pitfall 5: No `WITH CHECK` on UPDATE Policies
**What goes wrong:** A user can UPDATE a category to change its `user_id` to another user's ID, effectively transferring ownership of the row to themselves.
**Why it happens:** `USING` clause checks the row being updated; `WITH CHECK` checks the new values being written. Missing WITH CHECK means the new row data is unconstrained.
**How to avoid:** Every UPDATE policy must have both `USING ((select auth.uid()) = user_id)` AND `WITH CHECK ((select auth.uid()) = user_id)`. This matches the established project convention from Phase 1.
**Warning signs:** Studio shows UPDATE policies without a WITH CHECK expression.

### Pitfall 6: Categories Without a Snapshot Warning in Phase 2
**What goes wrong:** Phase 2 adds rename/remove with a "warning if snapshots exist" requirement, but the `snapshots` table doesn't exist until Phase 4. If the UI checks for snapshots and errors on a missing table, phase 2 breaks.
**How to avoid:** In Phase 2, the snapshot check returns 0 (hardcoded or via a safe SELECT that returns 0 rows if table doesn't exist). The AlertDialog code path must be present and working, but the check always returns "no snapshots." Phase 4 updates this check to query the real table.
**Warning signs:** AlertDialog never appears in Phase 2 — that is correct and expected.

### Pitfall 7: recharts and React 19 Peer Dependency Warning
**What goes wrong:** `npm install recharts` shows a peer dependency warning because some older recharts 2.x versions declared `peerDependencies: { react: "^16 || ^17 || ^18" }`.
**Why it happens:** Package peer dependency declarations lag behind React releases.
**How to avoid:** Install recharts 3.x (`npm install recharts` installs latest). Recharts 3.x supports React 19. If npm warns, use `--legacy-peer-deps` — the library works correctly.
**Warning signs:** `WARN Could not resolve` peer dependency in npm output. Safe to ignore with recharts 3.x + React 19.

---

## Code Examples

### Recharts RadarChart — Full Working Component
```typescript
// src/components/WheelChart.tsx
// Source: https://recharts.github.io/en-US/api/Radar/
import {
  RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Legend, Tooltip
} from 'recharts'

export type WheelChartPoint = {
  category: string
  asis: number   // 1–10
  tobe: number   // 1–10
}

interface WheelChartProps {
  data: WheelChartPoint[]
}

export function WheelChart({ data }: WheelChartProps) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid />
        <PolarAngleAxis dataKey="category" tick={{ fontSize: 12 }} />
        <PolarRadiusAxis domain={[0, 10]} tickCount={6} tick={false} />
        <Radar
          name="As-Is"
          dataKey="asis"
          stroke="#e8a23a"
          fill="#e8a23a"
          fillOpacity={0.4}
          dot={false}
        />
        <Radar
          name="To-Be"
          dataKey="tobe"
          stroke="#60a5fa"
          fill="#60a5fa"
          fillOpacity={0.15}
          dot={false}
        />
        <Legend />
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  )
}
```

### shadcn Slider — Controlled with Commit
```typescript
// src/components/CategorySlider.tsx
// Source: https://ui.shadcn.com/docs/components/slider
import { Slider } from '@/components/ui/slider'

interface CategorySliderProps {
  label: string
  value: number        // 1–10
  onChange: (v: number) => void    // fires on every drag
  onCommit: (v: number) => void    // fires on pointer up → DB write
}

export function CategorySlider({ label, value, onChange, onCommit }: CategorySliderProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 text-sm text-stone-600 shrink-0">{label}</span>
      <Slider
        min={1}
        max={10}
        step={1}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        onValueCommit={([v]) => onCommit(v)}
        className="flex-1"
      />
      <span className="w-6 text-sm font-medium text-stone-800 text-right">{value}</span>
    </div>
  )
}
```

### AlertDialog — Category Rename/Remove Warning
```typescript
// Source: https://ui.shadcn.com/docs/components/alert-dialog
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog'

interface SnapshotWarningDialogProps {
  open: boolean
  action: 'rename' | 'remove'
  categoryName: string
  onConfirm: () => void
  onCancel: () => void
}

export function SnapshotWarningDialog({
  open, action, categoryName, onConfirm, onCancel
}: SnapshotWarningDialogProps) {
  const verb = action === 'rename' ? 'Rename' : 'Remove'
  return (
    <AlertDialog open={open} onOpenChange={open => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{verb} "{categoryName}"?</AlertDialogTitle>
          <AlertDialogDescription>
            This wheel has saved snapshots. {verb === 'Rename' ? 'Renaming' : 'Removing'} this
            category will affect how historical snapshots appear in comparisons.
            This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>{verb} anyway</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

### Supabase Hook — Wheel + Categories
```typescript
// src/hooks/useWheel.ts
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export type CategoryRow = {
  id: string
  wheel_id: string
  name: string
  position: number
  score_asis: number
  score_tobe: number
}

export function useWheel(userId: string) {
  const [wheel, setWheel] = useState<{ id: string; name: string } | null>(null)
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      // Get first wheel for this user
      const { data: wheels, error: wErr } = await supabase
        .from('wheels')
        .select('id, name')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(1)
      if (wErr) { setError(wErr.message); setLoading(false); return }

      if (!wheels || wheels.length === 0) {
        setWheel(null); setLoading(false); return
      }

      const w = wheels[0]
      setWheel(w)

      const { data: cats, error: cErr } = await supabase
        .from('categories')
        .select('id, wheel_id, name, position, score_asis, score_tobe')
        .eq('wheel_id', w.id)
        .order('position', { ascending: true })
      if (cErr) { setError(cErr.message) }
      else setCategories(cats ?? [])
      setLoading(false)
    }
    load()
  }, [userId])

  const updateScore = async (id: string, field: 'score_asis' | 'score_tobe', value: number) => {
    await supabase.from('categories').update({ [field]: value }).eq('id', id)
  }

  return { wheel, categories, setCategories, loading, error, updateScore }
}
```

### Default 8-Category Template (seed.sql extension)
```sql
-- seed.sql: add after auth user inserts
-- Requires Phase 2 migration to run first (supabase db reset applies migrations then seed)

DO $$
DECLARE
  free_user_id uuid := '00000000-0000-0000-0000-000000000001';
  premium_user_id uuid := '00000000-0000-0000-0000-000000000002';
  free_wheel_id uuid := '00000000-0000-0000-0000-000000000011';
  premium_wheel_id uuid := '00000000-0000-0000-0000-000000000012';
BEGIN
  -- Free tier user: profiles row
  INSERT INTO public.profiles (id, tier) VALUES (free_user_id, 'free') ON CONFLICT DO NOTHING;
  INSERT INTO public.profiles (id, tier) VALUES (premium_user_id, 'premium') ON CONFLICT DO NOTHING;

  -- Free tier: 1 wheel
  INSERT INTO public.wheels (id, user_id, name)
    VALUES (free_wheel_id, free_user_id, 'My Wheel') ON CONFLICT DO NOTHING;

  -- 8 default categories with pre-planned scores
  INSERT INTO public.categories (wheel_id, user_id, name, position, score_asis, score_tobe) VALUES
    (free_wheel_id, free_user_id, 'Health',             0, 5, 8),
    (free_wheel_id, free_user_id, 'Career',             1, 7, 9),
    (free_wheel_id, free_user_id, 'Relationships',      2, 6, 7),
    (free_wheel_id, free_user_id, 'Finance',            3, 4, 7),
    (free_wheel_id, free_user_id, 'Fun & Recreation',   4, 5, 8),
    (free_wheel_id, free_user_id, 'Personal Growth',    5, 6, 8),
    (free_wheel_id, free_user_id, 'Physical Environment', 6, 7, 7),
    (free_wheel_id, free_user_id, 'Family & Friends',   7, 6, 8)
  ON CONFLICT DO NOTHING;

  -- Premium tier: 1 wheel (snapshots seeded in Phase 4)
  INSERT INTO public.wheels (id, user_id, name)
    VALUES (premium_wheel_id, premium_user_id, 'My Wheel') ON CONFLICT DO NOTHING;

  INSERT INTO public.categories (wheel_id, user_id, name, position, score_asis, score_tobe) VALUES
    (premium_wheel_id, premium_user_id, 'Health',             0, 7, 8),
    (premium_wheel_id, premium_user_id, 'Career',             1, 8, 9),
    (premium_wheel_id, premium_user_id, 'Relationships',      2, 5, 7),
    (premium_wheel_id, premium_user_id, 'Finance',            3, 6, 8),
    (premium_wheel_id, premium_user_id, 'Fun & Recreation',   4, 4, 7),
    (premium_wheel_id, premium_user_id, 'Personal Growth',    5, 7, 9),
    (premium_wheel_id, premium_user_id, 'Physical Environment', 6, 7, 7),
    (premium_wheel_id, premium_user_id, 'Family & Friends',   7, 5, 7)
  ON CONFLICT DO NOTHING;

END $$;
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Recharts 2.x | Recharts 3.x | Nov 2024 | 3.x is stable + supports React 19; 2.x still receives maintenance releases but 3.x is the forward path |
| `raw_user_meta_data` for roles | Dedicated `profiles` table | Supabase security advisory (2023–2024) | Supabase explicitly warns against using user metadata in RLS policies |
| Plain subquery in RLS INSERT | SECURITY DEFINER function | PostgreSQL RLS design (always) | Infinite recursion issue when querying the same table; function is the established workaround |
| `supabase.auth.updateUser` for tier | Server-side profile update only | Always been a security concern | Client-callable auth update methods must never be used for authorization data |

**Deprecated/outdated:**
- `recharts@^2` for new React 19 projects: prefer `recharts@^3` which has explicit React 19 support.
- Storing authorization claims in `raw_user_meta_data`: Supabase documentation now explicitly warns against this pattern.

---

## Open Questions

1. **Wheel name — editable or fixed?**
   - What we know: The domain model shows `Wheel` has a name, but no requirement explicitly calls for wheel rename in Phase 2.
   - What's unclear: Should the wheel creation flow ask for a name, or default to "My Wheel" silently?
   - Recommendation: Default to "My Wheel" silently in Phase 2. If the user wants to rename, that can be added in a later phase without schema changes.

2. **Multi-wheel navigation for premium users**
   - What we know: WHEEL-07 says premium users can create unlimited wheels. The existing sidebar nav links to `/wheel` (singular).
   - What's unclear: How does a premium user switch between multiple wheels? Phase 2 just needs to handle the creation — navigation between wheels is a follow-on concern.
   - Recommendation: Phase 2 shows the first (most recently created) wheel. If a premium user creates a second wheel, it replaces the displayed wheel. Multi-wheel management (list, select) is Phase 3+ scope.

3. **Upgrade prompt content**
   - What we know: WHEEL-06 requires showing an upgrade prompt when a free user tries to create a second wheel. No payment system exists yet (that's v2 monetization).
   - What's unclear: What does the upgrade prompt link to?
   - Recommendation: Show a Dialog/modal with copy like "Upgrade to Premium for unlimited wheels" and a disabled or placeholder CTA button. The button does nothing in Phase 2. Phase 2 just needs to block creation and show the prompt — the actual payment integration is v2.

4. **`snapshots` table in Phase 2 migrations**
   - What we know: WHEEL-04 and WHEEL-05 require checking for existing snapshots before rename/remove. The snapshots table is created in Phase 4.
   - What's unclear: Should Phase 2 create a stub `snapshots` table, or skip the check entirely?
   - Recommendation: Do NOT create the snapshots table in Phase 2. The snapshot check function returns 0 (hardcoded). The UI renders the AlertDialog code path but the check always returns false. Phase 4 wires up the real check.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.x + @testing-library/react 16.x (installed in Phase 1) |
| Config file | `vite.config.ts` (test section — already configured) |
| Quick run command | `npm test -- --run` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| WHEEL-01 | Template wheel creates 8 categories | unit (mock Supabase) | `npm test -- --run src/hooks/useWheel.test.ts` | Wave 0 |
| WHEEL-02 | Blank wheel creates 0 categories | unit (mock Supabase) | `npm test -- --run src/hooks/useWheel.test.ts` | Wave 0 |
| WHEEL-03 | addCategory increments count; 12th succeeds, 13th is blocked | unit (mock Supabase) | `npm test -- --run src/hooks/useCategories.test.ts` | Wave 0 |
| WHEEL-04 | Rename triggers snapshot check; dialog appears if count > 0 | unit | `npm test -- --run src/components/WheelPage.test.tsx` | Wave 0 |
| WHEEL-05 | Remove triggers snapshot check; blocked if count < 3 | unit | `npm test -- --run src/components/WheelPage.test.tsx` | Wave 0 |
| WHEEL-06 | Free-tier user sees upgrade prompt on second wheel attempt | unit (mock tier) | `npm test -- --run src/components/WheelPage.test.tsx` | Wave 0 |
| WHEEL-07 | Premium-tier user can create second wheel without prompt | unit (mock tier) | `npm test -- --run src/components/WheelPage.test.tsx` | Wave 0 |
| SCORE-01 | As-is slider change updates local state and chart data | unit | `npm test -- --run src/components/CategorySlider.test.tsx` | Wave 0 |
| SCORE-02 | To-be slider change updates local state and chart data | unit | `npm test -- --run src/components/CategorySlider.test.tsx` | Wave 0 |
| SCORE-03 | Chart data updates on value change without DB write; DB write only on commit | unit | `npm test -- --run src/components/WheelPage.test.tsx` | Wave 0 |
| DB schema + RLS | Wheel insert blocked for free user with existing wheel | manual smoke | `supabase db reset && manual test via Studio or Supabase REST` | Manual only |
| DB schema + RLS | Premium user can insert second wheel | manual smoke | Same as above | Manual only |

### Sampling Rate
- **Per task commit:** `npm test -- --run`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green + manual smoke test of both seed users (verify wheel + categories visible, sliders work, chart redraws) before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/hooks/useWheel.test.ts` — covers WHEEL-01, WHEEL-02
- [ ] `src/hooks/useCategories.test.ts` — covers WHEEL-03
- [ ] `src/components/CategorySlider.test.tsx` — covers SCORE-01, SCORE-02, SCORE-03
- [ ] `src/components/WheelPage.test.tsx` — covers WHEEL-04, WHEEL-05, WHEEL-06, WHEEL-07, SCORE-03 integration
- [ ] `src/components/WheelChart.test.tsx` — smoke: chart renders with data, renders empty state

---

## Sources

### Primary (HIGH confidence)
- https://recharts.github.io/en-US/api/Radar/ — Radar component props (dataKey, stroke, fill, fillOpacity, dot)
- https://recharts.github.io/en-US/api/RadarChart/ — RadarChart container props
- https://ui.shadcn.com/docs/components/slider — Slider installation, value/onValueChange/onValueCommit props
- https://ui.shadcn.com/docs/components/alert-dialog — AlertDialog complete usage
- https://ui.shadcn.com/docs/components/dialog — Dialog complete usage
- https://supabase.com/docs/guides/database/postgres/row-level-security — RLS WITH CHECK pattern

### Secondary (MEDIUM confidence)
- https://github.com/orgs/supabase/discussions/18715 — Limiting rows per user with RLS; SECURITY DEFINER function recommendation (official Supabase GitHub Discussions)
- https://supabase.github.io/splinter/0015_rls_references_user_metadata/ — Official Supabase warning: do not use raw_user_meta_data in RLS
- https://www.npmjs.com/package/recharts — Confirmed recharts 3.x latest stable, React 19 support

### Tertiary (LOW confidence)
- Medium / blog posts on Recharts dual-series patterns — patterns cross-verified against official Recharts docs

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — recharts 3.x and shadcn Slider/AlertDialog/Dialog verified via official docs
- Architecture: HIGH — RadarChart dual-series pattern verified via official Recharts API; RLS SECURITY DEFINER pattern verified via Supabase official GitHub Discussions
- Pitfalls: HIGH — RLS infinite recursion and user metadata security risk confirmed via official Supabase documentation and splinter linting rule
- Seed data patterns: HIGH — extends established Phase 1 pattern with deterministic UUIDs

**Research date:** 2026-03-14
**Valid until:** 2026-06-14 (90 days — Recharts 3.x API is stable; shadcn components are stable; Supabase RLS behavior is stable)
