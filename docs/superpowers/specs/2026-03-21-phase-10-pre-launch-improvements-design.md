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
- Add a `pg_cron` scheduled job that hard-deletes `WHERE deleted_at < now() - interval '10 minutes'` (same pattern as the `ai_chat_messages` cleanup added in Phase 9).

### Hook — `useWheel.ts`

- `deleteWheel(wheelId: string)`: sets `deleted_at = now()` on the given wheel. Does NOT hard-delete.
- `undoDeleteWheel(wheelId: string)`: clears `deleted_at` (sets to NULL).
- Wheel fetch query returns all wheels for the user regardless of `deleted_at` so soft-deleted wheels remain available for recovery.
- Add both methods to the `UseWheelResult` interface.

### Auto-select on Delete

When `deleteWheel` is called on the current wheel:
1. Filter remaining `wheels` to those where `deleted_at IS NULL`.
2. If any remain: sort by `created_at DESC`, call `selectWheel(remaining[0].id)`.
3. If none remain: set `wheel = null`, `categories = []` — the existing empty state in WheelPage activates.

### Dropdown (WheelPage and SnapshotsPage and TrendPage wheel selectors)

Soft-deleted wheels appear in every `<select>` with their name suffixed: `"[Name] — Deleting in ~10 min"`. The `<option>` for a soft-deleted wheel uses `className="text-red-400"`.

### Undo Banner (WheelPage)

When the user selects a soft-deleted wheel:
- A red dismissible banner renders at the top of the WheelPage content area: *"This wheel is scheduled for deletion in ~10 min."* with an **Undo** button.
- Clicking Undo calls `undoDeleteWheel(wheel.id)`. The banner disappears and the dropdown option returns to normal styling.
- The wheel's content (categories, sliders, chart) loads normally even when soft-deleted.

### Recovery from Empty State

When `wheel === null` but `wheels` contains soft-deleted entries, the existing empty state renders a **"Recover a wheel"** section above the "Create my wheel" button. Each soft-deleted wheel appears as a row with its name and an **Undo** button.

### Delete Affordance

- A trash icon button (`Trash2` from Lucide) is added to the WheelPage header, placed after the "+ New wheel" button.
- Styled `text-stone-400 hover:text-red-500 p-1.5` — unobtrusive until hovered.
- Clicking opens an `AlertDialog`: *"Delete '[Wheel Name]'? The wheel will be permanently deleted in 10 minutes. You can undo this from the wheel selector."*
- Confirm button: *"Schedule deletion"* (not "Delete" — matches the soft-delete semantics).

---

## Feature 2: Delete Snapshot (hard delete)

### Hook — `useSnapshots.ts`

Add `deleteSnapshot(snapshotId: string): Promise<void>`:
- `supabase.from('snapshots').delete().eq('id', snapshotId)` — cascade on FK handles `snapshot_scores`.

### UI — `SnapshotsPage.tsx`

- Add a `Trash2` icon button to the right of each snapshot row (after the date), always visible.
- Clicking opens an `AlertDialog`: *"Delete '[Snapshot Name]'? This cannot be undone."*
- Confirm button: *"Delete snapshot"* (destructive styling).
- On confirm: remove snapshot from `snapshots` array, remove its entry from `scoresCache`, filter its scores from `allHistoryScores`, and remove from `selectedSnapIds` if selected.

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
- Uses existing `/terms` and `/privacy` routes.

---

## Feature 4: Fix POLISH-02 Hover Highlight

### Problem

`WheelChart` uses `key={highlightedCategory ?? ''}` on `<RadarChart>` to force a remount when the hovered category changes. This causes `ResponsiveContainer` to recalculate dimensions for the new instance and may render blank during the transition, making the highlight invisible.

### Fix

Remove `key={highlightedCategory ?? ''}` from `<RadarChart>`. The `extendedData` array already recomputes `asisHighlight` correctly on every render (since `highlightedCategory` is a prop), and all `<Radar>` components already have `isAnimationActive={false}`. React's normal reconciliation will update the SVG paths in place without a remount.

### Fallback (if fix is insufficient)

If the highlight still does not appear after removing `key`, add a `console.log(highlightedCategory, extendedData)` in WheelChart to verify:
1. The prop is reaching the component with the correct value.
2. The `asisHighlight` value is non-zero for the expected category.

If values are correct but SVG still does not update, the cause is a Recharts internal caching issue — apply `key` to only the Highlighted `<Radar>` component rather than the entire `<RadarChart>`.

---

## Roadmap Changes

- Phase 10 renamed from "Launch" to "Pre-Launch Improvements" with the scope above.
- Launch moves to Phase 15 (numbering gap reserved for upcoming planned phases).
- ROADMAP.md updated to reflect new phase names, goals, and success criteria.

---

## Success Criteria

1. User can soft-delete a wheel; it remains visible in the dropdown marked *"— Deleting in ~10 min"* and is recoverable via Undo for 10 minutes.
2. If all wheels are soft-deleted, the empty state shows a recovery section with Undo buttons.
3. User can hard-delete a snapshot from the Snapshots page; it disappears immediately from all lists.
4. A footer with Terms and Privacy links is visible at the bottom of every authenticated page.
5. Hovering a due-soon item in DueSoonWidget highlights the corresponding category axis in WheelChart.
6. Todos #1 and #8 are closed (confirmed already built).
