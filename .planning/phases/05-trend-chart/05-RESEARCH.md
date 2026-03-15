# Phase 5: Trend Chart - Research

**Researched:** 2026-03-15
**Domain:** Recharts LineChart, single-category time-series view, graceful empty state
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TREND-01 | User can view a single-category trend chart (as-is and to-be scores over time for a selected category); requires 3+ snapshots; graceful empty state shown below that threshold | Recharts `LineChart` + `Line` (two series: as-is, to-be) with `XAxis` keyed on `saved_at`; data sourced from existing `useSnapshots().listSnapshots` + `fetchSnapshotScores`; empty state when `snapshots.length < 3`; `TrendPage.tsx` already exists as a placeholder — replace it |
</phase_requirements>

---

## Summary

Phase 5 is the smallest phase in the project. It delivers one screen: a line chart showing a single category's as-is and to-be scores over time, one point per snapshot. The feature is intentionally minimal — no new database tables, no new hooks beyond what was built in Phase 4, no new npm packages.

All data infrastructure is already in place. `useSnapshots` (built in Phase 4) provides `listSnapshots` and `fetchSnapshotScores`. The `SnapshotRow` and `SnapshotScoreRow` types are already defined in `src/types/database.ts`. `TrendPage.tsx` exists as a placeholder ("Coming soon") and simply needs to be replaced with a real implementation.

The only new component is `TrendChart` — a Recharts `LineChart` with two `<Line>` series (as-is and to-be) and an `XAxis` keyed on formatted snapshot dates. The page wraps this with a category `<select>` and the threshold guard (fewer than 3 snapshots shows a message, not a broken chart). The color conventions already established in the project apply: amber for as-is, blue for to-be — same as `WheelChart`.

**Primary recommendation:** Replace `TrendPage.tsx` with a real implementation. Add a `TrendChart` component. Reuse `useSnapshots` as-is — no hook changes needed. The entire phase is front-end only.

---

## Standard Stack

### Core (all already installed — no new packages required)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | 3.8.0 (installed) | `LineChart` with two `Line` series for time-series | Already used for RadarChart; `LineChart` is in the same package |
| @supabase/supabase-js | ^2.x (installed) | Data via `useSnapshots` hook | Project stack |
| react | ^19.0.0 (installed) | State for category selection, loading | Project stack |
| tailwindcss | ^3.x (installed) | Styling consistent with SnapshotsPage | Project stack |

**No new npm packages required for this phase.**

### Recharts Components Used
All confirmed present in `node_modules/recharts/es6/`:
- `LineChart` — from `chart/LineChart.js`
- `Line` — from `cartesian/Line.js`
- `XAxis` — from `cartesian/XAxis.js`
- `YAxis` — from `cartesian/YAxis.js`
- `CartesianGrid` — from `cartesian/CartesianGrid.js`
- `Tooltip`, `Legend`, `ResponsiveContainer` — already used in project

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Recharts LineChart | Chart.js, Victory, Nivo | All require new npm installs; Recharts already in project with established mock patterns for tests |
| Recharts LineChart | Custom SVG path | Far more complex; Recharts handles responsive sizing, tooltips, legends — no reason to hand-roll |

---

## Architecture Patterns

### File Additions for Phase 5
```
src/
├── components/
│   └── TrendChart.tsx              # New — LineChart with two Line series
├── pages/
│   └── TrendPage.tsx               # Replace placeholder — full UI
│   └── TrendPage.test.tsx          # New — Wave 0 test stub then implementation tests
```

No database migrations. No hook changes. No type changes.

### Pattern 1: TrendChart Component
**What:** A Recharts `LineChart` with two `<Line>` series — one for as-is scores, one for to-be scores. X-axis shows formatted snapshot dates. Y-axis domain is fixed 0–10. Receives pre-computed data (snapshot dates + scores for one category).
**When to use:** Always. Render only when `data.length >= 3`; the empty-state guard lives in `TrendPage`, not in this component (the component can optionally accept a message prop or simply always render when given data).

```typescript
// src/components/TrendChart.tsx
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'

export type TrendChartPoint = {
  date: string      // formatted for display, e.g. "15 Jan 2026"
  asis: number
  tobe: number
}

interface TrendChartProps {
  data: TrendChartPoint[]
  categoryName: string
}

export function TrendChart({ data, categoryName }: TrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={360}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: '#78716c' }}
          tickLine={false}
        />
        <YAxis
          domain={[0, 10]}
          ticks={[0, 2, 4, 6, 8, 10]}
          tick={{ fontSize: 12, fill: '#78716c' }}
          tickLine={false}
          axisLine={false}
          width={24}
        />
        <Tooltip
          contentStyle={{ fontSize: 13 }}
          formatter={(value: number, name: string) =>
            [value, name === 'asis' ? 'As-Is' : 'To-Be']
          }
        />
        <Legend
          formatter={(value: string) => value === 'asis' ? 'As-Is' : 'To-Be'}
        />
        <Line
          type="monotone"
          dataKey="asis"
          name="asis"
          stroke="#e8a23a"
          strokeWidth={2}
          dot={{ r: 4, fill: '#e8a23a' }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="tobe"
          name="tobe"
          stroke="#60a5fa"
          strokeWidth={2}
          dot={{ r: 4, fill: '#60a5fa' }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

**Color convention:** amber (`#e8a23a`) for as-is, blue (`#60a5fa`) for to-be — identical to the existing `WheelChart` color scheme. Consistent visual language across the app.

### Pattern 2: TrendPage — Data Loading
**What:** `TrendPage` fetches snapshots via `useSnapshots().listSnapshots`, then batch-loads all snapshot scores (same pattern as `SnapshotsPage`), derives the category list, and transforms data for the selected category into `TrendChartPoint[]` sorted chronologically.
**When to use:** Always. Page-level data fetching; `TrendChart` is purely presentational.

```typescript
// src/pages/TrendPage.tsx (data loading pattern)
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useWheel } from '@/hooks/useWheel'
import { useSnapshots } from '@/hooks/useSnapshots'
import { TrendChart } from '@/components/TrendChart'
import type { SnapshotRow, SnapshotScoreRow } from '@/types/database'

function formatDate(savedAt: string): string {
  return new Date(savedAt).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export function TrendPage() {
  const { session } = useAuth()
  const userId = session?.user?.id ?? ''

  const { wheel } = useWheel(userId)
  const { listSnapshots, fetchSnapshotScores } = useSnapshots()

  const [snapshots, setSnapshots] = useState<SnapshotRow[]>([])
  const [allScores, setAllScores] = useState<SnapshotScoreRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('')

  useEffect(() => {
    if (!wheel?.id) return
    let cancelled = false

    async function load() {
      setLoading(true)
      const rows = await listSnapshots(wheel!.id)
      if (cancelled) return

      // Reverse DESC to ASC for chronological left-to-right chart
      const chronological = [...rows].reverse()
      setSnapshots(chronological)

      if (rows.length > 0) {
        const allScoreArrays = await Promise.all(
          rows.map(s => fetchSnapshotScores(s.id))
        )
        if (!cancelled) {
          const flat = allScoreArrays.flat()
          setAllScores(flat)
          const cats = [...new Set(flat.map(s => s.category_name))].sort()
          if (cats.length > 0) setSelectedCategory(cats[0])
        }
      }

      if (!cancelled) setLoading(false)
    }

    void load()
    return () => { cancelled = true }
  }, [wheel?.id])

  // Derive category names for select
  const categoryNames = [...new Set(allScores.map(s => s.category_name))].sort()

  // Build TrendChartPoint[] for selected category (chronological)
  const chartData = snapshots.map(snap => {
    const score = allScores.find(
      s => s.snapshot_id === snap.id && s.category_name === selectedCategory
    )
    return {
      date: formatDate(snap.saved_at),
      asis: score?.score_asis ?? 0,
      tobe: score?.score_tobe ?? 0,
    }
  }).filter((_, i) => {
    // Only include snapshots that have scores for the selected category
    const snap = snapshots[i]
    return allScores.some(
      s => s.snapshot_id === snap.id && s.category_name === selectedCategory
    )
  })

  // TREND-01: requires 3+ snapshots for the chart
  const hasEnoughSnapshots = snapshots.length >= 3

  // ... render
}
```

### Pattern 3: Empty State — Fewer than 3 Snapshots
**What:** When `snapshots.length < 3`, the trend chart area shows a text message explaining the threshold, not a broken chart or error. The message is friendly and actionable.
**When to use:** Always when snapshot count is < 3 (including 0 and 1 and 2). Different copy for 0 vs. 1–2 is a nice-to-have but a single message covering "< 3" is sufficient.

```typescript
// Inside TrendPage render — after loading resolves
{loading ? (
  <LoadingSpinner />
) : !hasEnoughSnapshots ? (
  <div className="rounded-lg border border-stone-200 p-8 text-center space-y-2">
    <p className="text-stone-600 font-medium">Not enough snapshots yet</p>
    <p className="text-stone-400 text-sm">
      Save at least 3 snapshots to see how your scores have changed over time.
      You have {snapshots.length} so far.
    </p>
  </div>
) : (
  <TrendChart data={chartData} categoryName={selectedCategory} />
)}
```

**Important:** The count shown ("You have X so far") helps the user understand exactly how close they are to unlocking the chart.

### Pattern 4: Category Select
**What:** A `<select>` element showing all unique category names discovered from the snapshot scores. Same pattern as `SnapshotsPage` score history table — reuse the exact same markup.
**When to use:** Rendered when snapshots exist and `categoryNames.length > 0`.

```typescript
// Category select — identical to SnapshotsPage pattern
<div className="flex items-center gap-3">
  <label htmlFor="trend-category" className="text-sm text-stone-600">
    Category:
  </label>
  <select
    id="trend-category"
    value={selectedCategory}
    onChange={e => setSelectedCategory(e.target.value)}
    className="text-sm border border-stone-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-stone-400"
  >
    {categoryNames.map(cat => (
      <option key={cat} value={cat}>{cat}</option>
    ))}
  </select>
</div>
```

### Pattern 5: Data Loading Strategy
**What:** Load all snapshot scores for the wheel once on mount (same as `SnapshotsPage`), cache in `allScores` state, filter client-side by selected category. No per-category re-fetch on category change.
**When to use:** Always. The seed data has 4 snapshots × 8 categories = 32 rows — completely reasonable to load upfront. The user's real wheel will likely be similar scale.

**Data flow:**
1. `listSnapshots(wheel.id)` — returns DESC, reverse to ASC for chart
2. `Promise.all(snapshots.map(s => fetchSnapshotScores(s.id)))` — batch load all scores
3. Derive `categoryNames` from `allScores` (deduped, sorted)
4. On category change: filter `allScores` client-side to build `TrendChartPoint[]`
5. Pass to `TrendChart`

### Anti-Patterns to Avoid
- **Fetching scores per-category on select change:** Creates a network request every time the user picks a different category. Cache all scores on mount (same pattern as `SnapshotsPage`).
- **Showing a Recharts chart with 1–2 data points:** Recharts `LineChart` renders but looks broken with only 1 point (no line) or 2 points (a single segment with no trend context). The `< 3` guard is a requirement (TREND-01), not a suggestion.
- **Connecting points across category gaps:** If a category was added after snapshot 1, some snapshots will have no score for it. These points should be omitted from the chart data (filter them out), not shown as zero — a zero value would falsely imply the user had a score of 0, not that the category didn't exist yet.
- **Using different colors from WheelChart:** The amber/blue convention is established. Using different colors on TrendPage breaks visual consistency.
- **Rendering the category select when there are no categories:** Guard with `categoryNames.length > 0` before rendering the select and chart.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Time-series line chart | Custom SVG paths with D3 or raw math | Recharts `LineChart` | Handles responsive sizing, tooltip, legend, axis ticks, domain clamping — already installed |
| Date formatting | Custom date utility | `new Date(savedAt).toLocaleDateString('en-GB', { ... })` | Same `formatDate` utility as `SnapshotsPage` — copy or extract to a shared util |
| Score data fetching | New hook or Supabase query | `useSnapshots().listSnapshots` + `fetchSnapshotScores` | Phase 4 hook already does exactly this; no changes needed |
| Empty state component | Third-party empty state library | Inline div with message | Trivial; consistent with existing empty state pattern in `WheelChart` and `SnapshotsPage` |

**Key insight:** Phase 5 is almost entirely a data transformation and rendering problem. All the hard infrastructure (DB schema, RLS, hooks, types) was built in Phase 4. The only new code is `TrendChart.tsx` and the `TrendPage.tsx` replacement.

---

## Common Pitfalls

### Pitfall 1: Chart with Fewer than 3 Points
**What goes wrong:** Developer renders `TrendChart` when `snapshots.length < 3`. With 1 point, no line is drawn (a single dot is shown). With 2 points, a single line segment renders with no visual "trend." Users see a confusing near-empty chart.
**Why it happens:** Forgetting the `< 3` guard specified in TREND-01.
**How to avoid:** Always guard: `if (snapshots.length < 3) return <EmptyState />`. Never pass fewer than 3 data points to `TrendChart`.
**Warning signs:** TrendPage renders the chart when premium@test.com has only 1 or 2 snapshots, or when logged in as free@test.com (no snapshots).

### Pitfall 2: Snapshots in Wrong Chronological Order
**What goes wrong:** `listSnapshots` returns DESC order (most recent first). If passed directly to `TrendChart`, the chart reads right-to-left (time runs backwards).
**Why it happens:** `listSnapshots` was deliberately designed DESC for the `SnapshotsPage` list (most recent at top). Same result is reused without reversal.
**How to avoid:** Always reverse the `listSnapshots` result before building chart data: `const chronological = [...rows].reverse()`. Same pattern used in `SnapshotsPage.tsx` (confirmed by reading that file).
**Warning signs:** Chart shows scores declining toward the left instead of the right; latest snapshot is the leftmost data point.

### Pitfall 3: Category Not Found in a Snapshot — Zero vs. Omit
**What goes wrong:** For a category that was added after snapshot 1, `allScores.find(...)` returns `undefined` for snap1. Developer uses `score?.score_asis ?? 0`, which plots a 0 value at that date, making it look like the user scored 0 when the category simply didn't exist.
**Why it happens:** The natural fallback to 0 for missing data.
**How to avoid:** Filter out chart points where the score is `undefined` — don't plot them at all. Recharts `Line` with `connectNulls={false}` (the default) will leave a gap rather than connecting around missing points. Alternatively, filter the snapshot list to only include snapshots that have a score for the selected category.
**Warning signs:** Trend chart shows a dip to 0 at the first data point for categories added mid-history.

### Pitfall 4: Race Condition — wheel.id Not Yet Available
**What goes wrong:** `useEffect` fires immediately but `wheel` from `useWheel(userId)` is still loading. The effect guards on `if (!wheel?.id) return`, but on first render `wheel` is null/undefined, so nothing loads. If `wheel` never changes (it loads after one render), the effect needs the `wheel?.id` dependency.
**Why it happens:** Async data dependencies not listed in the `useEffect` deps array.
**How to avoid:** Always include `wheel?.id` in the `useEffect` dependency array. Confirmed this is how `SnapshotsPage.tsx` does it: `}, [wheel?.id])`. Copy this pattern exactly.
**Warning signs:** TrendPage shows "Loading" spinner indefinitely, or shows "0 snapshots" for a user who has snapshots.

### Pitfall 5: Recharts LineChart Mock Missing in Tests
**What goes wrong:** Tests import `TrendChart` which imports from `recharts`. Recharts components call browser APIs (ResizeObserver, SVG rendering) not available in jsdom. Tests crash with "ResizeObserver is not defined" or similar.
**Why it happens:** Recharts relies on browser APIs that jsdom doesn't implement.
**How to avoid:** Mock `recharts` in `TrendChart.test.tsx` and `TrendPage.test.tsx` — the same mock pattern used in `ComparisonChart.test.tsx` and `WheelChart.test.tsx`. The mock replaces `LineChart`, `Line`, `XAxis`, `YAxis`, `CartesianGrid`, `ResponsiveContainer`, `Tooltip`, `Legend` with simple divs. Use `data-testid` and `data-*` attributes on mocked components to enable test assertions without SVG rendering.
**Warning signs:** Test output contains "ResizeObserver is not defined" or SVG-related errors.

---

## Code Examples

Verified patterns from existing codebase (Phase 4):

### Recharts Mock Pattern (from ComparisonChart.test.tsx)
```typescript
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children, data }: { children: React.ReactNode; data: unknown[] }) => (
    <div data-testid="line-chart" data-points={data?.length}>{children}</div>
  ),
  Line: ({ dataKey, name }: { dataKey: string; name: string }) => (
    <div data-testid="line" data-key={dataKey} data-name={name} />
  ),
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}))
```

### Snapshot Score Data Transformation for LineChart
```typescript
// Build TrendChartPoint[] for a selected category, chronological order
// snapshots is already reversed (ASC by saved_at)
const chartData = snapshots
  .map(snap => {
    const score = allScores.find(
      s => s.snapshot_id === snap.id && s.category_name === selectedCategory
    )
    if (!score) return null  // category didn't exist in this snapshot
    return {
      date: formatDate(snap.saved_at),
      asis: score.score_asis,
      tobe: score.score_tobe,
    }
  })
  .filter((point): point is NonNullable<typeof point> => point !== null)
```

### Date Formatting (reuse from SnapshotsPage)
```typescript
// Confirmed pattern from SnapshotsPage.tsx
function formatDate(savedAt: string): string {
  return new Date(savedAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
// Output: "15 Jan 2026"
```

### Batch-load All Scores on Mount (from SnapshotsPage.tsx)
```typescript
// Confirmed pattern — no changes needed for TrendPage
const allScoreArrays = await Promise.all(
  rows.map(s => fetchSnapshotScores(s.id))
)
const flat = allScoreArrays.flat()
setAllScores(flat)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Radar chart for time-series (wrong chart type) | `LineChart` for time-series | Phase 5 is first time-series view in this project | Line chart is the correct choice for "X over time" |
| Raw date strings on X-axis | Formatted date labels via `formatDate()` | Phase 4 pattern | Consistent "15 Jan 2026" format across SnapshotsPage and TrendPage |

**No deprecated approaches in scope for this phase.**

---

## Open Questions

1. **Should the category select show on the empty state (< 3 snapshots)?**
   - What we know: TREND-01 says "graceful empty state shown below that [3-snapshot] threshold." It doesn't specify whether the category selector should be visible.
   - What's unclear: Does hiding the select simplify or confuse the UI?
   - Recommendation: Hide the category select entirely when `snapshots.length < 3`. The select is meaningless without a chart. Show only the empty state message. Consistent with SnapshotsPage, which also hides the comparison chart section until 2 snapshots are selected.

2. **Should TrendPage also show the score history table (like SnapshotsPage)?**
   - What we know: TREND-01 only specifies a "single-category trend chart." The score history table (COMP-02) is already on SnapshotsPage.
   - What's unclear: Is there value in duplicating it on TrendPage?
   - Recommendation: No table on TrendPage. Keep it focused: category picker + line chart + empty state. The score history table is available on SnapshotsPage. Don't duplicate it.

3. **What copy to show for 0, 1, 2 snapshots?**
   - Recommendation: A single message covers all three cases: "Save at least 3 snapshots to see your trend. You have {n} so far." The count gives the user a sense of progress.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.1.x + @testing-library/react 16.x (installed) |
| Config file | `vite.config.ts` (test section — already configured) |
| Quick run command | `npm test -- --run` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TREND-01 | TrendChart renders two Line series when given 3+ data points | unit (mock recharts) | `npm test -- --run src/components/TrendChart.test.tsx` | Wave 0 gap |
| TREND-01 | TrendChart: as-is Line uses amber color, to-be Line uses blue | unit (render) | `npm test -- --run src/components/TrendChart.test.tsx` | Wave 0 gap |
| TREND-01 | TrendPage shows empty state when < 3 snapshots | unit (mock hooks) | `npm test -- --run src/pages/TrendPage.test.tsx` | Wave 0 gap |
| TREND-01 | TrendPage renders TrendChart when 3+ snapshots exist | unit (mock hooks) | `npm test -- --run src/pages/TrendPage.test.tsx` | Wave 0 gap |
| TREND-01 | TrendPage category select shows all unique category names | unit (mock hooks) | `npm test -- --run src/pages/TrendPage.test.tsx` | Wave 0 gap |
| TREND-01 | TrendPage filters chart data to selected category | unit (mock hooks) | `npm test -- --run src/pages/TrendPage.test.tsx` | Wave 0 gap |
| TREND-01 | Empty state shows snapshot count to help user progress | unit (render) | `npm test -- --run src/pages/TrendPage.test.tsx` | Wave 0 gap |
| TREND-01 | Chart data is chronological (oldest snapshot = leftmost point) | unit (data transform) | `npm test -- --run src/pages/TrendPage.test.tsx` | Wave 0 gap |
| TREND-01 | Category with missing scores in some snapshots: those points omitted (not plotted as 0) | unit (data transform) | `npm test -- --run src/pages/TrendPage.test.tsx` | Wave 0 gap |
| TREND-01 | End-to-end: log in as premium@test.com, go to /trend, verify chart renders with 4 points for each category | manual smoke | `supabase start && npm run dev` | Manual only |

### Sampling Rate
- **Per task commit:** `npm test -- --run`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green + manual smoke: log in as premium@test.com (4 seeded snapshots), navigate to /trend, verify line chart renders with 4 data points, change category in select, verify chart updates. Log in as free@test.com (no snapshots), verify empty state message appears with "0 so far."

### Wave 0 Gaps
- [ ] `src/components/TrendChart.test.tsx` — covers two-Line render, color props, empty data guard
- [ ] `src/pages/TrendPage.test.tsx` — covers empty state (0/1/2 snapshots), chart render (3+ snapshots), category select, chronological order, missing-score omission

*(No existing test files require updates for this phase — TrendPage.test.tsx does not yet exist)*

---

## Sources

### Primary (HIGH confidence)
- `src/components/WheelChart.tsx` — established color convention (amber `#e8a23a` for as-is, blue `#60a5fa` for to-be); `ResponsiveContainer` wrapping pattern
- `src/components/ComparisonChart.tsx` — exact Recharts import style used in project; empty state pattern
- `src/components/ComparisonChart.test.tsx` — canonical Recharts mock pattern for tests; `data-testid` + `data-*` attribute verification strategy
- `src/pages/SnapshotsPage.tsx` — batch-load strategy; `formatDate()` utility; category select markup; `listSnapshots` DESC reversal for chronological display; `useEffect` deps pattern `[wheel?.id]`
- `src/hooks/useSnapshots.ts` — confirmed `listSnapshots` returns DESC; `fetchSnapshotScores` returns ordered by `position`
- `src/types/database.ts` — `SnapshotRow`, `SnapshotScoreRow` types already defined; no changes needed
- `src/pages/TrendPage.tsx` — confirmed it is a placeholder ("Coming soon"); ready to replace
- `node_modules/recharts/es6/chart/LineChart.js` — `LineChart` confirmed present in installed recharts 3.8.0
- `node_modules/recharts/es6/cartesian/Line.js` — `Line` confirmed present
- `node_modules/recharts/es6/cartesian/XAxis.js`, `YAxis.js`, `CartesianGrid.js` — all confirmed present

### Secondary (MEDIUM confidence)
- Recharts official docs (https://recharts.org/en-US/api/LineChart) — `LineChart` accepts `data` array, `margin` prop; `Line` accepts `type`, `dataKey`, `stroke`, `strokeWidth`, `dot`, `activeDot`, `connectNulls`

### Tertiary (LOW confidence)
- None — all findings are directly verifiable from the installed codebase

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Recharts `LineChart` confirmed in installed `node_modules`; all other libraries already in use
- Architecture: HIGH — directly derived from existing `SnapshotsPage` patterns; data loading strategy is a direct copy-and-simplify
- Data transformation: HIGH — `listSnapshots` + `fetchSnapshotScores` behavior confirmed by reading hook source
- Pitfalls: HIGH — chronological order pitfall and zero-vs-omit pitfall derived from reading actual code; mock pitfall derived from existing test files
- Test patterns: HIGH — mock pattern confirmed verbatim from `ComparisonChart.test.tsx`

**Research date:** 2026-03-15
**Valid until:** 2026-06-15 (90 days — Recharts 3.x API is stable; no planned upgrades in scope)
