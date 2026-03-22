# Phase 10: Pre-Launch Improvements - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning
**Source:** /gsd:discuss-phase session

<domain>
## Phase Boundary

This phase ships 5 targeted UX improvements before launch: soft-delete wheels with 10-min undo, hard-delete snapshots, authenticated footer with legal links, and the DueSoon hover→axis highlight bug fix. No new features — only the 5 success criteria from ROADMAP.md.

</domain>

<decisions>
## Implementation Decisions

### DB Migration (Soft-Delete)
- Migration already written: `supabase/migrations/20260321000001_wheel_soft_delete.sql`
- Adds `deleted_at timestamptz DEFAULT NULL` to `wheels` table
- Updates `count_user_wheels()` to exclude soft-deleted wheels (free-tier limit unaffected during undo window)
- pg_cron job hard-deletes wheels where `deleted_at < NOW() - INTERVAL '10 minutes'` (runs every 10 min)
- Apply this migration first — it unblocks all wheel-delete UI work

### Soft-Delete Wheels — UI Behavior
- Soft-deleted wheels remain visible in the wheel selector with "— Deleting in ~10 min" suffix
- Each soft-deleted wheel shows an **Undo** button; clicking Undo clears `deleted_at` (restores wheel)
- After 10 min, pg_cron hard-deletes the row; it disappears from the selector naturally on next load
- `useWheel.ts` needs `softDeleteWheel(id)` and `undoDeleteWheel(id)` functions
- `useWheel` must still return soft-deleted wheels in its `wheels` array (so selector can show them), but mark them as pending-deletion so they're not treated as the active wheel

### canCreateWheel After Soft-Delete (Free Tier)
- After soft-deleting their only wheel, a free-tier user can **immediately create a new wheel** (soft-deleted wheel doesn't count toward limit — DB handles this via `count_user_wheels()`)
- The recovered (undone) wheel and the newly created wheel can coexist simultaneously during the 10-min window — this is intentional; recovery takes priority over tier limit
- Frontend must re-derive the free-tier wheel count after soft-delete (not rely on stale cached count)

### Empty State — "Recover a wheel" Section
- When ALL wheels are soft-deleted (none active), the empty state shows a "Recover a wheel" section listing the soft-deleted wheels with Undo buttons
- This is in addition to the normal empty state CTA (create new wheel)

### Delete Snapshots
- Hard delete (immediate) — no soft-delete or undo for snapshots
- Confirmation dialog before delete
- On confirm: DELETE from Supabase `snapshots` table; snapshot disappears immediately from local state
- Lives in `SnapshotsPage.tsx` — add delete button per snapshot row

### Authenticated Footer
- Location: **Inside the `<Sidebar>` component**, pinned at the very bottom, below all nav items
- Content: "Terms" link → `/terms` and "Privacy" link → `/privacy`
- Both pages already exist (`TermsPage.tsx`, `PrivacyPage.tsx`) and are routed in `App.tsx`
- Compact styling — small text, subdued color, consistent with sidebar aesthetics

### DueSoon Hover → Axis Highlight
- On hover over a DueSoon item, TWO things change simultaneously:
  1. **Axis label text** changes color (partially working — `customTick` in `WheelChart.tsx`)
  2. **Axis spoke/line** on the radar chart changes color (currently NOT implemented)
- The spoke is rendered by Recharts' `PolarAngleAxis` — need to customize it to color the spoke line when highlighted
- `highlightedCategory` state lives in `WheelPage.tsx`, flows down to `WheelChart` and `DueSoonWidget`

### Claude's Discretion
- Exact Recharts API to color PolarAngleAxis spokes (may need SVG customTick with line element, or a custom axis component)
- Confirmation dialog for snapshot delete (reuse existing pattern or a simple inline confirm)
- Sidebar footer exact markup and Tailwind classes
- Whether to poll or re-fetch wheel count after soft-delete vs. derive from local state

</decisions>

<specifics>
## Specific Ideas

- The soft-delete migration file is already at `supabase/migrations/20260321000001_wheel_soft_delete.sql` — just needs to be applied (`supabase db reset` locally)
- `WheelChart.tsx` already accepts `highlightedCategory` and `highlightColor` props; the label text highlight is there — only the spoke color is missing
- `PolarAngleAxis` in Recharts accepts a `tick` prop (custom renderer) — the `customTick` function in `WheelChart.tsx` renders the label; the spoke line is separate and may need a different approach (custom SVG or `tickLine` styling)
- Free-tier check: `useWheel.ts` likely derives `canCreateWheel` from `wheels.length`; after soft-delete this must use `wheels.filter(w => !w.deleted_at).length`

</specifics>

<deferred>
## Deferred Ideas

- Soft-delete snapshots (out of scope — hard delete only)
- Soft-delete action items
- Any UI polish beyond the 5 success criteria
- Apple OAuth (explicitly deferred earlier)

</deferred>

---

*Phase: 10-pre-launch-improvements*
*Context gathered: 2026-03-22 via /gsd:list-phase-assumptions + discussion*
