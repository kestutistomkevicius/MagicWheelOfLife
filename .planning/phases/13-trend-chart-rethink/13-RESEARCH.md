# Phase 13: Trend Chart Rethink - Research

**Researched:** 2026-03-24
**Domain:** Recharts LineChart enrichment, interval-based action item surfacing, per-category action item display, `is_important` signal
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

Derived from success criteria (no IDs pre-assigned):

| ID | Description | Research Support |
|----|-------------|-----------------|
| TREND-13-01 | Action items completed between two snapshots are surfaced alongside the chart when the as-is score improved in that interval | Interval logic in TrendPage: compare consecutive snapshot scores; query action items completed between those two `saved_at` timestamps; display as a list below chart |
| TREND-13-02 | Markers are no longer tied to exact date matching — the previous approach almost never fired | Remove the `snapshotDates.has(d)` guard from the marker computation loop; switch from `ReferenceLine` per-item to interval-based grouping or remove ReferenceLine markers entirely in favour of a below-chart list |
| TREND-13-03 | When a category is selected, its action items (and their completion status) are shown below the trend chart | `loadActionItems(cat.id)` is already called in TrendPage; render the returned `ActionItemRow[]` in a read-only list below `<TrendChart>` |
| TREND-13-04 | The category's `is_important` flag is visible in the trend view | `CategoryRow.is_important` is available via `useWheel().categories`; display a star/badge next to the category name in the select or heading |
</phase_requirements>

---

## Summary

Phase 13 is a focused enrichment of the existing `TrendPage` + `TrendChart` pair. No new npm packages, no DB migrations, no new hooks are required. All the necessary data is already being fetched or is trivially fetchable from existing hooks.

**Root cause of the broken marker feature:** `TrendPage.tsx` lines 82–85 gate every marker on `snapshotDates.has(d)` — a set of exactly-formatted date strings like `"01 Jan 2026"`. An action item completed on `2026-02-03` would only produce a marker if there is a snapshot saved on the exact same calendar day. In practice this almost never happens. The fix is to abandon exact-date matching entirely and switch to an interval model: when the as-is score for the selected category rose between snapshot N and snapshot N+1, show the action items completed during that interval.

**The four success criteria map to surgical changes in two files: `TrendPage.tsx` and `TrendChart.tsx` (possibly a new sibling component for the below-chart panel).** The existing `TrendChart` contract (`data`, `categoryName`, `markers`) can be extended or left untouched depending on whether interval markers are kept on the chart at all. The safest, most testable design removes `ReferenceLine` markers from the chart entirely and instead renders an "Actions in this period" panel below the chart — simpler, more readable, and no longer dependent on X-axis date alignment.

**Primary recommendation:** Replace the exact-date marker system with an interval-based "actions that accompanied this improvement" panel rendered below the chart. Keep `TrendChart.tsx` pure (line chart only, no markers). Add a new `ActionInsightsPanel` component (or inline section in `TrendPage`) that lists completed action items grouped by the improvement interval they fall into.

---

## Standard Stack

### Core (all already installed — zero new packages)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | 3.x (installed) | Existing `LineChart` — no changes to chart internals needed | Already used, mock pattern established |
| @supabase/supabase-js | ^2.x (installed) | `loadActionItems` via existing `useActionItems` hook | Project stack |
| react | ^19.0.0 (installed) | State for below-chart panel | Project stack |
| tailwindcss | ^3.x (installed) | Styling consistent with rest of app | Project stack, v3 locked for shadcn compat |

**No new npm packages required.**

### Supporting

| Component / Hook | Already Exists | What Phase 13 Needs |
|-----------------|---------------|---------------------|
| `useActionItems().loadActionItems` | Yes — `src/hooks/useActionItems.ts` | Already called in `TrendPage.tsx` line 74; result array already in scope |
| `useWheel().categories` | Yes — `src/hooks/useWheel.ts` | `CategoryRow.is_important` already on the type; already in scope in `TrendPage.tsx` |
| `TrendChart` component | Yes — `src/components/TrendChart.tsx` | Potentially remove `markers` prop or leave as optional no-op if interval markers dropped |
| `ActionItemRow` type | Yes — `src/types/database.ts` | Fields needed: `text`, `is_complete`, `completed_at`, `deadline` |

---

## Architecture Patterns

### Recommended Change Set

```
src/
├── pages/
│   └── TrendPage.tsx         ← primary change file
├── components/
│   ├── TrendChart.tsx        ← minor change or no change
│   └── ActionInsightsPanel.tsx  ← NEW (or inline in TrendPage)
```

Creating `ActionInsightsPanel` as a separate component is recommended: it keeps `TrendPage` focused on data orchestration, makes the panel independently testable, and mirrors the existing pattern of small presentational components (e.g. `DueSoonWidget`).

### Pattern 1: Interval-Based Action Surfacing

**What:** For each consecutive snapshot pair (N, N+1) where `score_asis` rose, collect action items with `completed_at` between `snapshots[N].saved_at` and `snapshots[N+1].saved_at`.

**When the chart is rendered:** Show a single "Actions during improvements" section below the chart, listing those items with a label like "Between Jan 2026 → Mar 2026, you completed these and your score went from 5 → 8."

**Why this works where exact-date matching failed:** Action items are completed on any date; snapshots are saved manually, rarely on the same day. The interval model captures the relationship without requiring coincidence.

**Pseudocode:**

```typescript
// In TrendPage — replaces the current marker useEffect

const improvementIntervals = useMemo(() => {
  if (chartData.length < 2) return []
  const intervals: Array<{
    fromLabel: string
    toLabel: string
    fromDate: string  // ISO saved_at of snapshot N
    toDate: string    // ISO saved_at of snapshot N+1
    scoreDelta: number
  }> = []
  for (let i = 0; i < chartData.length - 1; i++) {
    const delta = chartData[i + 1].asis - chartData[i].asis
    if (delta > 0) {
      intervals.push({
        fromLabel: chartData[i].date,
        toLabel: chartData[i + 1].date,
        fromDate: snapshots[i].saved_at,
        toDate: snapshots[i + 1].saved_at,
        scoreDelta: delta,
      })
    }
  }
  return intervals
}, [chartData, snapshots])

const actionsByInterval = useMemo(() => {
  return improvementIntervals.map(interval => ({
    ...interval,
    items: actionItems.filter(item => {
      if (!item.completed_at) return false
      return item.completed_at >= interval.fromDate && item.completed_at <= interval.toDate
    }),
  })).filter(g => g.items.length > 0)
}, [improvementIntervals, actionItems])
```

**Note:** `actionItems` state holds the result of `loadActionItems(cat.id)` — already fetched in the existing `useEffect` on `selectedCategory`. No additional DB calls needed.

### Pattern 2: Category is_important Badge

**What:** In the category `<select>` area (or heading), display a star icon or "Priority" badge when the selected category has `is_important === true`.

**How to get the value:**

```typescript
const selectedCat = categories.find(c => c.name === selectedCategory)
const isImportant = selectedCat?.is_important ?? false
```

`categories` is already in scope from `useWheel(userId)`. No additional data fetch needed.

**Display pattern** (consistent with WheelPage star button using lucide `Star` icon):

```tsx
{isImportant && (
  <span title="Priority category" className="text-amber-500 inline-flex items-center gap-1">
    <Star size={14} fill="currentColor" /> Priority
  </span>
)}
```

### Pattern 3: All Action Items List Below Chart

**What:** Render all `actionItems` for the selected category in a read-only panel below the trend chart, grouped into "Active" and "Completed" sections.

**Why useful independent of the improvement-interval feature:** Requirement TREND-13-03 asks that items are always shown when a category is selected, regardless of whether a score improved. This is a baseline transparency feature.

**Relationship to interval panel:** The full list goes below; the "actions during improvements" callout is above the full list (or embedded as a highlight within it).

### Anti-Patterns to Avoid

- **Keeping exact-date `ReferenceLine` markers as primary approach:** They never fire unless a user happens to complete an action item on the exact date they save a snapshot. Remove or demote.
- **N+1 queries for action items:** `loadActionItems` is already called once per `selectedCategory` change. Do not add per-interval queries. Filter in memory from the already-loaded array.
- **Adding `is_important` to `snapshot_scores`:** The flag lives on `categories` (current state), not on snapshots (historical state). Do not attempt to store it historically — the phase only requires showing the current flag in the trend view.
- **Modifying `TrendChart.tsx` internals:** The `markers` prop and `ReferenceLine` rendering in `TrendChart` may be left in place (or markers simply not passed). Do not restructure the chart component's internals for this phase — the improvement is in the data layer and below-chart UI.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date comparison for intervals | Custom date parsing | ISO string comparison: `completed_at >= fromDate && completed_at <= toDate` | Both `saved_at` and `completed_at` are ISO 8601 strings from Supabase — string comparison is correct and sufficient for chronological ordering |
| Icon for is_important | Custom SVG star | `Star` from `lucide-react` (already installed, used throughout app) | Consistent with existing star usage in `WheelPage.tsx` / `CategorySlider` |
| Action item list rendering | New custom component | Reuse the same `ActionItemRow` display conventions from `WheelPage` / `ActionItemList` | Same data shape, same visual language |

---

## Common Pitfalls

### Pitfall 1: chartData index vs snapshots index misalignment

**What goes wrong:** `chartData` is built by filtering nulls out of the snapshot map (line 105–117 in current `TrendPage.tsx`). If a snapshot has no score for the selected category it is dropped from `chartData`, but it stays in `snapshots[]`. Index `i` in `chartData` does NOT necessarily correspond to index `i` in `snapshots`.

**Why it happens:** The null-filter type predicate removes unscored snapshots, making `chartData.length <= snapshots.length`.

**How to avoid:** When computing intervals, build a parallel array of `{ chartPoint, snapshot }` tuples during the same map, then use that paired array for interval computation. Alternatively, attach `savedAt` directly to `TrendChartPoint` (add a field). The latter is cleaner.

**Recommended fix:** Extend `TrendChartPoint` type:

```typescript
export type TrendChartPoint = {
  date: string
  asis: number
  tobe: number
  savedAt: string  // ISO saved_at from SnapshotRow — for interval computation
}
```

Then interval computation reads `chartData[i].savedAt` directly — no parallel array management needed.

### Pitfall 2: actionItems state cleared on category change before new items load

**What goes wrong:** If `setActionItems([])` is called synchronously at the start of the `loadActionItems` effect, there is a flash of "no items" before data arrives.

**Why it happens:** The existing effect structure in `TrendPage` uses a `cancelled` flag for snapshots but not for action items. The action items effect was added later (lines 70–101) and calls `.then()` without a cancellation guard.

**How to avoid:** Either accept the flash (acceptable for a secondary panel) or mirror the `cancelled` flag pattern from the snapshots effect.

### Pitfall 3: `is_important` not in `categories` when category was renamed

**What goes wrong:** `categories` from `useWheel` holds the CURRENT category state. If a user renamed a category, snapshot scores preserve the old name. The `selectedCategory` state is set from snapshot score category names (line 58–59 in current `TrendPage.tsx`), which may not match any current `CategoryRow.name` if the category was renamed after snapshots were taken.

**How to avoid:** The `is_important` lookup `categories.find(c => c.name === selectedCategory)` may return `undefined` if names diverged. Guard with `selectedCat?.is_important ?? false`. This is already the right approach — just be explicit. The feature degrades gracefully: if renamed, no star is shown (acceptable).

### Pitfall 4: Existing TrendPage marker tests expect old behaviour

**What goes wrong:** `TrendPage.test.tsx` has four tests (lines 281–504) that assert the old exact-date-match marker logic produces specific marker counts and colors. Changing the marker approach to interval-based will break these tests.

**How to avoid:** Plan for explicit test replacement. The old marker tests must be deleted and replaced with new interval-based tests. This is an expected and intentional change — do not try to preserve the old test assertions.

---

## Code Examples

### Extending TrendChartPoint to carry savedAt

```typescript
// Source: existing src/components/TrendChart.tsx — extend type, no breaking change
export type TrendChartPoint = {
  date: string      // formatted for display e.g. "15 Jan 2026"
  asis: number
  tobe: number
  savedAt: string   // ISO saved_at — used in TrendPage for interval math, not rendered
}
```

Recharts ignores unknown keys in data objects — adding `savedAt` to the chart data array has zero visual impact.

### Building chartData with savedAt (TrendPage.tsx replacement)

```typescript
const chartData: TrendChartPoint[] = snapshots
  .map(snap => {
    const score = allScores.find(
      s => s.snapshot_id === snap.id && s.category_name === selectedCategory
    )
    if (!score) return null
    return {
      date: formatDate(snap.saved_at),
      asis: score.score_asis,
      tobe: score.score_tobe,
      savedAt: snap.saved_at,  // added
    }
  })
  .filter((point): point is NonNullable<typeof point> => point !== null)
```

### Interval computation (TrendPage.tsx — replaces marker useEffect)

```typescript
const improvementActions = useMemo(() => {
  if (chartData.length < 2 || actionItems.length === 0) return []
  const result: Array<{ fromLabel: string; toLabel: string; scoreDelta: number; items: ActionItemRow[] }> = []
  for (let i = 0; i < chartData.length - 1; i++) {
    const delta = chartData[i + 1].asis - chartData[i].asis
    if (delta <= 0) continue
    const fromDate = chartData[i].savedAt
    const toDate = chartData[i + 1].savedAt
    const items = actionItems.filter(
      item => item.completed_at && item.completed_at >= fromDate && item.completed_at <= toDate
    )
    if (items.length > 0) {
      result.push({ fromLabel: chartData[i].date, toLabel: chartData[i + 1].date, scoreDelta: delta, items })
    }
  }
  return result
}, [chartData, actionItems])
```

### is_important badge (TrendPage.tsx)

```typescript
// At top of TrendPage, computed from already-available `categories`
const selectedCat = categories.find(c => c.name === selectedCategory)
const isImportant = selectedCat?.is_important ?? false

// In JSX, next to the category label
{isImportant && (
  <span className="inline-flex items-center gap-0.5 text-amber-500 text-xs font-medium">
    <Star size={12} fill="currentColor" aria-label="Priority category" />
    Priority
  </span>
)}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Exact-date `ReferenceLine` markers | Interval-based improvement actions panel | Phase 13 | Markers that actually appear; motivational framing |
| Action items invisible on TrendPage | Full action item list below chart | Phase 13 | Transparency — user sees what they're working on in context |
| `is_important` only visible on WheelPage | `is_important` also visible in trend view | Phase 13 | Priority categories get visual distinction everywhere |

**Existing `markers` prop / `ReferenceLine` system:**

The `TrendChart` component accepts a `markers?: TrendChartMarker[]` prop and renders `ReferenceLine` components. This machinery may be left in place and simply not used (pass `markers={[]}` or omit the prop). There is no cost to keeping the type — the component renders nothing when `markers` is empty. The decision whether to fully remove or keep as future extension point is at the planner's discretion.

---

## Open Questions

1. **Keep all-categories overview or single-category only?**
   - What we know: The current implementation is single-category only. `TREND-V2-01` (all-categories overview) is a v2 requirement, not yet scheduled.
   - What's unclear: The phase description lists this as an open question.
   - Recommendation: Resolve during planning. The success criteria for Phase 13 make no mention of an all-categories view — it is not required by any of the four success criteria. **Recommendation: keep single-category only for this phase.** The all-categories view belongs to a separate phase (v2).

2. **Remove or keep `ReferenceLine` markers in `TrendChart`?**
   - What we know: The interval-based panel replaces the functional purpose of markers. The chart internals that render `ReferenceLine` are harmless when `markers` is empty/omitted.
   - Recommendation: Leave `TrendChart.tsx` with the `markers` prop intact (optional, defaults to `[]`). Do not pass markers from `TrendPage` in the new implementation. This is a zero-risk non-change that avoids updating `TrendChart.test.tsx`.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest ^3.1.1 |
| Config file | `vite.config.ts` (vitest config inline) |
| Quick run command | `npx vitest run src/pages/TrendPage.test.tsx src/components/TrendChart.test.tsx` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TREND-13-01 | Action items completed in improvement intervals are shown below the chart | unit | `npx vitest run src/pages/TrendPage.test.tsx` | ✅ (needs new tests) |
| TREND-13-01 | No items shown when score did not improve in interval | unit | `npx vitest run src/pages/TrendPage.test.tsx` | ✅ (needs new tests) |
| TREND-13-02 | Markers no longer require exact snapshot date match | unit | `npx vitest run src/pages/TrendPage.test.tsx` | ✅ (old tests DELETED, new replace) |
| TREND-13-03 | Action items list renders below chart when category selected | unit | `npx vitest run src/pages/TrendPage.test.tsx` | ✅ (needs new tests) |
| TREND-13-04 | is_important badge visible when selected category has flag set | unit | `npx vitest run src/pages/TrendPage.test.tsx` | ✅ (needs new tests) |
| TREND-13-04 | No badge shown when is_important is false | unit | `npx vitest run src/pages/TrendPage.test.tsx` | ✅ (needs new tests) |

### Sampling Rate

- **Per task commit:** `npx vitest run src/pages/TrendPage.test.tsx src/components/TrendChart.test.tsx`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] Old marker tests in `src/pages/TrendPage.test.tsx` (lines 281–504) — MUST be deleted and replaced with interval-based tests before implementation runs against them
- [ ] No stub file needed — existing test file is updated in-place

*(If `ActionInsightsPanel` is extracted as a separate component: `src/components/ActionInsightsPanel.test.tsx` — new file needed in Wave 0)*

---

## Sources

### Primary (HIGH confidence)

- Direct code inspection: `src/pages/TrendPage.tsx` — current marker logic, action items fetch, category data shape
- Direct code inspection: `src/components/TrendChart.tsx` — `TrendChartMarker` type, `ReferenceLine` rendering
- Direct code inspection: `src/pages/TrendPage.test.tsx` — existing test contracts, mock shapes
- Direct code inspection: `src/hooks/useActionItems.ts` — `ActionItemRow` fields, `loadActionItems` signature
- Direct code inspection: `src/types/database.ts` — `CategoryRow.is_important`, `ActionItemRow.completed_at`, `SnapshotRow.saved_at`
- Direct code inspection: `src/pages/WheelPage.tsx` — `is_important` usage patterns, lucide `Star` icon precedent

### Secondary (MEDIUM confidence)

- `.planning/STATE.md` Accumulated Context decisions — established patterns for hooks, mocks, optimistic updates
- `.planning/PHASES-FORWARD-DRAFT.md` Phase 13 scope definition and open questions

### Tertiary (LOW confidence)

- None required — all domain knowledge comes from first-party code inspection

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new dependencies; all libraries already in use
- Architecture: HIGH — interval logic is a straightforward in-memory computation on already-fetched data; patterns derive directly from existing code
- Pitfalls: HIGH — root causes identified from reading the actual broken code (chartData/snapshots index misalignment, exact-date gate, test breakage)

**Research date:** 2026-03-24
**Valid until:** 2026-06-24 (stable domain — recharts, supabase, react patterns unlikely to break)
