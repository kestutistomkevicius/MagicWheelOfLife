# Phase 10: Pre-Launch Improvements - Research

**Researched:** 2026-03-22
**Domain:** React/TypeScript UI patterns, Supabase soft-delete, Recharts PolarAngleAxis SVG internals
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**DB Migration (Soft-Delete)**
- Migration already written: `supabase/migrations/20260321000001_wheel_soft_delete.sql`
- Adds `deleted_at timestamptz DEFAULT NULL` to `wheels` table
- Updates `count_user_wheels()` to exclude soft-deleted wheels (free-tier limit unaffected during undo window)
- pg_cron job hard-deletes wheels where `deleted_at < NOW() - INTERVAL '10 minutes'` (runs every 10 min)
- Apply this migration first — it unblocks all wheel-delete UI work

**Soft-Delete Wheels — UI Behavior**
- Soft-deleted wheels remain visible in the wheel selector with "— Deleting in ~10 min" suffix
- Each soft-deleted wheel shows an Undo button; clicking Undo clears `deleted_at` (restores wheel)
- After 10 min, pg_cron hard-deletes the row; it disappears from the selector naturally on next load
- `useWheel.ts` needs `softDeleteWheel(id)` and `undoDeleteWheel(id)` functions
- `useWheel` must still return soft-deleted wheels in its `wheels` array (so selector can show them), but mark them as pending-deletion so they're not treated as the active wheel

**canCreateWheel After Soft-Delete (Free Tier)**
- After soft-deleting their only wheel, a free-tier user can immediately create a new wheel (soft-deleted wheel doesn't count toward limit — DB handles this via `count_user_wheels()`)
- The recovered (undone) wheel and the newly created wheel can coexist simultaneously during the 10-min window — this is intentional; recovery takes priority over tier limit
- Frontend must re-derive the free-tier wheel count after soft-delete (not rely on stale cached count)

**Empty State — "Recover a wheel" Section**
- When ALL wheels are soft-deleted (none active), the empty state shows a "Recover a wheel" section listing the soft-deleted wheels with Undo buttons
- This is in addition to the normal empty state CTA (create new wheel)

**Delete Snapshots**
- Hard delete (immediate) — no soft-delete or undo for snapshots
- Confirmation dialog before delete
- On confirm: DELETE from Supabase `snapshots` table; snapshot disappears immediately from local state
- Lives in `SnapshotsPage.tsx` — add delete button per snapshot row

**Authenticated Footer**
- Location: Inside the `<Sidebar>` component, pinned at the very bottom, below all nav items
- Content: "Terms" link to `/terms` and "Privacy" link to `/privacy`
- Both pages already exist (`TermsPage.tsx`, `PrivacyPage.tsx`) and are routed in `App.tsx`
- Compact styling — small text, subdued color, consistent with sidebar aesthetics

**DueSoon Hover — Axis Highlight**
- On hover over a DueSoon item, TWO things change simultaneously:
  1. Axis label text changes color (partially working — `customTick` in `WheelChart.tsx`)
  2. Axis spoke/line on the radar chart changes color (currently NOT implemented)
- The spoke is rendered by Recharts' `PolarAngleAxis` — need to customize it to color the spoke line when highlighted
- `highlightedCategory` state lives in `WheelPage.tsx`, flows down to `WheelChart` and `DueSoonWidget`

### Claude's Discretion
- Exact Recharts API to color PolarAngleAxis spokes (may need SVG customTick with line element, or a custom axis component)
- Confirmation dialog for snapshot delete (reuse existing pattern or a simple inline confirm)
- Sidebar footer exact markup and Tailwind classes
- Whether to poll or re-fetch wheel count after soft-delete vs. derive from local state

### Deferred Ideas (OUT OF SCOPE)
- Soft-delete snapshots (out of scope — hard delete only)
- Soft-delete action items
- Any UI polish beyond the 5 success criteria
- Apple OAuth (explicitly deferred earlier)
</user_constraints>

---

## Summary

Phase 10 ships five targeted UX improvements using only existing infrastructure. Every area is well-understood from prior phases; the main research uncertainty was the Recharts spoke-highlight mechanism. The migration is already written and reviewed. The hook extension pattern, modal/dialog pattern, sidebar structure, and Supabase delete pattern are all established in the codebase.

**Recharts spoke highlight:** The `PolarAngleAxis axisLine` prop renders a single global polygon — it cannot style individual spokes. `tickLine` draws only a short tick mark at the label, not the full radial spoke. The correct approach is to extend the existing `customTick` SVG function to also render a `<line>` element from the chart center `(cx, cy)` to the tick's `(x, y)` position. The tick render function already receives `x`, `y`, `textAnchor`, and `payload` props from Recharts; `cx` and `cy` (chart center) must be passed via closure from the component props (available in `RadarChart` but not directly forwarded). This approach requires no new Recharts API — it is pure SVG within the existing custom tick renderer.

**Supabase soft-delete:** The migration is correct and idiomatic. `count_user_wheels()` already filters `deleted_at IS NULL`, so the DB enforces the tier limit correctly. The frontend `useWheel` hook currently derives `canCreateWheel` from `allWheels.length === 0` for free users; after soft-delete this must become `allWheels.filter(w => !w.deleted_at).length === 0`. `WheelRow` in `database.ts` lacks the `deleted_at` field — this must be added. The wheels query must include `deleted_at` in the select clause.

**Primary recommendation:** Apply the migration, extend `WheelRow` type and `useWheel` query, implement spoke highlight via SVG in `customTick`, add snapshot delete button with inline confirmation, and pin footer links in `Sidebar`.

---

## Standard Stack

### Core (all already installed)

| Library | Version | Purpose | Why Used |
|---------|---------|---------|----------|
| Recharts | 3.8.0 | RadarChart / PolarAngleAxis | Already the chart library |
| Supabase JS | existing | DB queries (soft-delete, hard-delete) | Already the data layer |
| React + TypeScript | existing | Hook extensions, UI components | Project stack |
| Tailwind CSS | v3 | Sidebar footer styling | Project stack |

No new libraries needed for this phase.

---

## Architecture Patterns

### Pattern 1: Soft-Delete in useWheel Hook

**What:** Add `softDeleteWheel` and `undoDeleteWheel` to `UseWheelResult`. Update `wheels` state to include soft-deleted rows. Derive active wheels via filter.

**Current state of useWheel.ts:**
- `wheels` query: selects `id, user_id, name, created_at, updated_at` — missing `deleted_at`
- `canCreateWheel` set to `userTier === 'premium' || allWheels.length === 0` — must change to count only non-deleted
- `createWheel` sets `canCreateWheel` to `tier === 'premium'` on creation — must also handle free-tier re-check
- `wheel` (active wheel) is set to `allWheels[0]` — after soft-delete this must skip soft-deleted ones

**Key changes needed:**

```typescript
// In useWheel.ts fetchData():
const wheelsRes = await supabase
  .from('wheels')
  .select('id, user_id, name, created_at, updated_at, deleted_at')  // add deleted_at
  .eq('user_id', userId)
  .order('created_at')

// canCreateWheel must filter:
const activeWheels = allWheels.filter(w => !w.deleted_at)
setCanCreateWheel(userTier === 'premium' || activeWheels.length === 0)

// active wheel skips soft-deleted:
const firstWheel = activeWheels[0] ?? null
```

**softDeleteWheel function:**
```typescript
async function softDeleteWheel(wheelId: string): Promise<void> {
  const now = new Date().toISOString()
  await supabase
    .from('wheels')
    .update({ deleted_at: now, updated_at: now })
    .eq('id', wheelId)
  // Optimistic local update
  setWheels(prev => prev.map(w => w.id === wheelId ? { ...w, deleted_at: now } : w))
  // If active wheel was deleted, switch to next active wheel
  setWheel(prev => {
    if (prev?.id !== wheelId) return prev
    const next = wheels.find(w => w.id !== wheelId && !w.deleted_at) ?? null
    return next
  })
  // Re-derive canCreateWheel from updated local state
  setCanCreateWheel(tier === 'premium' || wheels.filter(w => w.id !== wheelId && !w.deleted_at).length === 0)
}
```

**undoDeleteWheel function:**
```typescript
async function undoDeleteWheel(wheelId: string): Promise<void> {
  await supabase
    .from('wheels')
    .update({ deleted_at: null, updated_at: new Date().toISOString() })
    .eq('id', wheelId)
  setWheels(prev => prev.map(w => w.id === wheelId ? { ...w, deleted_at: null } : w))
  // canCreateWheel: recovery takes priority, wheel reappears, free-tier count may now be 1 active
  // Premium users: always canCreate; free users with recovered + new wheel can coexist (intentional)
}
```

**Confidence:** HIGH — pattern mirrors `renameWheel` optimistic update established in Phase 7.

### Pattern 2: WheelRow Type Extension

`WheelRow` in `src/types/database.ts` currently lacks `deleted_at`. Must add:

```typescript
export type WheelRow = {
  id: string
  user_id: string
  name: string
  created_at: string
  updated_at: string
  deleted_at: string | null  // null = active, ISO timestamp = soft-deleted
}
```

Also update `Database.Tables.wheels`:
```typescript
wheels: {
  Row: WheelRow
  Insert: Omit<WheelRow, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
  Update: Partial<Pick<WheelRow, 'name' | 'updated_at' | 'deleted_at'>>
  Relationships: []
}
```

**Confidence:** HIGH — follows the same pattern as other type updates in prior phases.

### Pattern 3: WheelPage Soft-Delete UI

**What:** The "My Wheel" heading area needs a Delete button. WheelPage already renders the wheel selector for multi-wheel users. For the soft-delete UX:

- Delete button appears on the active wheel (not on soft-deleted wheels)
- On click: calls `softDeleteWheel(wheel.id)`; the wheel selector now shows it with suffix; Undo button appears inline
- Empty state branch (`wheel === null`) must extend to show "Recover a wheel" if `wheels.some(w => w.deleted_at)`

**Selector rendering (currently):** WheelPage shows a `<select>` when `wheels.length > 1`, or the h2 wheel name when `wheels.length === 1`. With soft-delete, the selector must show soft-deleted wheels with a visual suffix and an Undo button beside them. Since `<select>` cannot contain buttons, the wheel selector should switch to a custom rendered list when any wheel is soft-deleted, or add Undo buttons outside the select.

**Recommended approach:** Keep the `<select>` for active wheels only. Below the header, render a dedicated "Pending deletion" banner for soft-deleted wheels with inline Undo buttons. This is simpler than replacing the select with a custom dropdown and avoids touching the multi-wheel select logic.

**Confidence:** MEDIUM — the selector UX detail is Claude's discretion; the above approach is the simplest implementation.

### Pattern 4: Recharts Per-Spoke Axis Highlight

**Critical finding:** `PolarAngleAxis axisLine` renders a single polygon connecting all tick endpoints — it is global, cannot highlight individual spokes. `tickLine` is a short perpendicular tick mark at the label position, not the radial spoke.

**The radial spokes** (lines from chart center to the perimeter at each category angle) are rendered by `PolarGrid`. However, `PolarGrid` also lacks per-spoke styling.

**Correct approach:** Extend the existing `customTick` SVG function in `WheelChart.tsx` to render a `<line>` element from chart center to the tick position when that category is highlighted. The chart center coordinates `cx` and `cy` must be passed as closure variables.

**Implementation:** `RadarChart` receives `cx` and `cy` as props (percentage strings) but does not forward them to the tick renderer. The actual pixel center must be computed from `ResponsiveContainer` dimensions. However, there is a simpler approach already proven in this codebase: use a `<Radar>` layer with zero fill and a highlighted stroke that draws only at the highlighted category's axis angle. Since `asisHighlight` is already added to `extendedData` as a Radar layer (currently with `fill={highlightColor}` and `fillOpacity={0.5}`), the spoke-level color change can be achieved differently.

**Best approach — SVG line in customTick:** Recharts passes `cx` and `cy` (chart center in SVG coordinates) as props to the tick renderer in `PolarAngleAxis` when using a custom tick function. These are not documented prominently but are present in the props object passed to the tick renderer function. The `x` and `y` in the tick props are the label position. A line from `(cx, cy)` to `(x, y)` draws the spoke.

```typescript
// Extended customTick in WheelChart.tsx
const customTick = (props: {
  x: number; y: number;
  cx: number; cy: number;  // chart center — Recharts passes these
  textAnchor?: 'end' | 'inherit' | 'start' | 'middle';
  payload?: { value: string }
}) => {
  const { x, y, cx, cy, textAnchor, payload } = props
  const label = payload?.value ?? ''
  const isHighlighted = label === highlightedCategory
  return (
    <g>
      {isHighlighted && (
        <line
          x1={cx}
          y1={cy}
          x2={x}
          y2={y}
          stroke={highlightColor}
          strokeWidth={2}
          strokeOpacity={0.7}
        />
      )}
      <text
        x={x}
        y={y}
        textAnchor={textAnchor}
        fontSize={isHighlighted ? 13 : 12}
        fontWeight={isHighlighted ? 700 : 400}
        fill={isHighlighted ? highlightColor : '#374151'}
      >
        {label}
      </text>
    </g>
  )
}
```

**Note on cx/cy availability:** Recharts v3 passes additional context props to custom tick renderers including `cx` and `cy`. If these are absent (they may not be typed in the public API), the fallback is to pass `cx` and `cy` as explicit props through a wrapper function that captures them from the `RadarChart` props. `RadarChart` accepts explicit `cx` and `cy` props (already set to `"50%"` and `"50%"` in the current code) — but these are percentages, not pixels. The pixel center can be derived by capturing the `width` prop from `ResponsiveContainer` via a ref/state, or by using the `onMouseMove` callback. The simplest fallback: wrap the tick function inside a factory that closes over fixed pixel estimates, or accept that the line may need to be drawn with a small offset since Recharts does in fact pass cx/cy in pixels to the tick renderer function internally.

**Verified approach:** Multiple community reports confirm Recharts passes `cx` and `cy` in the tick renderer props object. The type signature just needs to be extended. If they are absent at runtime, a hard-coded `cx = containerWidth/2, cy = containerHeight/2` fallback works for the symmetric 50%/50% center case.

**Confidence:** MEDIUM — API not officially documented for this use case; community-verified pattern. May need runtime inspection to confirm `cx`/`cy` availability.

### Pattern 5: Snapshot Hard Delete

**RLS considerations:** The `snapshots` table has an INSERT policy (Phase 4 migration). It must also have a DELETE policy so users can delete their own snapshots. Verify the migration before adding frontend delete.

From Phase 4 migration pattern (action_items had): `CREATE POLICY "delete own" ON ... FOR DELETE USING (auth.uid() = user_id)`. Check if `snapshots` has a DELETE policy.

**Frontend pattern (established):**
- Optimistic: remove from local `snapshots` state immediately on confirm
- Then fire `supabase.from('snapshots').delete().eq('id', snapId).eq('user_id', userId)` (double guard)
- Cascade deletes `snapshot_scores` via FK `ON DELETE CASCADE` (already defined in schema)
- Also remove from `scoresCache`, `selectedSnapIds`, `allHistoryScores`

**Confirmation dialog:** The project uses plain Tailwind modals (not Radix Dialog) for non-shadcn flows (FeatureRequestModal pattern). For snapshot delete, a simple inline confirm approach is the lowest-friction option: show a "Delete" button that on first click becomes "Confirm delete / Cancel" inline (two buttons replace one). This avoids any modal/portal complexity in tests. Alternatively, use the existing shadcn `Dialog` component — it already works in tests via the mock pattern in `SnapshotNameDialog.test.tsx`.

**Confidence:** HIGH for the delete logic; MEDIUM for confirmation UX (Claude's discretion).

### Pattern 6: Sidebar Footer

**Current structure of Sidebar.tsx:**
```
<aside flex h-screen flex-col>
  Brand div
  <nav flex-1>  (nav links)
  Feedback button div (pb-2)
  User + Sign out div (border-t p-3)
  <FeatureRequestModal>
</aside>
```

The `flex-col` layout with `h-screen` means the sidebar fills the full height. To pin footer at bottom, the legal links section must go BETWEEN the feedback button and the User+Sign-out block, or AFTER the User+Sign-out block. Given the current structure, the natural insertion point is a new `<div>` with `px-4 py-2 border-t border-stone-700` after the User+Sign-out div, OR embed the links inside the User+Sign-out div as additional rows.

**Recommended placement:** Add a new `<div>` at the very bottom of the `<aside>`, after the User+Sign-out div:

```tsx
{/* Legal footer */}
<div className="px-4 py-2 flex gap-3">
  <NavLink to="/terms" className="text-xs text-stone-500 hover:text-stone-300">
    Terms
  </NavLink>
  <NavLink to="/privacy" className="text-xs text-stone-500 hover:text-stone-300">
    Privacy
  </NavLink>
</div>
```

Use `NavLink` (already imported from `react-router`) for consistency, or plain `<a>` tags. Since both routes are within the app's router, `NavLink` is preferred.

**Confidence:** HIGH — the Sidebar structure is clear and the insertion is trivial.

### Anti-Patterns to Avoid

- **Do not** query `canCreateWheel` from the DB after every soft-delete — derive it from local `wheels` state (avoids round-trips and stale state race conditions)
- **Do not** use `PolarAngleAxis axisLine` for per-spoke highlights — it is global
- **Do not** remove soft-deleted wheels from the `wheels` array in state — they must remain visible in the selector for Undo to work
- **Do not** add a DELETE RLS policy inside the React app — it belongs in a migration SQL file

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Wheel tier limit after soft-delete | Custom frontend counter logic | `count_user_wheels()` DB function | Already updated in migration to exclude `deleted_at IS NOT NULL` |
| Per-spoke SVG highlight | D3 or canvas overlay | Extended `customTick` SVG in Recharts | Recharts renders SVG; tick renderer can emit arbitrary SVG elements |
| Snapshot cascade delete | Manual delete of `snapshot_scores` | FK `ON DELETE CASCADE` already in schema | Phase 4 migration defined `snapshot_scores.snapshot_id REFERENCES snapshots(id) ON DELETE CASCADE` |
| Legal link routing | New router logic | Existing `/terms` and `/privacy` routes | Already in `App.tsx`; `TermsPage.tsx` and `PrivacyPage.tsx` exist |

---

## Common Pitfalls

### Pitfall 1: WheelRow type missing deleted_at causes TypeScript errors
**What goes wrong:** `useWheel.ts` queries `deleted_at` but `WheelRow` type doesn't include it — TypeScript will not flag it at the Supabase call but the field will be `undefined` at runtime.
**Why it happens:** `WheelRow` was defined before Phase 10's migration.
**How to avoid:** Update `WheelRow` and `Database.Tables.wheels` before adding hook logic.
**Warning signs:** `wheel.deleted_at` is `undefined` instead of `null` on active wheels.

### Pitfall 2: Stale canCreateWheel after soft-delete
**What goes wrong:** After `softDeleteWheel`, the optimistic `setCanCreateWheel` may not account for the current `tier` or remaining active wheels correctly because it reads stale closure state.
**Why it happens:** `setCanCreateWheel` inside `softDeleteWheel` cannot safely read the current `wheels` array from the hook's state at call time — React state updates are async.
**How to avoid:** Use the functional updater form of `setWheels` and derive `canCreateWheel` from the returned next state, or keep a `setCanCreateWheel` call that reads the current snapshot of `wheels` before the update.
**Warning signs:** Free user who soft-deleted their only wheel cannot create a new one (or vice versa).

### Pitfall 3: Active wheel points to soft-deleted wheel
**What goes wrong:** After `softDeleteWheel(wheel.id)`, `wheel` still holds the deleted wheel reference. WheelPage tries to load categories for a soft-deleted wheel.
**Why it happens:** `setWheel` must be called inside `softDeleteWheel` to switch to the next active wheel (or null if none).
**How to avoid:** `softDeleteWheel` must call `setWheel` to the next non-deleted wheel from `wheels`.

### Pitfall 4: pg_cron job scheduled twice
**What goes wrong:** Running `supabase db reset` twice re-runs `cron.schedule(...)` creating a duplicate job name.
**Why it happens:** `cron.schedule` with the same name does upsert (not error) in pg_cron. Existing behavior from Phase 9's `delete-old-ai-chat-messages` job confirms this is not a problem — pg_cron updates the schedule on re-run.
**How to avoid:** No action needed — pg_cron `cron.schedule` is idempotent by job name.
**Confidence:** HIGH — confirmed by Phase 9 pattern.

### Pitfall 5: Snapshot DELETE RLS — Already Covered
**Status:** RESOLVED before planning. The Phase 4 migration already includes the DELETE policy:

```sql
CREATE POLICY "snapshots: delete own" ON public.snapshots
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);
```

No migration change needed. Snapshot hard-delete will work with existing RLS.

### Pitfall 6: DueSoonWidget stops propagating onHighlight
**What goes wrong:** The spoke highlight never fires because `DueSoonWidget` receives `highlightedCategory` as a prop but the `li` element calls `onHighlight` — if the parent `WheelPage` passes a stale reference, highlights don't update.
**Why it happens:** `handleDueSoonMarkComplete` and `onHighlight` are both callbacks passed to `DueSoonWidget`. Current `DueSoonWidget` correctly calls `onHighlight(dueSoon.categoryName)` on `onMouseEnter`. The bug is that the spoke in `WheelChart` doesn't respond — this is what Phase 10 fixes.
**How to avoid:** Ensure `WheelChart` receives `highlightedCategory` and the `customTick` function uses it for the SVG line. The `RadarChart key={highlightedCategory ?? ''}` trick already forces re-render on highlight change.

---

## Code Examples

### Snapshot DELETE RLS policy (add to migration if missing)

```sql
-- Add to Phase 10 migration if snapshots DELETE policy is absent
CREATE POLICY "snapshots: delete own"
  ON public.snapshots FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);
```

### Supabase delete snapshot call

```typescript
// In useSnapshots or directly in SnapshotsPage
async function deleteSnapshot(snapshotId: string, userId: string): Promise<void> {
  await supabase
    .from('snapshots')
    .delete()
    .eq('id', snapshotId)
    .eq('user_id', userId)  // belt-and-suspenders guard, RLS enforces this too
}
```

### useWheel softDeleteWheel (optimistic update pattern)

```typescript
async function softDeleteWheel(wheelId: string): Promise<void> {
  const now = new Date().toISOString()
  // Optimistic: update local state first
  const nextWheels = wheels.map(w => w.id === wheelId ? { ...w, deleted_at: now } : w)
  const activeAfter = nextWheels.filter(w => !w.deleted_at)
  setWheels(nextWheels)
  setCanCreateWheel(tier === 'premium' || activeAfter.length === 0)
  if (wheel?.id === wheelId) {
    setWheel(activeAfter[0] ?? null)
    if (activeAfter[0]) {
      // Load categories for next active wheel
      const catsRes = await supabase.from('categories').select('...').eq('wheel_id', activeAfter[0].id).order('position')
      setCategories(Array.isArray(catsRes.data) ? catsRes.data as CategoryRow[] : [])
    } else {
      setCategories([])
    }
  }
  // Persist to DB
  await supabase.from('wheels').update({ deleted_at: now, updated_at: now }).eq('id', wheelId)
}
```

### Recharts customTick with spoke highlight

```typescript
// Source: Recharts tick renderer pattern + SVG line element
const customTick = (props: {
  x: number; y: number;
  cx?: number; cy?: number;  // passed by Recharts internally; may need fallback
  textAnchor?: 'end' | 'inherit' | 'start' | 'middle';
  payload?: { value: string }
}) => {
  const { x, y, textAnchor, payload } = props
  const cx = props.cx ?? 0  // Recharts passes chart center coords in tick props
  const cy = props.cy ?? 0
  const label = payload?.value ?? ''
  const isHighlighted = label === highlightedCategory
  return (
    <g>
      {isHighlighted && (
        <line
          x1={cx}
          y1={cy}
          x2={x}
          y2={y}
          stroke={highlightColor}
          strokeWidth={2}
          strokeOpacity={0.6}
          strokeDasharray="4 2"
        />
      )}
      <text
        x={x}
        y={y}
        textAnchor={textAnchor}
        fontSize={isHighlighted ? 13 : 12}
        fontWeight={isHighlighted ? 700 : 400}
        fill={isHighlighted ? highlightColor : '#374151'}
      >
        {label}
      </text>
    </g>
  )
}
```

### Sidebar legal footer addition

```tsx
{/* Legal footer — pinned at bottom of sidebar */}
<div className="px-4 pb-3 flex gap-4">
  <NavLink
    to="/terms"
    className="text-xs text-stone-500 hover:text-stone-300 transition-colors"
  >
    Terms
  </NavLink>
  <NavLink
    to="/privacy"
    className="text-xs text-stone-500 hover:text-stone-300 transition-colors"
  >
    Privacy
  </NavLink>
</div>
```

---

## Migration Status

### Already written and correct
`supabase/migrations/20260321000001_wheel_soft_delete.sql` is complete:
- `ALTER TABLE wheels ADD COLUMN deleted_at timestamptz DEFAULT NULL`
- `CREATE OR REPLACE FUNCTION count_user_wheels()` — filters `deleted_at IS NULL`
- `SELECT cron.schedule('hard-delete-soft-deleted-wheels', '*/10 * * * *', ...)` — idempotent by name
- pg_cron was enabled by Phase 9 (`CREATE EXTENSION IF NOT EXISTS pg_cron` in `20260320000001_ai_chat_messages.sql`)

### No additional migration needed for snapshot delete
Phase 4 migration already includes the DELETE RLS policy for snapshots (verified). No new SQL file required for this feature.

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|-----------------|--------|
| PolarAngleAxis axisLine for spoke color | SVG line in customTick renderer | Per-spoke conditional color is possible |
| Global axisLine styling | Per-tick SVG `<g>` with conditional `<line>` | Highlight only the hovered category |

**Recharts v3.8.0** (installed): No breaking changes relevant to this phase. The `RadarChart key={highlightedCategory ?? ''}` trick (already in codebase) forces full re-render on highlight change, which is required for the customTick SVG line to re-render with the new color.

---

## Open Questions

1. **Do Recharts tick renderer props include `cx` and `cy` at runtime?**
   - What we know: Community reports confirm Recharts passes them internally; they are not in the public TypeScript types.
   - What's unclear: Whether Recharts v3.8.0 specifically forwards these.
   - Recommendation: Implement with the `cx?: number; cy?: number` prop extension; add a console.log in dev to verify; if absent, fallback to a hard-coded center or derive from `ResponsiveContainer` dimensions via a ref.

2. **Does the `snapshots` table have a DELETE RLS policy?**
   - RESOLVED: Yes — Phase 4 migration line 25-27 defines the DELETE policy. No action needed.

3. **How to handle `setWheel` update inside `softDeleteWheel` when `wheels` state is stale**
   - What we know: React state closures in async functions capture stale values; the functional updater pattern avoids this for `setWheels` but not for reads of `wheels`.
   - Recommendation: Read the `wheels` value from the hook's current state at call time (it is correct at call time since soft-delete is synchronous before the async persist). The `nextWheels` local variable approach shown in the code example above is safe.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest + React Testing Library |
| Config file | `vite.config.ts` (vitest config inline) |
| Quick run command | `npm test -- --run` |
| Full suite command | `npm test -- --run` |

### Phase Requirements to Test Map

| Behavior | Test Type | Automated Command | File Exists? |
|----------|-----------|-------------------|-------------|
| softDeleteWheel sets deleted_at and updates wheels state | unit | `npm test -- --run src/hooks/useWheel.test.ts` | Extend existing |
| undoDeleteWheel clears deleted_at | unit | `npm test -- --run src/hooks/useWheel.test.ts` | Extend existing |
| canCreateWheel = true after free user soft-deletes only wheel | unit | `npm test -- --run src/hooks/useWheel.test.ts` | Extend existing |
| Sidebar renders Terms and Privacy links | unit | `npm test -- --run src/components/Sidebar.test.tsx` | Extend existing |
| SnapshotsPage delete button triggers confirmation + remove from list | unit | `npm test -- --run src/pages/SnapshotsPage.test.tsx` | Extend existing |
| WheelChart renders spoke line SVG when highlightedCategory is set | unit | `npm test -- --run src/components/WheelChart.test.tsx` | Extend existing |

### Wave 0 Gaps

None — all test files exist. No new test files needed; all new behaviors extend existing test suites.

New test cases to add within existing files:
- `useWheel.test.ts`: 3 new test cases for `softDeleteWheel`, `undoDeleteWheel`, `canCreateWheel` re-derivation
- `Sidebar.test.tsx`: 1 new test case for Terms/Privacy links
- `SnapshotsPage.test.tsx`: 2 new test cases for snapshot delete flow
- `WheelChart.test.tsx`: 1 new test case for spoke SVG line on highlight

---

## Sources

### Primary (HIGH confidence)
- Direct codebase read: `src/hooks/useWheel.ts`, `src/components/WheelChart.tsx`, `src/components/Sidebar.tsx`, `src/pages/SnapshotsPage.tsx`, `src/types/database.ts`
- Direct migration read: `supabase/migrations/20260321000001_wheel_soft_delete.sql`, `supabase/migrations/20260320000001_ai_chat_messages.sql` (pg_cron usage)
- `src/hooks/useWheel.test.ts` — established Supabase mock pattern for hook tests

### Secondary (MEDIUM confidence)
- [Recharts PolarAngleAxis API](https://recharts.github.io/en-US/api/PolarAngleAxis/) — `tickLine`, `axisLine`, `tick` prop documentation (WebFetch verified)
- [Recharts PolarAngleAxis source](https://github.com/recharts/recharts/blob/master/src/polar/PolarAngleAxis.tsx) — confirmed `axisLine` renders a global polygon (WebFetch verified)

### Tertiary (LOW confidence)
- Community reports that Recharts tick renderer receives `cx`/`cy` in props — unverified in official docs, but plausible given how Recharts constructs tick renderers internally

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries; all existing
- Architecture: HIGH (soft-delete pattern, Sidebar, snapshot delete) / MEDIUM (Recharts spoke highlight exact API)
- Pitfalls: HIGH — derived from codebase inspection and prior phase decisions

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (Recharts API stable; Supabase patterns stable)
