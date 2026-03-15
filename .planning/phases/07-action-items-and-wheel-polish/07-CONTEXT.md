# Phase 7: Action Items & Wheel Polish - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Polish and extend existing features: celebratory action item completion (with note-to-self), a due-soon widget on WheelPage, trend chart action item markers, premium priority categories (visual distinction + auto-reorder + smart nudge), auto-named new categories, free-tier category count gate, inline wheel rename, and a completed items history table. No new top-level features — everything extends what already exists.

</domain>

<decisions>
## Implementation Decisions

### Celebration Animation (POLISH-01)
- **Type**: Checkmark pop + row color flash (pure CSS keyframes — no extra animation library)
- **Scope**: Two simultaneous effects — (1) the action item row scales up briefly and flashes warm amber, (2) the parent category panel gets a brief warm glow — both animated together in ~800ms
- **Duration**: ~800ms total
- **Sound**: None
- **Trigger**: Checking the item immediately starts the animation AND opens the completion modal (see Completed Items below)

### Due Soon Widget (POLISH-02)
- **Placement**: Compact card/banner between the WheelChart and the category slider list on WheelPage — always visible when items exist, hidden when nothing is due within 7 days
- **Item info shown**: Category name + task text + days remaining (e.g., "Career — Update resume — 3 days")
- **Hover behavior**: Hovering over an item in the widget briefly highlights the corresponding category segment/axis in the WheelChart (state-driven highlight, no tooltip needed from hover itself)
- **Click behavior**: Opens a mini modal for that specific action item — shows full item text, deadline, and a "Mark complete" button
- **Empty state**: Widget is completely hidden when no items are due within 7 days

### Completed Items Experience (POLISH-08)
- **Completion flow**: Checking off an item → animation plays → a completion modal appears offering an optional "note to your future self" (up to 500 characters) with Save and Skip buttons
- **DB changes required**: Add `completed_at` (timestamptz, nullable) and `note` (varchar(500), nullable) columns to `action_items` table
- **Completed table placement**: Collapsed by default below active items — toggle shows count ("3 completed ▼"). Expands to a table with columns: task text | completion date | note
- **Un-complete**: An explicit "Reopen" button per row in the completed table (not just checkbox uncheck). Reopening moves the item back to active and clears `completed_at` + `note`
- **Item limit**: Only **active** (non-completed) items count toward the 7-item cap per category — completing an item frees up a slot

### Important Categories — Premium (POLISH-04)
- **Visual distinction in wheel**: Two combined effects — (1) bolder fill opacity for that radar area, (2) a distinct warm color (amber/orange, separate from the default As-Is amber) for the polygon fill; axis label is also bold
- **Toggle UX**: A ★/☆ star icon in the CategorySlider header row (next to category name). Click to mark/unmark. Premium only
- **Free user**: Grayed-out star icon visible in every category row + tooltip on hover: "Premium feature — upgrade to mark priorities"
- **Count indicator**: "X of 3 priorities set" displayed above the category list or near the wheel. When limit reached, remaining stars are unclickable + tooltip explains why
- **Auto-reorder**: When a category is marked important, it automatically moves to the top of the list (positions 0, 1, 2). This reorders both the slider list and the RadarChart (placing them at the ~12 o'clock position). Position changes are persisted to DB
- **Auto-prompt for big gaps**: After a score slider commit, if `|score_tobe - score_asis| >= 3` for that category and the user is premium and hasn't marked it as important, show a subtle nudge: "This area has a big gap — mark as important?" with Accept (marks it) and Dismiss buttons. One-time per category per session (dismissed = no re-prompt that session)
- **DB changes required**: Add `is_important` (boolean, default false) column to `categories` table

### Category Auto-Naming (POLISH-05)
- When user adds a category without renaming it, subsequent unnamed categories get auto-incremented names: "New category 2", "New category 3", etc.
- Claude's Discretion: exact naming logic implementation

### Free-Tier Category Gate (POLISH-06)
- Free users attempting to add a 9th category see an upgrade prompt (modal or inline message)
- Premium capped at 12; both tiers minimum 3
- Claude's Discretion: upgrade prompt styling (consistent with how pricing is surfaced elsewhere)

### Inline Wheel Rename (POLISH-07)
- User clicks the wheel name in the WheelPage heading → inline edit input appears (same pattern as CategorySlider rename — click to edit, Enter/blur to save, Escape to cancel)
- Claude's Discretion: exact heading edit styling

### Trend Chart Markers (POLISH-03)
- ◆ markers on the trend chart at action item due dates and completion dates
- Color-coded: green = completed, amber = due soon, red = overdue
- Tooltip on hover shows item text
- Claude's Discretion: exact Recharts implementation (ReferenceLine or custom dot)

### Claude's Discretion
- Exact amber/orange color value for "important" category fill (distinct from existing `#e8a23a` As-Is color — pick a deeper/warmer variant)
- Exact CSS keyframe implementation for the celebration animation
- Upgrade prompt modal styling for category gate and free-user star tooltip
- Completion modal layout details beyond textarea + Save/Skip
- Exact Recharts implementation for trend chart action markers and WheelChart hover highlight
- Exact position sort logic when important categories auto-reorder

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ActionItemList.tsx`: Handles add/toggle/delete/deadline. Needs extension for completion modal and completed items table. `handleToggle` is the hook point for the celebration animation trigger
- `useActionItems.ts`: `toggleActionItem` sets `is_complete` + `updated_at`. Needs extending to also set `completed_at` on completion. `loadActionItems` will need to return new columns
- `ActionItemRow` type (database.ts): Missing `completed_at` and `note` — DB migration + type update required
- `CategoryRow` type (database.ts): Missing `is_important` — DB migration + type update required
- `WheelChart.tsx`: Recharts RadarChart. Needs state-driven highlight for Due Soon hover (pass highlighted category as prop, use custom tick/dot renderer or fill override)
- `TrendChart.tsx`: Recharts LineChart. Action item markers can be added via `ReferenceLine` or custom `dot` renderer
- `CategorySlider.tsx`: Inline edit pattern established (click name → input → Enter/blur/Escape). Star icon slot can be added to the header row `<div className="flex items-center justify-between gap-2">`
- `WheelPage.tsx`: Manages `actionItemsByCategory` state and `expandedCategories` Set. Due Soon widget and "X of 3 priorities" counter would live here
- `Checkbox` (shadcn/ui): Already used in ActionItemList — completion animation triggers from `onCheckedChange`

### Established Patterns
- Inline edit: click name → input with autoFocus → submit on Enter/blur, cancel on Escape (CategorySlider pattern — apply to wheel heading in WheelPage)
- Optimistic updates: update local state first, then async DB call (all existing action item handlers follow this)
- Warm/earthy palette: `#e8a23a` amber, `#60a5fa` blue, stone tones — important category color must be visually distinct from these
- Expand/collapse state: `Set<string>` in WheelPage (e.g., `expandedCategories`) — completed items section uses same pattern per category
- Tier-gating: `canCreateWheel` boolean from `useWheel` shows upgrade prompt — same approach for category count gate and star icon

### Integration Points
- `WheelPage.tsx`: Due Soon widget rendered between WheelChart and category list; "X of 3 priorities" counter near wheel or list header; auto-prompt nudge triggered from score commit handler
- `CategorySlider.tsx`: Star icon added to category header row; receives `isImportant` and `onToggleImportant` props
- `ActionItemList.tsx`: Completion modal triggered from `handleToggle`; completed items table section added below active items
- `useActionItems.ts`: `toggleActionItem` extended to write `completed_at`; new `saveCompletionNote` function needed; `loadActionItems` returns all items (active and completed) — component filters by `is_complete`
- DB migrations: `action_items` (add `completed_at`, `note`), `categories` (add `is_important`) — RLS UPDATE policies must allow writing these new columns

</code_context>

<specifics>
## Specific Ideas

- Celebration animation feel: "Checkmark pop + warm flash" — the row should feel like it exhales/releases, not explodes. 800ms is generous; the flash should peak at ~300ms and fade out gently
- Due Soon hover highlight: Hovering a due-soon item causes the corresponding radar axis/segment to glow — pass a `highlightedCategory` string prop to WheelChart and render the polygon or tick with extra visual weight
- Completion modal: Keep it warm and brief — "Great work! Add a note to your future self?" with a soft congratulatory message before the textarea. The note is optional; Skip is equally prominent as Save
- Important category color: Should feel "elevated" vs standard — consider a deeper warm color like `#c2410c` (orange-700) or `#b45309` (amber-700) to distinguish from the standard As-Is `#e8a23a`
- Auto-reorder animation: When a category jumps to the top of the list, a brief slide/reorder animation would make it feel polished (not a jarring instant reorder)
- The "X of 3 priorities set" counter could appear as a subtle line above the category list: "Priority categories: ★★☆ (2 of 3 set)"

</specifics>

<deferred>
## Deferred Ideas

- **Due Soon widget: sticky header placement** — Pinned inside the scrollable area above category sliders. Noted for future evaluation if the above-the-list card placement feels too visually heavy.
- **Due Soon widget: collapsible section** — A collapsed drawer pattern. Noted for future if the always-visible card adds too much visual noise.
- **Due Soon click: scroll + expand category** — Alternative to mini modal; clicking a due-soon item scrolls page and expands that category's action items. Noted for future assessment vs the modal approach.
- **Un-complete via simple checkbox** — Option 1 (plain checkbox uncheck in completed table). Noted for future review vs the explicit "Reopen" button. Current decision favors intentional reopening.
- **Scheduled/recurring action items** — Out of scope; own phase.
- **Drag-to-reorder action items** — Out of scope for this phase.
- **Apple OAuth** — Previously deferred to Phase 7 from Phase 1, but no Apple Developer account yet; out of scope for this phase. Move to Phase 8 or post-launch.

</deferred>

---

*Phase: 07-action-items-and-wheel-polish*
*Context gathered: 2026-03-15*
