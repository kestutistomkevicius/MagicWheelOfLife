# Phase 3: Action Items - Research

**Researched:** 2026-03-15
**Domain:** Supabase table design, React inline editing, date input patterns, shadcn/ui Checkbox, WheelPage UI integration
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ACTION-01 | User can add up to 7 action items per category (free text) | New `action_items` table with FK to `categories`; count guard at 7 in hook and UI; INSERT + RLS mirroring the categories pattern |
| ACTION-02 | User can set an optional deadline date on an action item and see the date displayed | `deadline date` nullable column; `<input type="date">` or shadcn Popover+Calendar; display formatted as ISO string; no time component required |
| ACTION-03 | User can mark an action item as complete (checkbox) | `is_complete boolean` column; shadcn Checkbox component; UPDATE on toggle; visual: struck-through text when checked |
| ACTION-04 | User can delete an action item and it disappears immediately | Optimistic local-state removal on click; Supabase DELETE follows; no confirmation dialog needed (destructive but low-stakes) |
</phase_requirements>

---

## Summary

Phase 3 adds per-category action items to the existing WheelPage. The feature is a classic list-within-a-list: each category (already rendered as a `CategorySlider` row) gains an expandable or inline panel showing 0–7 action items. Each item has free-text content, an optional deadline date, a completion checkbox, and a delete button.

The database work is the most critical piece: a new `action_items` table with RLS identical to the `categories` pattern. The 7-item limit must be enforced both in the mutation function and in the UI (add button disabled at 7). There is no need for a SECURITY DEFINER function here — the count is on a separate table from the one being inserted into, so no RLS recursion risk.

The UI integration challenge is layout: WheelPage currently uses a two-column layout (chart left, sliders right) with a `max-h-[500px]` scrollable right column. Action items expand the height of each category row. The most natural fit is an inline expandable panel beneath each `CategorySlider` row — collapsed by default, opened via a toggle button on the row. An `ActionItemList` component renders inside the panel. No new routing or pages are needed.

**Primary recommendation:** DB migration first (action_items table + RLS + seed data), then a `useActionItems` hook (add, toggle, delete), then an `ActionItemList` component, then wire everything into `CategorySlider` or a new wrapper in WheelPage. Follow the exact same architectural pattern as Phase 2 categories work.

---

## Standard Stack

### Core (all already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2.49.4 | action_items CRUD + RLS | Project stack, installed |
| react | ^19.0.0 | UI state (optimistic delete, toggle) | Project stack |
| tailwindcss | ^3.4.17 | Styling inline items | Project stack |

### shadcn/ui Components (new in this phase)
| Component | Install Command | Purpose |
|-----------|----------------|---------|
| Checkbox | `npx shadcn@latest add checkbox` | ACTION-03: completion toggle |

Note: `@radix-ui/react-checkbox` will be installed as a dependency of the shadcn Checkbox. All other needed UI primitives (Button, Input) are already installed from Phases 1–2.

**No new npm packages are required** beyond the shadcn Checkbox. The date input uses a native `<input type="date">` — there is no need to install a calendar/date-picker library for this phase. The requirement only asks to "see the date displayed" — a native date input with ISO value output is the simplest correct solution and is fully accessible on desktop/tablet.

**Installation:**
```bash
npx shadcn@latest add checkbox
```

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native `<input type="date">` | shadcn Calendar + Popover | Calendar Popover is visually richer but adds significant complexity; native date input fully satisfies ACTION-02 on desktop/tablet |
| shadcn Checkbox | `<input type="checkbox">` | shadcn Checkbox matches the design system; accessible focus ring; styled consistently with existing components |
| Optimistic delete | Wait for Supabase response | Optimistic gives instant feedback; if DB fails, can roll back via error state; preferred for low-latency UX |

---

## Architecture Patterns

### Recommended File Additions for Phase 3
```
src/
├── components/
│   ├── ui/
│   │   └── checkbox.tsx          # shadcn Checkbox (new)
│   └── ActionItemList.tsx         # Per-category action item list (new)
├── hooks/
│   └── useActionItems.ts          # add, toggle, delete mutations + load (new)
├── types/
│   └── database.ts                # Add ActionItemRow (update existing)
supabase/
├── migrations/
│   └── YYYYMMDDHHMMSS_action_items.sql  # action_items table + RLS (new)
└── seed.sql                       # Extend: INSERT action items for seed users (update)
```

WheelPage.tsx and CategorySlider.tsx will receive targeted updates — no rewrites.

### Pattern 1: action_items Table Schema
**What:** New table with FK to `categories`, FK to `auth.users` (denormalized for RLS simplicity — mirrors the categories pattern exactly). `deadline` is a nullable `date` column (not `timestamptz` — no time component needed). `is_complete` defaults to false.
**When to use:** Always. This is the only table design that fits the domain model and the established RLS pattern.

```sql
-- Migration: action_items table
CREATE TABLE public.action_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text text NOT NULL,
  is_complete boolean NOT NULL DEFAULT false,
  deadline date,  -- nullable; no time component needed
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;

-- Standard ownership policies (same pattern as categories)
CREATE POLICY "action_items: select own"
  ON public.action_items FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "action_items: insert own"
  ON public.action_items FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "action_items: update own"
  ON public.action_items FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "action_items: delete own"
  ON public.action_items FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);
```

**Key design decisions:**
- `user_id` denormalized onto `action_items` (same rationale as `categories`) — RLS avoids joining through `categories` to `wheels`
- `ON DELETE CASCADE` from `categories` — removing a category removes all its action items automatically
- `deadline date` not `timestamptz` — requirement is a date only; avoids timezone complexity
- No SECURITY DEFINER function needed — count guard is in application code, not in an RLS policy on the same table

### Pattern 2: useActionItems Hook
**What:** Stateless mutations hook (same pattern as `useCategories`). Also provides a `loadActionItems(categoryId)` function for on-demand loading when a category panel is expanded.
**When to use:** Always. Keep hook logic separate from component rendering, following established project convention.

```typescript
// src/hooks/useActionItems.ts
import { supabase } from '@/lib/supabase'
import type { ActionItemRow } from '@/types/database'

export interface UseActionItemsResult {
  loadActionItems: (categoryId: string) => Promise<ActionItemRow[]>
  addActionItem: (params: {
    categoryId: string
    userId: string
    text: string
    currentCount: number
  }) => Promise<ActionItemRow | { error: string }>
  toggleActionItem: (params: {
    id: string
    isComplete: boolean
  }) => Promise<void>
  setDeadline: (params: {
    id: string
    deadline: string | null  // ISO date string 'YYYY-MM-DD' or null to clear
  }) => Promise<void>
  deleteActionItem: (id: string) => Promise<void>
}

export function useActionItems(): UseActionItemsResult {
  async function loadActionItems(categoryId: string): Promise<ActionItemRow[]> {
    const res = await supabase
      .from('action_items')
      .select('id, category_id, user_id, text, is_complete, deadline, position, created_at, updated_at')
      .eq('category_id', categoryId)
      .order('position', { ascending: true })
    return Array.isArray(res.data) ? (res.data as ActionItemRow[]) : []
  }

  async function addActionItem(params: {
    categoryId: string
    userId: string
    text: string
    currentCount: number
  }): Promise<ActionItemRow | { error: string }> {
    const { categoryId, userId, text, currentCount } = params
    if (currentCount >= 7) {
      return { error: 'Maximum 7 action items per category' }
    }
    const res = await supabase
      .from('action_items')
      .insert({
        category_id: categoryId,
        user_id: userId,
        text,
        position: currentCount,  // append at end
        is_complete: false,
        deadline: null,
      })
      .select()
    const rows = Array.isArray(res.data) ? (res.data as ActionItemRow[]) : []
    const newItem = rows[0]
    if (!newItem || res.error) {
      return { error: res.error?.message ?? 'Failed to add action item' }
    }
    return newItem
  }

  async function toggleActionItem(params: {
    id: string
    isComplete: boolean
  }): Promise<void> {
    await supabase
      .from('action_items')
      .update({ is_complete: params.isComplete, updated_at: new Date().toISOString() })
      .eq('id', params.id)
  }

  async function setDeadline(params: {
    id: string
    deadline: string | null
  }): Promise<void> {
    await supabase
      .from('action_items')
      .update({ deadline: params.deadline, updated_at: new Date().toISOString() })
      .eq('id', params.id)
  }

  async function deleteActionItem(id: string): Promise<void> {
    await supabase
      .from('action_items')
      .delete()
      .eq('id', id)
  }

  return { loadActionItems, addActionItem, toggleActionItem, setDeadline, deleteActionItem }
}
```

### Pattern 3: ActionItemList Component
**What:** Receives the list of action items for one category, renders each item with a Checkbox, text, optional date display, and a delete button. Also renders an "Add item" input when count < 7. This component manages its own local list state for optimistic updates (delete disappears instantly).
**When to use:** Rendered inside WheelPage, one per category row when the category panel is expanded.

```typescript
// src/components/ActionItemList.tsx
import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { useActionItems } from '@/hooks/useActionItems'
import type { ActionItemRow } from '@/types/database'

interface ActionItemListProps {
  categoryId: string
  userId: string
  items: ActionItemRow[]
  onItemsChange: (items: ActionItemRow[]) => void
}

export function ActionItemList({ categoryId, userId, items, onItemsChange }: ActionItemListProps) {
  const { addActionItem, toggleActionItem, setDeadline, deleteActionItem } = useActionItems()
  const [newText, setNewText] = useState('')
  const [adding, setAdding] = useState(false)

  async function handleAdd() {
    const text = newText.trim()
    if (!text) return
    const result = await addActionItem({
      categoryId,
      userId,
      text,
      currentCount: items.length,
    })
    if ('error' in result) return
    onItemsChange([...items, result])
    setNewText('')
  }

  async function handleToggle(id: string, currentValue: boolean) {
    // Optimistic update
    onItemsChange(items.map(item => item.id === id ? { ...item, is_complete: !currentValue } : item))
    await toggleActionItem({ id, isComplete: !currentValue })
  }

  async function handleDelete(id: string) {
    // Optimistic removal
    onItemsChange(items.filter(item => item.id !== id))
    await deleteActionItem(id)
  }

  async function handleDeadlineChange(id: string, value: string) {
    const deadline = value || null  // empty string → null (clear deadline)
    onItemsChange(items.map(item => item.id === id ? { ...item, deadline } : item))
    await setDeadline({ id, deadline })
  }

  return (
    <div className="mt-2 space-y-1 pl-1">
      {items.map(item => (
        <div key={item.id} className="flex items-start gap-2 py-1">
          <Checkbox
            id={`item-${item.id}`}
            checked={item.is_complete}
            onCheckedChange={() => handleToggle(item.id, item.is_complete)}
            aria-label={`Mark "${item.text}" as ${item.is_complete ? 'incomplete' : 'complete'}`}
          />
          <div className="flex-1 min-w-0">
            <label
              htmlFor={`item-${item.id}`}
              className={`text-sm cursor-pointer ${item.is_complete ? 'line-through text-stone-400' : 'text-stone-700'}`}
            >
              {item.text}
            </label>
            {/* Deadline input — always visible; shows date if set */}
            <input
              type="date"
              value={item.deadline ?? ''}
              onChange={(e) => handleDeadlineChange(item.id, e.target.value)}
              className="ml-2 text-xs text-stone-400 border-none bg-transparent focus:outline-none focus:ring-1 focus:ring-stone-300 rounded"
              aria-label={`Deadline for "${item.text}"`}
            />
          </div>
          <button
            onClick={() => handleDelete(item.id)}
            className="text-xs text-stone-300 hover:text-red-400 shrink-0"
            aria-label={`Delete "${item.text}"`}
          >
            ×
          </button>
        </div>
      ))}

      {/* Add item row — only shown when count < 7 */}
      {items.length < 7 && (
        <div className="flex items-center gap-2 pt-1">
          {adding ? (
            <>
              <input
                autoFocus
                type="text"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { void handleAdd() }
                  if (e.key === 'Escape') { setAdding(false); setNewText('') }
                }}
                onBlur={() => { if (!newText.trim()) setAdding(false) }}
                placeholder="Type action item..."
                className="flex-1 text-sm border-b border-stone-300 bg-transparent focus:outline-none"
              />
              <button onClick={() => void handleAdd()} className="text-xs text-stone-600 hover:text-stone-900">Add</button>
              <button onClick={() => { setAdding(false); setNewText('') }} className="text-xs text-stone-400 hover:text-stone-600">Cancel</button>
            </>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="text-xs text-stone-400 hover:text-stone-600"
            >
              + Add action item
            </button>
          )}
        </div>
      )}
    </div>
  )
}
```

### Pattern 4: WheelPage Integration — Per-Category Action Panel
**What:** WheelPage maintains a map of `categoryId → ActionItemRow[]` as local state, loaded lazily when a category panel is first expanded. A `expandedCategoryId` state (or a `Set<string>`) controls which category shows its action items.
**When to use:** This is the integration pattern. CategorySlider gets an `onExpandToggle` prop and an `isExpanded` prop, rendering the `ActionItemList` beneath the slider rows when expanded.

```typescript
// WheelPage.tsx additions (not a full rewrite)

// New state
const [actionItemsByCategory, setActionItemsByCategory] = useState<Record<string, ActionItemRow[]>>({})
const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
const { loadActionItems } = useActionItems()

async function handleExpandCategory(categoryId: string) {
  const isCurrentlyExpanded = expandedCategories.has(categoryId)
  if (isCurrentlyExpanded) {
    setExpandedCategories(prev => { const s = new Set(prev); s.delete(categoryId); return s })
    return
  }
  // Load action items if not yet loaded
  if (!actionItemsByCategory[categoryId]) {
    const items = await loadActionItems(categoryId)
    setActionItemsByCategory(prev => ({ ...prev, [categoryId]: items }))
  }
  setExpandedCategories(prev => new Set(prev).add(categoryId))
}

function handleActionItemsChange(categoryId: string, items: ActionItemRow[]) {
  setActionItemsByCategory(prev => ({ ...prev, [categoryId]: items }))
}
```

In the JSX, the category slider area becomes:
```typescript
{localCategories.map(cat => (
  <div key={cat.id}>
    <CategorySlider
      {...existingProps}
      isExpanded={expandedCategories.has(cat.id)}
      onExpandToggle={() => handleExpandCategory(cat.id)}
    />
    {expandedCategories.has(cat.id) && (
      <ActionItemList
        categoryId={cat.id}
        userId={userId}
        items={actionItemsByCategory[cat.id] ?? []}
        onItemsChange={(items) => handleActionItemsChange(cat.id, items)}
      />
    )}
  </div>
))}
```

CategorySlider receives two new optional props: `isExpanded?: boolean` and `onExpandToggle?: () => void`. The expand toggle button appears in the existing header row of CategorySlider (next to the rename/remove buttons).

### Pattern 5: shadcn Checkbox Usage
**What:** shadcn Checkbox component wraps `@radix-ui/react-checkbox`. It provides an accessible, styled checkbox that works with keyboard and screen readers.
**When to use:** ACTION-03 completion toggle.

```typescript
// Source: https://ui.shadcn.com/docs/components/checkbox
import { Checkbox } from '@/components/ui/checkbox'

// Usage
<Checkbox
  id="item-id"
  checked={item.is_complete}
  onCheckedChange={(checked) => handleToggle(item.id, Boolean(checked))}
/>
// onCheckedChange receives `boolean | 'indeterminate'` — cast to boolean
```

**Important:** `onCheckedChange` receives `CheckedState` which is `boolean | 'indeterminate'`. Always cast: `Boolean(checked)` or `checked === true`.

### Pattern 6: Native Date Input for Optional Deadline
**What:** `<input type="date">` bound to the item's `deadline` column. Value is always an ISO date string `YYYY-MM-DD` (what the `date` column stores). Empty string clears the deadline.
**When to use:** ACTION-02. No library needed.

```typescript
// Native date input — compatible with Supabase date column format
<input
  type="date"
  value={item.deadline ?? ''}
  onChange={(e) => handleDeadlineChange(item.id, e.target.value)}
  // e.target.value is 'YYYY-MM-DD' when a date is selected, '' when cleared
/>

// In the handler:
const deadline = e.target.value || null  // empty string → null
await supabase.from('action_items').update({ deadline }).eq('id', id)
```

Supabase PostgREST accepts ISO date strings for `date` columns directly. No conversion needed.

### Anti-Patterns to Avoid
- **Storing action items in the categories table as JSONB:** This breaks the relational model, makes per-item queries impossible, and complicates RLS. Always use a separate table.
- **Loading all action items for all categories on page mount:** This would send N+1 queries (one per category). Load lazily when a category panel is first expanded.
- **Calling Supabase on every keystroke in the "add item" input:** Wire Supabase only on Enter/submit, not on `onChange`. The text lives in local state until submitted.
- **Missing `WITH CHECK` on UPDATE policy:** The RLS pattern from Phase 2 (both `USING` and `WITH CHECK` on every UPDATE policy) is mandatory. Omitting `WITH CHECK` allows `user_id` to be changed on existing rows.
- **Enforcing the 7-item limit only in UI:** Also enforce in the hook's `addActionItem` function (same as the 12-category limit in `addCategory`). The DB does not have a CHECK constraint for count, so the application layer must be consistent.
- **Forgetting ON DELETE CASCADE from categories:** If a category is removed (Phase 2 already has this UX), its action items should disappear too. Always cascade from the FK definition.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Completion checkbox | Custom div with click handler | shadcn Checkbox | Accessible focus ring, keyboard toggle, ARIA role="checkbox", consistent design |
| Date picker | Custom calendar UI | Native `<input type="date">` | Desktop/tablet requirement fully met by native input; zero implementation cost |
| Optimistic delete | Complex server-reconciliation | Local state filter then async delete | For a single-user list, optimistic removal is safe and correct; rollback only needed on network error |
| Per-category item count limit | DB CHECK constraint or RLS | Count guard in `addActionItem` function | DB CHECK on aggregate count across rows is complex; hook-level guard matches existing pattern from `addCategory` |
| Action items storage | JSONB column on categories | Separate `action_items` table | Separate table enables per-item RLS, individual updates, ordered queries, and future features (AI check in v2) |

---

## Common Pitfalls

### Pitfall 1: Checkbox onCheckedChange Type
**What goes wrong:** TypeScript error — `onCheckedChange` receives `CheckedState` (`boolean | 'indeterminate'`), not `boolean`. Passing it directly to a boolean-typed handler fails type checking.
**Why it happens:** Radix Checkbox supports indeterminate state for parent checkboxes in tree hierarchies.
**How to avoid:** Always cast: `onCheckedChange={(checked) => handleToggle(item.id, checked === true)}` or `Boolean(checked)`.
**Warning signs:** TypeScript error "Type 'CheckedState' is not assignable to type 'boolean'".

### Pitfall 2: Native Date Input Returns Empty String, Not Null
**What goes wrong:** User clears a date input. `e.target.value` is `''` (empty string). Sending `''` to Supabase for a `date` column causes a type error.
**Why it happens:** HTML input values are always strings; empty = `''` not `null`.
**How to avoid:** Convert in the handler: `const deadline = e.target.value || null`. Always send `null` to clear a nullable column, not `''`.
**Warning signs:** Supabase error `invalid input syntax for type date: ""`.

### Pitfall 3: Date Column Format Mismatch
**What goes wrong:** Supabase `date` column returns rows with `deadline: '2026-04-01'`. If the UI tries to display via `new Date(deadline).toLocaleDateString()`, it may show a day-off result due to UTC vs local timezone interpretation.
**Why it happens:** `new Date('2026-04-01')` parses as UTC midnight, which in UTC-offset timezones renders as March 31.
**How to avoid:** Display the ISO string directly (`item.deadline` as-is), or append `T00:00:00` before constructing a Date, or use `deadline.split('-').reverse().join('/')` for locale-friendly display. The native date input already handles the value format correctly.
**Warning signs:** Deadline shows one day earlier than expected in timezones behind UTC.

### Pitfall 4: Action Items Load N+1 Pattern
**What goes wrong:** On page mount, one Supabase query fires per category to load action items (8 queries for 8 categories).
**Why it happens:** Loading all items eagerly in a useEffect that iterates over categories.
**How to avoid:** Load lazily on panel expand. If eager loading is ever needed (e.g., for a "total open items" count), use a single query: `supabase.from('action_items').select('*').eq('user_id', userId)` and fan out by `category_id` client-side.
**Warning signs:** Network tab shows 8+ identical-structure requests on WheelPage mount.

### Pitfall 5: RLS Missing on action_items Table
**What goes wrong:** A user can read or modify other users' action items via direct REST API calls.
**Why it happens:** RLS not enabled, or INSERT policy missing `WITH CHECK`.
**How to avoid:** Follow the exact template from `categories`: `ENABLE ROW LEVEL SECURITY` plus all four policies (SELECT, INSERT with WITH CHECK, UPDATE with both USING and WITH CHECK, DELETE). Verify in Studio after migration.
**Warning signs:** `supabase.from('action_items').select('*')` returns rows from other users.

### Pitfall 6: CategorySlider Rename Button UX Debt (from Phase 2)
**What goes wrong:** The Phase 2 VERIFICATION.md flagged that `CategorySlider`'s Rename button hardcodes `onRename('Renamed')` for test compatibility. Phase 3 adds an expand toggle to the same header row — this is a good opportunity to clean up the rename button UX.
**Why it happens:** Test compatibility artifact from Phase 2.
**How to avoid:** Fix the rename button in Phase 3 as part of the CategorySlider modification. The button should call `setEditing(true)` only (not fire `onRename`). Update the test mock accordingly — the `WheelPage.test.tsx` mock already implements the correct behavior (`onClick={() => onRename('Renamed')}`).
**Warning signs:** Clicking Rename immediately renames to "Renamed" without showing an input.

### Pitfall 7: Expand State Lost on Category Reorder or Re-render
**What goes wrong:** `expandedCategories` is a `Set<string>` of category IDs. If `localCategories` array is rebuilt from scratch (e.g., after `setCategories` is called by parent), the Set persists correctly because it uses IDs, not array indices.
**Why it happens:** Non-issue with ID-based keys — mentioned here as a confirmation. Would only matter if using array indices.
**How to avoid:** Always key expanded state by `category_id` (UUID), not by array position. The recommended pattern above already does this.

---

## Code Examples

### shadcn Checkbox — Installation and Usage
```typescript
// Install: npx shadcn@latest add checkbox
// Creates: src/components/ui/checkbox.tsx

// Source: https://ui.shadcn.com/docs/components/checkbox
import { Checkbox } from '@/components/ui/checkbox'

// In ActionItemList:
<Checkbox
  id={`item-${item.id}`}
  checked={item.is_complete}
  onCheckedChange={(checked) => {
    void handleToggle(item.id, checked === true)
  }}
  aria-label={`Mark "${item.text}" as complete`}
/>
<label
  htmlFor={`item-${item.id}`}
  className={item.is_complete ? 'line-through text-stone-400' : 'text-stone-700'}
>
  {item.text}
</label>
```

### Supabase query — Load action items for a category
```typescript
// Source: Supabase JS docs + established project pattern
const res = await supabase
  .from('action_items')
  .select('id, category_id, user_id, text, is_complete, deadline, position, created_at, updated_at')
  .eq('category_id', categoryId)
  .order('position', { ascending: true })
// res.data is ActionItemRow[] | null
```

### TypeScript type — ActionItemRow
```typescript
// Add to src/types/database.ts
export type ActionItemRow = {
  id: string
  category_id: string
  user_id: string
  text: string
  is_complete: boolean
  deadline: string | null  // 'YYYY-MM-DD' or null
  position: number
  created_at: string
  updated_at: string
}
```

Also update the `Database` type in `database.ts`:
```typescript
action_items: {
  Row: ActionItemRow
  Insert: Omit<ActionItemRow, 'id' | 'created_at' | 'updated_at'>
  Update: Partial<Pick<ActionItemRow, 'text' | 'is_complete' | 'deadline' | 'position' | 'updated_at'>>
  Relationships: []
}
```

### Seed data — action items for both dev users
The seed.sql already notes "Action items (Phase 3): mix of open, completed, and with deadlines" for both users. The pattern follows the deterministic UUID approach. Category IDs for seed data must be queried by position or given deterministic UUIDs. The easiest approach is to assign deterministic UUIDs to the first few categories in the seed block so action items can reference them.

```sql
-- Deterministic category UUIDs (assign in Phase 3 seed block, or retroactively update Phase 2 seed)
-- Option A: Add deterministic IDs to the Phase 2 category inserts (preferred — simpler)
-- Option B: Query category IDs by name in the Phase 3 seed block

-- Phase 3 seed block example (using names to look up category IDs):
DO $$
DECLARE
  free_wheel_id uuid := '00000000-0000-0000-0000-000000000011';
  free_user_id  uuid := '00000000-0000-0000-0000-000000000001';
  health_cat_id uuid;
  career_cat_id uuid;
BEGIN
  SELECT id INTO health_cat_id FROM public.categories
    WHERE wheel_id = free_wheel_id AND name = 'Health';
  SELECT id INTO career_cat_id FROM public.categories
    WHERE wheel_id = free_wheel_id AND name = 'Career';

  INSERT INTO public.action_items (category_id, user_id, text, is_complete, deadline, position)
    VALUES
      (health_cat_id, free_user_id, 'Run 3x per week',        false, '2026-04-30', 0),
      (health_cat_id, free_user_id, 'Sleep before midnight',  true,  null,         1),
      (health_cat_id, free_user_id, 'Schedule annual checkup', false, '2026-05-15', 2),
      (career_cat_id, free_user_id, 'Finish online course',   false, '2026-06-01', 0),
      (career_cat_id, free_user_id, 'Update LinkedIn',        true,  null,         1)
    ON CONFLICT DO NOTHING;
END $$;
```

**Note on seed approach:** The name-based lookup is slightly fragile (renames break it). An alternative is to assign deterministic UUIDs to the Phase 2 category insert rows. The Phase 3 planner should decide which approach to use and update seed.sql accordingly. If deterministic category UUIDs are assigned in the Phase 2 seed block (with an `ON CONFLICT DO UPDATE SET id = EXCLUDED.id` — not possible after insert), the best path is to add deterministic UUIDs directly to the INSERT in the Phase 2 seed `DO $$ block` and update seed.sql as part of Phase 3's migration plan.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| JSONB columns for lists | Separate relational tables | Always best practice | Enables per-row RLS, individual updates, future AI features |
| Custom checkbox | Radix UI / shadcn Checkbox | 2022+ | Accessible focus management, keyboard support, consistent styling |
| date-fns or moment for date display | Native date input + ISO string display | 2023+ (browsers matured) | Native date input is well-supported on desktop; avoids bundle weight |
| Eager loading all sub-items | Lazy/on-demand loading | Always better UX | Only loads data when user expands a panel |

**No deprecated approaches in scope for this phase.** The `date` column type instead of `timestamptz` is a deliberate simplification — action item deadlines are date-only, not time-bound.

---

## Open Questions

1. **Seed category UUID strategy**
   - What we know: Phase 2 seed inserts categories without deterministic UUIDs (uses `gen_random_uuid()`). Phase 3 seed needs to reference these category rows to insert action items.
   - What's unclear: Should the Phase 3 seed do a name-based lookup (simpler, slightly fragile) or should the Phase 3 migration update the Phase 2 seed to use deterministic category UUIDs?
   - Recommendation: Use name-based lookup in the Phase 3 seed block. It works correctly for the standard 8-category template and avoids retroactively changing Phase 2 migrations. Document the fragility: if category names in seed are changed, the lookup must be updated.

2. **Expand/collapse vs. always-visible action items**
   - What we know: The requirements do not specify whether action items are always visible or shown on demand. The current WheelPage right column is already scrollable at `max-h-[500px]`.
   - What's unclear: If all categories show action items simultaneously, the right column becomes very tall on an 8-category wheel with 7 items each.
   - Recommendation: Expand/collapse per category (collapsed by default). This keeps the initial view clean and matches the cognitive model: focus on one category's actions at a time.

3. **Rename button UX debt from Phase 2**
   - What we know: Phase 2 VERIFICATION.md flagged that the Rename button in CategorySlider hardcodes `onRename('Renamed')` for test compatibility.
   - What's unclear: Should Phase 3 fix this as part of the CategorySlider modification, or defer to a later phase?
   - Recommendation: Fix it in Phase 3 during the CategorySlider modification. The fix is small (remove the immediate `onRename('Renamed')` call from the button click handler; only call `setEditing(true)`), and Phase 3 is touching CategorySlider anyway to add the expand toggle.

4. **Position management on delete**
   - What we know: `position` column orders action items. If item at position 1 is deleted (leaving positions 0, 2, 3), the items are still ordered correctly via `ORDER BY position` with gaps tolerated.
   - What's unclear: Should positions be compacted after delete?
   - Recommendation: Tolerate gaps. Use `ORDER BY position, created_at` as tiebreaker. Re-compaction on every delete adds complexity for no user-visible benefit. Matches the same decision made for categories (Phase 2 research noted this same pattern).

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
| ACTION-01 | addActionItem blocks at 7, succeeds at 6 | unit (mock Supabase) | `npm test -- --run src/hooks/useActionItems.test.ts` | Wave 0 |
| ACTION-01 | Add item button disabled when count = 7 | unit (render ActionItemList) | `npm test -- --run src/components/ActionItemList.test.tsx` | Wave 0 |
| ACTION-02 | Deadline input renders with item; empty when no deadline; ISO value when set | unit | `npm test -- --run src/components/ActionItemList.test.tsx` | Wave 0 |
| ACTION-02 | handleDeadlineChange converts empty string to null before Supabase update | unit | `npm test -- --run src/hooks/useActionItems.test.ts` | Wave 0 |
| ACTION-03 | Toggle calls toggleActionItem; item text gets line-through class | unit | `npm test -- --run src/components/ActionItemList.test.tsx` | Wave 0 |
| ACTION-03 | Checkbox is checked when item.is_complete is true | unit | `npm test -- --run src/components/ActionItemList.test.tsx` | Wave 0 |
| ACTION-04 | Delete removes item from local list immediately (optimistic) | unit | `npm test -- --run src/components/ActionItemList.test.tsx` | Wave 0 |
| ACTION-04 | deleteActionItem calls Supabase DELETE | unit | `npm test -- --run src/hooks/useActionItems.test.ts` | Wave 0 |
| WheelPage integration | Expanding category loads action items and renders ActionItemList | unit (mock hooks) | `npm test -- --run src/components/WheelPage.test.tsx` | update existing |
| DB schema + RLS | action_items row only visible to owner | manual smoke | `supabase db reset && Supabase Studio RLS check` | Manual only |

### Sampling Rate
- **Per task commit:** `npm test -- --run`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green + manual smoke: log in as free-tier user, expand Health category, add/check/delete items before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/hooks/useActionItems.test.ts` — covers ACTION-01 hook logic, ACTION-02 deadline null conversion, ACTION-04 delete call
- [ ] `src/components/ActionItemList.test.tsx` — covers ACTION-01 add button disabled at 7, ACTION-02 date display, ACTION-03 checkbox toggle + line-through, ACTION-04 optimistic removal
- [ ] `src/components/ui/checkbox.tsx` — from `npx shadcn@latest add checkbox` (not a test file, but a Wave 0 prerequisite)

*(WheelPage.test.tsx already exists — update required to add expand/collapse and ActionItemList integration tests)*

---

## Sources

### Primary (HIGH confidence)
- https://ui.shadcn.com/docs/components/checkbox — Checkbox installation, `onCheckedChange` type (`CheckedState = boolean | 'indeterminate'`), usage with label
- https://supabase.com/docs/guides/database/postgres/row-level-security — RLS WITH CHECK pattern (established in Phase 2, same pattern applies)
- Codebase: `src/hooks/useCategories.ts` — canonical hook pattern for the project; `useActionItems` mirrors this exactly
- Codebase: `src/components/CategorySlider.tsx` — integration point for expand/collapse toggle
- Codebase: `src/pages/WheelPage.tsx` (272 lines) — integration point; all state patterns confirmed

### Secondary (MEDIUM confidence)
- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/date — Native date input: value format `YYYY-MM-DD`, empty string when cleared, well-supported on desktop/tablet
- https://supabase.com/docs/reference/javascript/insert — Supabase JS insert + .select() pattern (same as used in Phase 2)

### Tertiary (LOW confidence)
- None — all Phase 3 findings are either directly verifiable from the existing codebase or from official docs

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new npm packages except shadcn Checkbox; all other libraries already installed and in use
- Architecture patterns: HIGH — directly derived from existing Phase 2 code (useCategories, WheelPage, CategorySlider); no novel patterns introduced
- Database schema: HIGH — same RLS pattern as Phase 2 categories, verified in production-equivalent migrations
- Pitfalls: HIGH — Checkbox type issue verified from Radix docs; date empty string issue verified from MDN; others derived from established Phase 2 lessons
- Seed data: MEDIUM — name-based category lookup is functional but slightly fragile; flagged in Open Questions

**Research date:** 2026-03-15
**Valid until:** 2026-06-15 (90 days — shadcn Checkbox API is stable; Supabase RLS behavior is stable; native date input behavior is stable)
