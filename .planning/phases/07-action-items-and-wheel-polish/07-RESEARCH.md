# Phase 7: Action Items & Wheel Polish - Research

**Researched:** 2026-03-15
**Domain:** React/TypeScript UI polish, CSS animations, Recharts extension, Supabase DB migrations, tier-gating patterns
**Confidence:** HIGH (all findings from live codebase inspection + established project patterns)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Celebration Animation (POLISH-01)**
- Type: Checkmark pop + row color flash (pure CSS keyframes — no extra animation library)
- Scope: Two simultaneous effects — (1) the action item row scales up briefly and flashes warm amber, (2) the parent category panel gets a brief warm glow — both animated together in ~800ms
- Duration: ~800ms total
- Sound: None
- Trigger: Checking the item immediately starts the animation AND opens the completion modal

**Due Soon Widget (POLISH-02)**
- Placement: Compact card/banner between the WheelChart and the category slider list on WheelPage — always visible when items exist, hidden when nothing is due within 7 days
- Item info shown: Category name + task text + days remaining (e.g., "Career — Update resume — 3 days")
- Hover behavior: Hovering over an item in the widget briefly highlights the corresponding category segment/axis in the WheelChart
- Click behavior: Opens a mini modal for that specific action item — shows full item text, deadline, and a "Mark complete" button
- Empty state: Widget is completely hidden when no items are due within 7 days

**Completed Items Experience (POLISH-08)**
- Completion flow: Checking off an item → animation plays → a completion modal appears offering an optional "note to your future self" (up to 500 characters) with Save and Skip buttons
- DB changes required: Add `completed_at` (timestamptz, nullable) and `note` (varchar(500), nullable) columns to `action_items` table
- Completed table placement: Collapsed by default below active items — toggle shows count ("3 completed ▼"). Expands to a table with columns: task text | completion date | note
- Un-complete: An explicit "Reopen" button per row in the completed table. Reopening moves the item back to active and clears `completed_at` + `note`
- Item limit: Only active (non-completed) items count toward the 7-item cap per category

**Important Categories — Premium (POLISH-04)**
- Visual distinction in wheel: (1) bolder fill opacity, (2) a distinct warm color (amber/orange) for the polygon fill; axis label also bold
- Toggle UX: A ★/☆ star icon in the CategorySlider header row. Click to mark/unmark. Premium only
- Free user: Grayed-out star icon + tooltip: "Premium feature — upgrade to mark priorities"
- Count indicator: "X of 3 priorities set" displayed above the category list or near the wheel
- Auto-reorder: Marking important moves category to the top of the list (positions 0, 1, 2); persisted to DB
- Auto-prompt for big gaps: After score slider commit, if |score_tobe - score_asis| >= 3 for a premium user, show subtle nudge. One-time per category per session
- DB changes required: Add `is_important` (boolean, default false) column to `categories` table

**Category Auto-Naming (POLISH-05)**
- Subsequent unnamed categories get auto-incremented names: "New category 2", "New category 3", etc.
- Exact naming logic implementation is Claude's Discretion

**Free-Tier Category Gate (POLISH-06)**
- Free users attempting to add a 9th category see an upgrade prompt (modal or inline message)
- Premium capped at 12; both tiers minimum 3
- Upgrade prompt styling is Claude's Discretion

**Inline Wheel Rename (POLISH-07)**
- User clicks the wheel name in the WheelPage heading → inline edit input appears
- Same pattern as CategorySlider rename: click to edit, Enter/blur to save, Escape to cancel
- Exact heading edit styling is Claude's Discretion

**Trend Chart Markers (POLISH-03)**
- ◆ markers on trend chart at action item due dates and completion dates
- Color-coded: green = completed, amber = due soon, red = overdue
- Tooltip on hover shows item text
- Exact Recharts implementation is Claude's Discretion

### Claude's Discretion
- Exact amber/orange color value for "important" category fill (distinct from existing `#e8a23a`)
- Exact CSS keyframe implementation for the celebration animation
- Upgrade prompt modal styling for category gate and free-user star tooltip
- Completion modal layout details beyond textarea + Save/Skip
- Exact Recharts implementation for trend chart action markers and WheelChart hover highlight
- Exact position sort logic when important categories auto-reorder

### Deferred Ideas (OUT OF SCOPE)
- Due Soon widget: sticky header placement
- Due Soon widget: collapsible section
- Due Soon click: scroll + expand category (vs mini modal)
- Un-complete via simple checkbox
- Scheduled/recurring action items
- Drag-to-reorder action items
- Apple OAuth
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| POLISH-01 | Completing an action item triggers a visible celebratory feedback (animation, sound, or micro-interaction) | CSS keyframes pattern; ActionItemList.handleToggle hook point identified; completion modal sequence defined |
| POLISH-02 | A "due soon" widget on WheelPage surfaces action items with deadlines within 7 days without requiring the user to expand each category | Derived from pre-fetched actionItemsByCategory state already in WheelPage; WheelChart highlight prop approach; Dialog pattern from ui/dialog.tsx |
| POLISH-03 | Trend chart displays ◆ markers at action item due/completion dates; color-coded; tooltip shows item text | Recharts ReferenceLine with label; custom dot on LineChart; TrendChart extension approach documented |
| POLISH-04 | Premium users can mark up to 3 categories as most important; marked categories visually distinct; free users see upgrade prompt | is_important DB column; CategorySlider prop extension; WheelChart data-driven highlight; tier from useWheel already available |
| POLISH-05 | Adding a category without renaming gets an auto-incremented name instead of duplicate "New category" | Client-side name-counting logic in handleAddCategory; no DB changes needed |
| POLISH-06 | Free users blocked from adding a 9th category with upgrade prompt; premium capped at 12 | Tier already available from useWheel; canCreateWheel pattern replicated for category gate |
| POLISH-07 | Users can rename a wheel inline from the WheelPage heading | WheelPage header renders `<h2>wheel.name</h2>`; same inline-edit state pattern as CategorySlider; wheels UPDATE RLS already exists; useWheel needs a `renameWheel` function |
| POLISH-08 | Completed action items move to separate "Completed" list with task text, completion date, optional note; completion date stored in DB | action_items migration for completed_at + note; useActionItems.toggleActionItem extension; ActionItemList completed-section UI |
</phase_requirements>

---

## Summary

Phase 7 is pure polish and extension work — no new top-level features. Every requirement hooks into an already-built component or hook. The codebase is well-structured and the integration points are clear from the CONTEXT.md code insights.

The phase has three categories of work: (1) **DB migrations** — two new columns added via separate migration file (`action_items.completed_at`, `action_items.note`, `categories.is_important`); (2) **hook extensions** — `useActionItems.toggleActionItem` extended to write `completed_at`, new `saveCompletionNote` and `reopenActionItem` functions added, `useWheel` gets a `renameWheel` function; (3) **UI additions** — celebration animation, completion modal, due-soon widget, completed-items table, star toggle on CategorySlider, important-category highlight in WheelChart, trend chart markers, inline wheel rename, category gate with tier check.

All animation work uses pure CSS keyframes (no new library). The Dialog component from `@radix-ui/react-dialog` is already in the codebase and available for the completion modal and due-soon mini modal. Recharts `ReferenceLine` and custom `dot` patterns handle the trend chart markers. The tier check pattern (`canCreateWheel` from `useWheel`) is directly reusable for the category count gate and star-icon gating.

**Primary recommendation:** Execute in DB-first order — migration, then type updates, then hook extensions, then UI. The WheelPage is already the orchestration hub; add the due-soon widget and priority counter there. The ActionItemList is the right place for the completed-items section and celebration animation. Keep all new components co-located with their primary consumer until complexity justifies extraction.

---

## Standard Stack

### Core (already installed — no new installations required)

| Library | Version | Purpose | Relevance to Phase 7 |
|---------|---------|---------|----------------------|
| recharts | ^3.8.0 | Charts | Extend TrendChart with ReferenceLine markers; extend WheelChart with highlight prop |
| @radix-ui/react-dialog | ^1.1.15 | Modal dialogs | Completion modal + due-soon item modal — already in ui/dialog.tsx |
| tailwindcss | ^3.4.17 | Styling | CSS keyframe animations via `@keyframes` in tailwind.config or inline style |
| lucide-react | ^0.487.0 | Icons | Star icon (Star, StarOff or equivalent) for is_important toggle |
| @supabase/supabase-js | ^2.49.4 | DB client | New columns accessed through existing supabase client |

### No New Installations

Phase 7 requires zero new `npm install` calls. Every capability needed exists in the current dependency set.

---

## Architecture Patterns

### Recommended Project Structure (no new folders needed)

All new files are co-located with existing files:

```
src/
├── components/
│   ├── ActionItemList.tsx         # Extended: celebration, completion modal, completed table
│   ├── ActionItemList.test.tsx    # Extended: POLISH-01, POLISH-08 tests
│   ├── WheelChart.tsx             # Extended: highlightedCategory prop for POLISH-02/04
│   ├── WheelChart.test.tsx        # Extended: highlight tests
│   ├── TrendChart.tsx             # Extended: action item markers for POLISH-03
│   ├── TrendChart.test.tsx        # Extended: marker tests
│   ├── CategorySlider.tsx         # Extended: isImportant + onToggleImportant + userTier props
│   ├── CategorySlider.test.tsx    # Extended: star icon tests
│   └── DueSoonWidget.tsx          # NEW: POLISH-02 widget component
├── hooks/
│   ├── useActionItems.ts          # Extended: toggleActionItem, saveCompletionNote, reopenActionItem
│   ├── useActionItems.test.ts     # Extended: new function tests
│   └── useWheel.ts                # Extended: renameWheel + tier exposed + updateCategoryImportant
├── pages/
│   ├── WheelPage.tsx              # Extended: DueSoonWidget, priority counter, category gate
│   └── TrendPage.tsx              # Extended: passes action item markers to TrendChart
└── types/
    └── database.ts                # Extended: ActionItemRow + CategoryRow new columns
```

### Pattern 1: Pure CSS Celebration Animation (POLISH-01)

**What:** Row scales up briefly and flashes amber; parent category panel gets warm glow.
**When to use:** Triggered from `handleToggle` in ActionItemList when transitioning from incomplete → complete.
**Implementation approach:**

```typescript
// Tailwind v3 does NOT support arbitrary @keyframes inline.
// Define keyframes in index.css (or tailwind.config.js theme.extend.keyframes).
// Then use Tailwind animation utility classes.

// In src/index.css (or global CSS):
// @keyframes celebrate-row { 0% { transform: scale(1); background: transparent; } 40% { transform: scale(1.03); background: #fef3c7; } 100% { transform: scale(1); background: transparent; } }
// @keyframes category-glow { 0%, 100% { box-shadow: none; } 40% { box-shadow: 0 0 0 2px #fbbf24; } }

// In component: apply class conditionally for 800ms then remove
const [celebrating, setCelebrating] = useState(false)
// On toggle to complete:
setCelebrating(true)
setTimeout(() => setCelebrating(false), 800)
// Apply: className={cn('...', celebrating && 'animate-celebrate-row')}
```

**jsdom/test note:** `setTimeout` in tests uses `vi.useFakeTimers()` + `vi.advanceTimersByTime(800)`. Existing test mock for Checkbox is reusable.

### Pattern 2: Completion Modal Sequence (POLISH-08)

**What:** After animation starts, open a Radix Dialog for "note to future self". Save → write `completed_at` + `note` to DB. Skip → write `completed_at` only, `note` remains null.
**State flow:**

```typescript
// In ActionItemList (or lifted to WheelPage if modal needs category context)
const [completionPending, setCompletionPending] = useState<string | null>(null) // item id

async function handleToggle(id: string, currentValue: boolean) {
  if (!currentValue) {
    // Completing an item
    setCelebrating(id)           // animation
    setTimeout(() => setCelebrating(null), 800)
    setCompletionPending(id)     // opens modal
    // Optimistic: mark complete in local state immediately
    onItemsChange(items.map(i => i.id === id ? { ...i, is_complete: true } : i))
  } else {
    // Un-completing: goes through Reopen button, not here
  }
}
```

**DB call timing:** `completed_at` is written when user clicks Save OR Skip in the modal (not on checkbox click). This avoids writing to DB before user interacts with modal.

Actually, per CONTEXT.md: "completion date is recorded automatically when checked off" — so `completed_at` should be written at toggle time, with the note written (or not) after modal interaction. Adjust: write `is_complete + completed_at` in `toggleActionItem`, then write `note` separately via `saveCompletionNote`.

### Pattern 3: Completed Items Table (POLISH-08)

**What:** Collapsed section below active items. Toggle reveals a `<table>` with task | completion date | note columns.
**Expand/collapse:** Match existing Set<string> pattern in WheelPage. Per-category `completedExpanded` boolean in ActionItemList local state (simpler than lifting, since it's purely presentational).

```typescript
// In ActionItemList
const activeItems = items.filter(i => !i.is_complete)
const completedItems = items.filter(i => i.is_complete)

// 7-item cap applies to activeItems.length only (per CONTEXT.md decision)
{activeItems.length < 7 && <button>+ Add action item</button>}
```

### Pattern 4: WheelChart Highlight Prop (POLISH-02 + POLISH-04)

**What:** Pass `highlightedCategory?: string` prop to WheelChart. When set, the Radar for that category name receives increased fillOpacity and stroke weight.
**Recharts approach:** The RadarChart renders a single Radar component for all data. To highlight individual data points, use a custom `dot` renderer or custom `tick` on PolarAngleAxis. For fill-based highlighting of individual segments, a more practical approach is to render an additional Radar layer for the highlighted category only.

```typescript
// WheelChart receives highlightedCategory prop
// Renders a third <Radar> with filtered data (only highlightedCategory entry non-zero)
// This gives a distinct visual without D3 complexity

interface WheelChartProps {
  data: WheelChartPoint[]
  highlightedCategory?: string  // NEW for POLISH-02 hover
  importantCategories?: string[] // NEW for POLISH-04 (up to 3 names)
}
```

**Important categories (POLISH-04):** Use a separate Radar layer with a deeper warm color (e.g., `#b45309` amber-700) for important category points. Since RadarChart plots all data points, the trick is to pass a filtered/zeroed dataset where only important category values are non-zero.

### Pattern 5: Recharts Trend Chart Markers (POLISH-03)

**What:** ◆ markers on LineChart at action item deadline and completion dates.
**Recharts approach:** Use `ReferenceLine` with `x` set to the formatted date string matching the XAxis dataKey. ReferenceLine supports a `label` prop for the ◆ symbol and a custom `label` renderer for tooltip-on-hover.

```typescript
// Source: Recharts ReferenceLine API
// ReferenceLine x must match the exact XAxis dataKey value (formatted date string)
// For tooltip on hover, use a custom label component with onMouseEnter/onMouseLeave

<ReferenceLine
  x={formattedDate}
  stroke={color}  // green | amber | red
  strokeDasharray="3 3"
  label={<DiamondLabel text={itemText} color={color} />}
/>
```

**Color mapping:**
- Completed (`completed_at` is set): `#16a34a` (green-600)
- Due soon (deadline within 7 days, not complete): `#d97706` (amber-600 — consistent with existing `#e8a23a` palette)
- Overdue (deadline passed, not complete): `#dc2626` (red-600)

**Data requirement:** TrendPage needs to load action items for the selected category to compute markers. This requires a new hook call in TrendPage: `loadActionItemsForCategory(categoryId)` — but action items are stored by category_id, not by snapshot date. The x-axis must match a snapshot date, so only action items whose `deadline` or `completed_at` date matches a snapshot's `saved_at` date would render as ReferenceLine markers. A simpler approach: render ReferenceLine at the nearest snapshot date to each action item date, or use a separate `data`-free x-position approach.

**Practical recommendation:** Pass action item marker data as a separate `markers` prop to TrendChart. Each marker has `date: string` (formatted, matching XAxis values), `label: string` (item text), `color: string`. TrendPage computes these by finding the nearest snapshot date for each action item deadline/completion date.

### Pattern 6: Category Auto-Naming (POLISH-05)

**What:** When adding a category, compute the next available "New category N" name.
**Logic in WheelPage.handleAddCategory:**

```typescript
function getNextCategoryName(existing: CategoryRow[]): string {
  const newCatNames = existing
    .map(c => c.name)
    .filter(n => /^New category \d+$/.test(n) || n === 'New Category')
  if (newCatNames.length === 0) return 'New category'
  // Find highest number already used
  const nums = newCatNames
    .map(n => parseInt(n.replace(/^New category\s*/i, ''), 10))
    .filter(n => !isNaN(n))
  const max = nums.length > 0 ? Math.max(...nums) : 1
  return `New category ${max + 1}`
}
```

**Note:** The existing code uses `'New Category'` (capital C). POLISH-05 spec says "New category 2" (lowercase c). Standardize to lowercase. First unnamed add is "New category", second is "New category 2".

### Pattern 7: Free-Tier Category Gate (POLISH-06)

**What:** Block free-tier users from adding a 9th category. Show upgrade prompt.
**Pattern mirrors `canCreateWheel`:** `useWheel` already exposes `tier` internally but does NOT expose it on the return value. Extend `UseWheelResult` to expose `tier: 'free' | 'premium'`.

```typescript
// WheelPage.handleAddCategory
const isFreeTier = tier === 'free'
const maxCategories = isFreeTier ? 8 : 12
if (localCategories.length >= maxCategories) {
  // Show upgrade prompt instead of silently blocking
  setShowCategoryUpgradePrompt(true)
  return
}
```

**Upgrade prompt:** Inline banner or shadcn Dialog — consistent with `CreateWheelModal` upgrade flow (`showUpgradePrompt` prop pattern).

### Pattern 8: Inline Wheel Rename (POLISH-07)

**What:** The `<h2>{wheel.name}</h2>` in WheelPage becomes clickable. On click → replace with `<input>`.
**Exact same pattern as CategorySlider:** `editing` + `editValue` state, `handleRenameSubmit` on Enter/blur, cancel on Escape.
**DB call:** Needs `renameWheel(wheelId, newName)` in `useWheel`. The `wheels: update own` RLS policy already allows UPDATE to `name` column.

```typescript
// useWheel addition
async function renameWheel(wheelId: string, newName: string): Promise<void> {
  await supabase
    .from('wheels')
    .update({ name: newName.trim(), updated_at: new Date().toISOString() })
    .eq('id', wheelId)
}
// Also update local state: setWheel + setWheels
```

### Anti-Patterns to Avoid

- **Writing completed_at before modal interaction for Save flow:** Write `completed_at` at toggle time (since it's "automatically recorded when checked off" per spec). The note is saved/skipped by modal choice. Do not wait for modal to write `completed_at`.
- **Filtering completed items out of loadActionItems:** Load all items; component filters. `loadActionItems` SELECT already fetches all columns — extend to include `completed_at` and `note` in the SELECT list.
- **Using the same Radar layer for highlight:** Recharts does not support per-point fill on Radar. Use an additional Radar layer for the highlighted data.
- **Forgetting to update `Database` type in database.ts:** The `Update` partial type for both `action_items` and `categories` must include the new columns, or TypeScript will error on the new DB calls.
- **7-item cap counting completed items:** The existing `items.length < 7` check in ActionItemList counts ALL items including completed ones. After POLISH-08, it must count only `activeItems.length`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Modal/dialog for completion note | Custom div with overlay | `Dialog` from `ui/dialog.tsx` (Radix) | Already in codebase; accessibility, focus trap, keyboard dismiss built-in |
| Modal/dialog for due-soon item | Custom div with overlay | Same `Dialog` from `ui/dialog.tsx` | Same reason |
| Star icon | SVG path | `lucide-react` Star/StarOff | Already imported in project; consistent sizing |
| Animation timing | `setInterval` loops | CSS keyframes + `setTimeout` for state cleanup | Simpler, performant, no janky frame updates |
| Tooltip on hover for ReferenceLine | Custom positioning logic | Recharts built-in label with `onMouseEnter` | Recharts handles coordinate transforms |

---

## Common Pitfalls

### Pitfall 1: RLS UPDATE Policy Missing New Columns

**What goes wrong:** Adding `completed_at`, `note`, `is_important` columns to tables. The existing UPDATE RLS policies use `WITH CHECK ((select auth.uid()) = user_id)` — this is permissive enough. But the `Update` type in `Database` in `database.ts` must include the new columns, or the TypeScript compiler will error before the RLS policy is even invoked.

**How to avoid:** In `database.ts`, add `completed_at`, `note` to `action_items.Update` and `is_important` to `categories.Update`. Also update `ActionItemRow` and `CategoryRow` base types.

**Warning signs:** TypeScript error like `Object literal may only specify known properties` when calling `.update({ completed_at: ... })`.

### Pitfall 2: Recharts ReferenceLine x-Value Must Match Exact XAxis String

**What goes wrong:** The trend chart XAxis uses formatted date strings (e.g., "15 Jan 2026" from `formatDate()`). ReferenceLine `x` prop must be the EXACT same string. If action item `completed_at` is a different format or a slightly different date than the snapshot `saved_at`, the line will not appear (silently).

**How to avoid:** In TrendPage, when computing markers, format the action item date using the same `formatDate()` function. Only render a ReferenceLine if the formatted date matches one of the snapshot dates in `chartData`.

**Warning signs:** ReferenceLine not visible even though data looks correct.

### Pitfall 3: Animation State Leak on Fast Clicks

**What goes wrong:** User rapidly checks/unchecks items. The `celebrating` state (set to item ID, cleared after 800ms via setTimeout) may clear a different item's celebration if the timeout IDs are not managed.

**How to avoid:** Use `useRef` to track the timeout ID. Clear previous timeout before setting a new one. Or track `celebrating` as a `Set<string>` and remove the id after its 800ms.

**Warning signs:** Wrong row flashing, or animation not triggering on rapid second click.

### Pitfall 4: Important Category Position Reorder Causing Render Flicker

**What goes wrong:** When marking a category as important, it moves to position 0, 1, or 2. If this triggers a full re-fetch from Supabase (rather than optimistic local update), the list will flicker.

**How to avoid:** Apply the optimistic local reorder immediately (sort `localCategories` with important ones first), then persist to DB in the background. Use the same optimistic update pattern as `handleToggle` in ActionItemList.

**Warning signs:** Category list flickers on star click; brief empty state visible.

### Pitfall 5: Completed Items Counted Toward 7-Item Cap

**What goes wrong:** `ActionItemList` currently guards `items.length < 7` using the full items array. After POLISH-08, completed items are still in the array but should not consume slots.

**How to avoid:** Change the cap check to `activeItems.length < 7` where `activeItems = items.filter(i => !i.is_complete)`.

**Warning signs:** Users unable to add new items even though they've completed several; cap reached at fewer than 7 visible active items.

### Pitfall 6: Dialog (Radix) Requires Mock in Tests

**What goes wrong:** Radix Dialog uses portals and focus management that jsdom does not support. If tests render components containing `<Dialog>`, they will throw or behave unexpectedly.

**How to avoid:** Follow the established pattern from `SnapshotNameDialog.test.tsx` — mock the Dialog primitives in test files that test the completion modal.

**Warning signs:** Test errors like "Unable to find an accessible element" or focus-related jsdom exceptions.

---

## Code Examples

### DB Migration Pattern (matches existing style)

```sql
-- Source: supabase/migrations/20260315000001_action_items.sql (existing pattern)
-- New migration file: 20260315000003_polish.sql (or next timestamp)

ALTER TABLE public.action_items
  ADD COLUMN completed_at timestamptz,
  ADD COLUMN note        varchar(500);

ALTER TABLE public.categories
  ADD COLUMN is_important boolean NOT NULL DEFAULT false;

-- No new RLS policies needed — existing UPDATE policies are permissive enough
-- (they check user_id ownership only, not column-level restrictions)
-- But verify: existing `action_items: update own` WITH CHECK passes for new columns
```

### TypeScript Type Extensions

```typescript
// Source: src/types/database.ts (current)
// Extend ActionItemRow and CategoryRow:

export type ActionItemRow = {
  id: string
  category_id: string
  user_id: string
  text: string
  is_complete: boolean
  deadline: string | null
  completed_at: string | null  // NEW — ISO timestamptz or null
  note: string | null          // NEW — up to 500 chars or null
  position: number
  created_at: string
  updated_at: string
}

export type CategoryRow = {
  id: string
  wheel_id: string
  user_id: string
  name: string
  position: number
  score_asis: number
  score_tobe: number
  is_important: boolean  // NEW
  created_at: string
  updated_at: string
}
```

Also update `Database.public.Tables.action_items.Update` and `categories.Update` to include new columns.

### useActionItems Extension Pattern

```typescript
// Extended toggleActionItem — writes completed_at when completing
async function toggleActionItem(params: {
  id: string
  isComplete: boolean
}): Promise<void> {
  await supabase
    .from('action_items')
    .update({
      is_complete: params.isComplete,
      completed_at: params.isComplete ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id)
}

// New: save note after completion modal
async function saveCompletionNote(params: {
  id: string
  note: string
}): Promise<void> {
  await supabase
    .from('action_items')
    .update({ note: params.note, updated_at: new Date().toISOString() })
    .eq('id', params.id)
}

// New: reopen (un-complete) action item
async function reopenActionItem(id: string): Promise<void> {
  await supabase
    .from('action_items')
    .update({
      is_complete: false,
      completed_at: null,
      note: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
}
```

Also update `loadActionItems` SELECT to include `completed_at, note`.

### DueSoonWidget — Derived from Existing State

```typescript
// Source: WheelPage.tsx — actionItemsByCategory is already loaded on mount
// DueSoonWidget receives filtered data, no extra DB queries needed

function getDueSoonItems(
  actionItemsByCategory: Record<string, ActionItemRow[]>,
  categories: CategoryRow[],
  withinDays = 7
): Array<{ categoryName: string; item: ActionItemRow; daysRemaining: number }> {
  const today = new Date()
  const result = []
  for (const cat of categories) {
    const items = actionItemsByCategory[cat.id] ?? []
    for (const item of items) {
      if (!item.deadline || item.is_complete) continue
      const deadline = new Date(item.deadline)
      const diff = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      if (diff >= 0 && diff <= withinDays) {
        result.push({ categoryName: cat.name, item, daysRemaining: diff })
      }
    }
  }
  return result.sort((a, b) => a.daysRemaining - b.daysRemaining)
}
```

### Category Auto-Naming (POLISH-05)

```typescript
// In WheelPage.handleAddCategory — replaces hardcoded 'New Category'
function getNextCategoryName(existing: CategoryRow[]): string {
  const existingNames = existing.map(c => c.name)
  if (!existingNames.some(n => /^new category/i.test(n))) return 'New category'
  const nums = existingNames
    .map(n => { const m = n.match(/^new category\s*(\d+)$/i); return m ? parseInt(m[1], 10) : 1 })
    .filter(n => !isNaN(n))
  return `New category ${Math.max(...nums) + 1}`
}
```

### Important Category Reorder

```typescript
// In WheelPage — after toggling is_important
function reorderWithImportantFirst(cats: CategoryRow[]): CategoryRow[] {
  const important = cats.filter(c => c.is_important).slice(0, 3)
  const rest = cats.filter(c => !c.is_important || important.indexOf(c) === -1)
  const reordered = [...important, ...rest]
  return reordered.map((c, i) => ({ ...c, position: i }))
}
// Persist position updates in batch:
// supabase.from('categories').upsert(reordered.map(c => ({ id: c.id, position: c.position })))
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Separate component for each dialog type | Reuse shadcn Dialog primitive with different content | Completion modal and due-soon modal use same Dialog wrapper |
| Library for confetti/celebration (e.g., canvas-confetti) | Pure CSS keyframes | Zero bundle cost, matches project constraint (no animation library) |
| D3-driven chart overlays | Recharts ReferenceLine + additional Radar layer | No D3 complexity, composable within existing chart components |

---

## Open Questions

1. **TrendChart markers: snapshot date alignment**
   - What we know: ReferenceLine x must match XAxis string exactly
   - What's unclear: Action item deadlines/completion dates may fall between snapshot dates, making them unplottable on the current discrete x-axis
   - Recommendation: Only plot markers where action item date matches a snapshot date (within same calendar day). If none match, markers are simply not shown. This is acceptable for MVP polish and avoids inventing a continuous x-axis.

2. **is_important DB column: RLS UPDATE policy scope**
   - What we know: Existing `categories: update own` policy allows updating any column for row-owner
   - What's unclear: The existing `Database.categories.Update` type is `Partial<Pick<CategoryRow, 'name' | 'position' | 'score_asis' | 'score_tobe' | 'updated_at'>>` — `is_important` is not in the Pick list
   - Recommendation: Add `is_important` to the Pick list in `database.ts`. The RLS policy itself is already permissive; this is a TypeScript-layer fix only.

3. **Seed data: should completed action items include `completed_at`?**
   - What we know: Phase 3 seed has `is_complete: true` items but no `completed_at` (column didn't exist)
   - What's unclear: After migration, existing `is_complete: true` rows will have `completed_at = null`. This means old completed items will appear in the Completed table without a completion date.
   - Recommendation: Add a seed update statement in the Phase 7 migration or seed appendix that backfills `completed_at = created_at` for existing `is_complete = true` rows. This prevents UI confusion.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest ^3.1.1 |
| Config file | vite.config.ts (vitest config embedded) or vitest.config.ts |
| Quick run command | `npm test -- --run` |
| Full suite command | `npm test -- --run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| POLISH-01 | Checking off an item triggers `celebrating` state and animation class | unit | `npm test -- --run ActionItemList` | ✅ ActionItemList.test.tsx (extend) |
| POLISH-01 | Completion modal opens after toggle to complete | unit | `npm test -- --run ActionItemList` | ✅ extend |
| POLISH-02 | getDueSoonItems filters items with deadline within 7 days | unit | `npm test -- --run DueSoonWidget` | ❌ Wave 0 |
| POLISH-02 | DueSoonWidget hidden when no items due within 7 days | unit | `npm test -- --run DueSoonWidget` | ❌ Wave 0 |
| POLISH-03 | TrendChart renders ReferenceLine for each marker | unit | `npm test -- --run TrendChart` | ✅ TrendChart.test.tsx (extend) |
| POLISH-04 | CategorySlider renders star icon; calls onToggleImportant when clicked | unit | `npm test -- --run CategorySlider` | ✅ CategorySlider.test.tsx (extend) |
| POLISH-04 | WheelChart receives importantCategories prop without throwing | unit | `npm test -- --run WheelChart` | ✅ WheelChart.test.tsx (extend) |
| POLISH-05 | getNextCategoryName returns "New category 2" when "New category" exists | unit | `npm test -- --run WheelPage` | ✅ WheelPage.test.tsx (extend) |
| POLISH-06 | Free-tier user adding 9th category triggers upgrade prompt | unit | `npm test -- --run WheelPage` | ✅ WheelPage.test.tsx (extend) |
| POLISH-07 | WheelPage heading switches to input on click; saves on Enter | unit | `npm test -- --run WheelPage` | ✅ WheelPage.test.tsx (extend) |
| POLISH-08 | Completed items filtered to separate section | unit | `npm test -- --run ActionItemList` | ✅ extend |
| POLISH-08 | Active item cap uses activeItems.length, not total | unit | `npm test -- --run ActionItemList` | ✅ extend |
| POLISH-08 | Reopen button calls reopenActionItem | unit | `npm test -- --run ActionItemList` | ✅ extend |

### Sampling Rate

- **Per task commit:** `npm test -- --run`
- **Per wave merge:** `npm test -- --run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/components/DueSoonWidget.tsx` — component file (POLISH-02)
- [ ] `src/components/DueSoonWidget.test.tsx` — test stubs for POLISH-02
- [ ] `useActionItems` mock in DueSoonWidget.test.tsx — same pattern as ActionItemList.test.tsx

*(All other test files already exist; they need extension, not creation.)*

---

## Sources

### Primary (HIGH confidence)
- Live codebase: `src/components/ActionItemList.tsx` — handleToggle hook point, items array, Checkbox mock pattern
- Live codebase: `src/components/WheelChart.tsx` — RadarChart structure, existing props
- Live codebase: `src/components/TrendChart.tsx` — LineChart structure, confirmed ReferenceLine is compatible
- Live codebase: `src/components/CategorySlider.tsx` — inline edit pattern for POLISH-07
- Live codebase: `src/hooks/useActionItems.ts` — toggleActionItem implementation, loadActionItems SELECT
- Live codebase: `src/hooks/useWheel.ts` — tier state (internal, not exposed), canCreateWheel pattern
- Live codebase: `src/hooks/useCategories.ts` — addCategory, 12-cap enforcement
- Live codebase: `src/types/database.ts` — ActionItemRow, CategoryRow, Database type
- Live codebase: `src/pages/WheelPage.tsx` — state architecture, actionItemsByCategory, expandedCategories
- Live codebase: `src/pages/TrendPage.tsx` — snapshot loading pattern
- Live codebase: `src/components/ui/dialog.tsx` — Radix Dialog already available
- Live codebase: `package.json` — recharts ^3.8.0, lucide-react ^0.487.0 confirmed present
- Live codebase: `supabase/migrations/20260315000001_action_items.sql` — migration style, RLS policy pattern
- Live codebase: `supabase/seed.sql` — seed style, ON CONFLICT pattern, backfill opportunity identified

### Secondary (MEDIUM confidence)
- Recharts v3 API: ReferenceLine component accepts `x` prop (matching XAxis dataKey), `stroke`, `label` — consistent with v2 API and expected to be stable in v3.8.x
- CSS keyframe animations in Tailwind v3: custom keyframes defined in `tailwind.config.js` `theme.extend.keyframes` and `theme.extend.animation`, then used as `animate-*` classes — well-established pattern

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified from package.json; no new installs needed
- Architecture: HIGH — all integration points verified from live source files
- DB migration: HIGH — existing migration style confirmed, new column types straightforward
- Recharts extension: MEDIUM — ReferenceLine API verified as stable; additional Radar layer for highlight is a known workaround for per-segment coloring
- Pitfalls: HIGH — derived from direct code inspection and established project decisions log

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (stable stack, 30-day horizon)
