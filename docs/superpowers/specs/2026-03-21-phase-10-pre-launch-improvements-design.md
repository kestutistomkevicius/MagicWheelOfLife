# Phase 10: Pre-Launch Improvements — Design Spec

**Date:** 2026-03-21
**Branch:** phase/10-launch (to be renamed phase/10-pre-launch-improvements)
**Status:** Approved

## Overview

Phase 10 delivers four user-facing improvements before launch: soft-delete for wheels with a 10-minute recovery window, hard-delete for snapshots, a footer with legal links in authenticated views, and a fix for the non-working hover highlight on the wheel chart. Two todos (#1 wheel selector on TrendPage, #8 rename wheel) are confirmed already built and will be closed from the pending list.

---

## Feature 1: Delete Wheel (soft-delete with 10-minute recovery)

### DB Migration

- Add `deleted_at timestamptz DEFAULT NULL` to `wheels` table.
- Update `count_user_wheels()` SECURITY DEFINER function to filter `WHERE deleted_at IS NULL` so the free-tier wheel limit only counts active wheels.
- Add a `pg_cron` scheduled job (`'*/10 * * * *'`) that hard-deletes wheels `WHERE deleted_at < now() - interval '10 minutes'` — same pattern as the `ai_chat_messages` cleanup added in Phase 9.

### TypeScript Types

- Add `deleted_at: string | null` to `WheelRow` in `src/types/database.ts`.
- Add `deleted_at?: string | null` to `Database.Tables.wheels.Update`.

### Hook — `useWheel.ts`

**Fetch query**: Add `deleted_at` to the SELECT column list so soft-deleted wheels carry their `deleted_at` value in React state. The query currently selects `'id, user_id, name, created_at, updated_at'` — extend it to include `deleted_at`.

**`canCreateWheel`**: The existing client-side computation must filter soft-deleted wheels. Change the wheel-count check from `allWheels.length` to `allWheels.filter(w => !w.deleted_at).length`. This ensures a free-tier user who soft-deleted their only wheel can create a new one.

**`deleteWheel(wheelId: string)`**:
1. Call `supabase.from('wheels').update({ deleted_at: new Date().toISOString() }).eq('id', wheelId).eq('user_id', userId)`.
2. Update local `wheels` state: `setWheels(prev => prev.map(w => w.id === wheelId ? { ...w, deleted_at: new Date().toISOString() } : w))`.
3. Auto-select: filter wheels to those with `deleted_at === null`, sort by `created_at ASC` (matching the existing fetch order), pick the last element (most recently created non-deleted wheel).
4. If none remain: `setWheel(null)`, `setCategories([])`, and `setCanCreateWheel(true)` — so a free-tier user can immediately create a new wheel in the same session without refreshing.
5. If one remains: call `selectWheel(remaining[remaining.length - 1].id)`.

**`undoDeleteWheel(wheelId: string)`**:
1. Call `supabase.from('wheels').update({ deleted_at: null }).eq('id', wheelId).eq('user_id', userId)`.
2. Update local `wheels` state: `setWheels(prev => prev.map(w => w.id === wheelId ? { ...w, deleted_at: null } : w))`.
3. If `tier === 'free'` and the restored wheel is the only active wheel, call `setCanCreateWheel(false)` to re-enforce the free-tier limit.

Add both methods to the `UseWheelResult` interface.

### RLS UPDATE Policy

The existing "wheels: update own" RLS policy allows row owners to UPDATE any column. No change required — `deleted_at` is safe to make writable by the row owner since the policy is row-scoped (not column-scoped).

### Delete Affordance — WheelPage

- A `Trash2` (lucide-react) icon button is added to the WheelPage header, placed after the "+ New wheel" button.
- Styled `text-stone-400 hover:text-red-500 p-1.5` — unobtrusive until hovered.
- Clicking opens an inline `AlertDialog` (use the `AlertDialog` primitives from `@/components/ui/alert-dialog` directly in WheelPage — no separate component file needed, consistent with the inline `SnapshotWarningDialog` usage pattern already in WheelPage).
- Dialog text: *"Delete '[Wheel Name]'? The wheel will be permanently deleted in 10 minutes. You can undo this from the wheel selector."*
- Confirm button label: *"Schedule deletion"* (not "Delete" — matches the soft-delete semantics).

### Dropdown (WheelPage, SnapshotsPage, TrendPage wheel selectors)

Soft-deleted wheels appear in every `<select>` with their name suffixed: `"[Name] — Deleting in ~10 min"`. The `<option>` for a soft-deleted wheel uses `className="text-red-400"`.

### Undo Banner — WheelPage only

When the user selects a soft-deleted wheel on **WheelPage**:
- A red dismissible banner renders at the top of the WheelPage content area: *"This wheel is scheduled for deletion in ~10 min."* with an **Undo** button.
- Clicking Undo calls `undoDeleteWheel(wheel.id)`. The banner disappears and the dropdown option returns to normal styling.
- The wheel's content (categories, sliders, chart) loads normally even when soft-deleted.

**Note**: SnapshotsPage and TrendPage show the soft-deleted label in the dropdown but do not show an undo banner. Users who want to recover a wheel must navigate to WheelPage. This is intentional — WheelPage is the owner of wheel-level actions.

### Recovery from Empty State — WheelPage

When `wheel === null` but `wheels` contains soft-deleted entries (`deleted_at !== null`), the existing empty state renders a **"Recover a wheel"** section above the "Create my wheel" button. Each soft-deleted wheel appears as a row with its name and an **Undo** button that calls `undoDeleteWheel`.

---

## Feature 2: Delete Snapshot (hard delete)

### Hook — `useSnapshots.ts`

Add `deleteSnapshot(snapshotId: string): Promise<void>`:
- `supabase.from('snapshots').delete().eq('id', snapshotId)` — cascade on FK handles `snapshot_scores` automatically.
- Add to `UseSnapshotsResult` interface.

### UI — `SnapshotsPage.tsx`

- Add a `Trash2` icon button to the right of each snapshot row (after the date), always visible.
- Clicking opens an inline `AlertDialog` (same pattern — use primitives directly in SnapshotsPage, no separate component file).
- Dialog text: *"Delete '[Snapshot Name]'? This cannot be undone."*
- Confirm button label: *"Delete snapshot"* (destructive styling — red background).
- On confirm, batch all four state updates in a single handler to avoid stale intermediate renders:

```ts
async function handleDeleteSnapshot(snapshotId: string) {
  await deleteSnapshot(snapshotId)
  setSnapshots(prev => prev.filter(s => s.id !== snapshotId))
  setScoresCache(prev => { const next = { ...prev }; delete next[snapshotId]; return next })
  setAllHistoryScores(prev => prev.filter(s => s.snapshot_id !== snapshotId))
  setSelectedSnapIds(prev => { const next = new Set(prev); next.delete(snapshotId); return next })
}
```

---

## Feature 3: Footer in Authenticated Views

### `AppShell.tsx`

Wrap the existing `<main>` in a `flex-col` sibling container alongside a new `<footer>`:

```tsx
<div className="flex flex-col flex-1 overflow-hidden">
  <main className="flex-1 overflow-y-auto">
    <Outlet />
  </main>
  <footer className="shrink-0 border-t border-stone-200 py-3 px-6 text-center text-xs text-stone-400">
    © 2026 ·{' '}
    <Link to="/terms" className="hover:underline hover:text-stone-600">Terms</Link>
    {' · '}
    <Link to="/privacy" className="hover:underline hover:text-stone-600">Privacy</Link>
  </footer>
</div>
```

- `main` stays scrollable (`flex-1 overflow-y-auto`).
- `footer` stays pinned at the bottom (`shrink-0`), does not scroll with content.
- Uses existing `/terms` and `/privacy` routes (confirmed present in `App.tsx`).
- Import `Link` from `react-router`.

---

## Feature 4: Fix POLISH-02 Hover Highlight

### Problem

`WheelChart` uses `key={highlightedCategory ?? ''}` on `<RadarChart>` (line 71) to force a remount when the hovered category changes. This causes `ResponsiveContainer` to recalculate dimensions for the new instance and may render blank during the transition, making the highlight invisible in the browser.

### Fix

Remove `key={highlightedCategory ?? ''}` from `<RadarChart>`. The `extendedData` array already recomputes `asisHighlight` correctly on every render (since `highlightedCategory` is a prop), and all `<Radar>` components already have `isAnimationActive={false}`. React's normal reconciliation will update the SVG paths in place without a remount.

### Fallback (conditional — requires UAT to verify)

If the highlight still does not appear in the browser after removing `key`, the cause is likely a Recharts internal caching issue. In that case:
1. Add `console.log('highlight:', highlightedCategory, extendedData)` in WheelChart to verify the prop arrives with the correct value and `asisHighlight` is non-zero.
2. If values are correct but SVG still does not update: apply `key={highlightedCategory ?? ''}` to only the Highlighted `<Radar>` component (not the entire `<RadarChart>`).

**UAT is required** to verify the fix works in the browser before closing this item. The fix cannot be verified from code review alone.

---

## Roadmap Changes

- Phase 10 renamed from "Launch" to "Pre-Launch Improvements" with the scope above.
- Launch moves to Phase 15 (numbering gap reserved for upcoming planned phases).
- ROADMAP.md updated to reflect new phase names, goals, and success criteria.

---

## Success Criteria

1. User can soft-delete a wheel; it remains visible in the dropdown marked *"— Deleting in ~10 min"* and is recoverable via the Undo button on WheelPage for 10 minutes.
2. If all wheels are soft-deleted, the empty state shows a recovery section with Undo buttons per wheel.
3. User can hard-delete a snapshot from the Snapshots page; it disappears immediately from all lists and the comparison selection.
4. A footer with Terms and Privacy links is visible at the bottom of every authenticated page, pinned and non-scrolling.
5. Hovering a due-soon item in DueSoonWidget highlights the corresponding category axis in WheelChart (verified in browser via UAT).
6. Todos #1 and #8 are closed (confirmed already built).
