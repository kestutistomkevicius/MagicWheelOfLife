# Phase 10: Pre-Launch Improvements — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add soft-delete for wheels (10-min undo window), hard-delete for snapshots, a pinned footer with legal links in authenticated views, and fix the DueSoonWidget hover highlight on the wheel chart.

**Architecture:** Four independent features. DB migration adds `deleted_at` to `wheels` plus a pg_cron cleanup job. Hook layer gets `deleteWheel`/`undoDeleteWheel` (useWheel) and `deleteSnapshot` (useSnapshots). WheelPage and SnapshotsPage get inline AlertDialog confirmations. AppShell wraps `<main>` and a new `<footer>` in a flex column. WheelChart loses the `key` prop that caused blank re-renders on hover.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Vite, Vitest, Supabase (PostgreSQL + RLS + pg_cron), lucide-react, Recharts

**Spec:** `docs/superpowers/specs/2026-03-21-phase-10-pre-launch-improvements-design.md`

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/20260321000001_wheel_soft_delete.sql` | Create | Add `deleted_at` column, update `count_user_wheels()`, add pg_cron cleanup |
| `src/types/database.ts` | Modify | Add `deleted_at` to `WheelRow` and `Database.Tables.wheels.Update` |
| `src/hooks/useWheel.ts` | Modify | Add `deleteWheel`, `undoDeleteWheel`; fix `canCreateWheel`; fix SELECT |
| `src/hooks/useWheel.test.ts` | Modify | Tests for new hook methods; update fixtures with `deleted_at` |
| `src/pages/WheelPage.tsx` | Modify | Delete button, AlertDialog, undo banner, empty-state recovery, dropdown suffix |
| `src/components/WheelPage.test.tsx` | Modify | Tests for delete/undo UI; update fixtures with `deleted_at` |
| `src/hooks/useSnapshots.ts` | Modify | Add `deleteSnapshot` |
| `src/pages/SnapshotsPage.tsx` | Modify | Trash icon per row, AlertDialog, batched state update, dropdown suffix |
| `src/pages/SnapshotsPage.test.tsx` | Modify | Tests for snapshot delete; update wheel fixtures with `deleted_at` |
| `src/pages/TrendPage.tsx` | Modify | Soft-deleted wheel dropdown suffix |
| `src/pages/TrendPage.test.tsx` | Modify | Update wheel fixtures with `deleted_at` |
| `src/components/AppShell.tsx` | Modify | Add pinned footer with Terms/Privacy links |
| `src/components/WheelChart.tsx` | Modify | Remove `key` prop from `<RadarChart>` to fix hover highlight |
| `.planning/ROADMAP.md` | Modify | Phase 10 renamed; Launch moved to Phase 15 |

---

## Task 1: Rename branch and update ROADMAP

**Files:**
- Modify: `.planning/ROADMAP.md`

- [ ] **Step 1: Rename git branch**

```bash
git branch -m phase/10-launch phase/10-pre-launch-improvements
```

- [ ] **Step 2: Update ROADMAP.md Phase 10 entry**

Find the Phase 10 block in `.planning/ROADMAP.md` and replace it:

```markdown
- [ ] **Phase 10: Pre-Launch Improvements** - Soft-delete wheels with 10-min recovery, delete snapshots, authenticated footer, hover highlight fix
```

Find the Phase 10 Details section (`### Phase 10: Launch`) and replace with:

```markdown
### Phase 10: Pre-Launch Improvements
**Goal**: Users can delete wheels (with 10-minute undo), delete snapshots, access legal links from within the app, and the DueSoon hover highlight works correctly
**Depends on**: Phase 9
**Requirements**: (derived from todo backlog — no formal requirement IDs)
**Success Criteria** (what must be TRUE):
  1. Soft-deleting a wheel keeps it visible in the selector with "— Deleting in ~10 min" suffix; clicking Undo restores it; after 10 min the DB hard-deletes it
  2. When all wheels are soft-deleted the empty state shows a "Recover a wheel" section
  3. A snapshot can be deleted from the Snapshots page with a confirmation; it disappears immediately from all lists
  4. A pinned footer with Terms and Privacy links is visible on every authenticated page
  5. Hovering a due-soon item highlights the matching category axis in the wheel chart
**Plans**: TBD
```

Add Phase 15 at the bottom of the Phases list:

```markdown
- [ ] **Phase 15: Launch** - Production deployment on Vercel and Supabase Cloud
```

Update the Progress table: change Phase 10 row to `Pre-Launch Improvements` and add Phase 15 row as `Launch | 0/TBD | Not started`.

- [ ] **Step 3: Commit**

```bash
git add .planning/ROADMAP.md
git commit -m "docs: rename phase 10 to pre-launch improvements, move launch to phase 15"
```

---

## Task 2: DB migration — wheel soft-delete

**Files:**
- Create: `supabase/migrations/20260321000001_wheel_soft_delete.sql`

- [ ] **Step 1: Create migration file**

```sql
-- supabase/migrations/20260321000001_wheel_soft_delete.sql
-- Phase 10: Soft-delete for wheels
-- Adds deleted_at column, updates count_user_wheels() to ignore soft-deleted wheels,
-- and schedules a pg_cron job to hard-delete after 10 minutes.

-- 1. Add deleted_at column (nullable — NULL means active)
ALTER TABLE public.wheels
  ADD COLUMN deleted_at timestamptz DEFAULT NULL;

-- 2. Update count_user_wheels() to exclude soft-deleted wheels.
--    Free-tier INSERT policy calls this to enforce the 1-wheel limit.
--    Uses CREATE OR REPLACE so no DROP/recreate needed.
CREATE OR REPLACE FUNCTION public.count_user_wheels()
RETURNS integer LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.wheels
  WHERE user_id = (SELECT auth.uid())
    AND deleted_at IS NULL;
$$;

-- 3. pg_cron: hard-delete soft-deleted wheels older than 10 minutes.
--    Runs every 10 minutes. pg_cron extension already enabled from Phase 9 migration.
SELECT cron.schedule(
  'hard-delete-soft-deleted-wheels',
  '*/10 * * * *',
  $$DELETE FROM public.wheels WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '10 minutes'$$
);
```

- [ ] **Step 2: Apply migration locally**

```bash
npx supabase db reset
```

Expected: all migrations apply cleanly, no errors. Verify in Studio (http://localhost:54323) that `wheels` table has a `deleted_at` column.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260321000001_wheel_soft_delete.sql
git commit -m "feat: add deleted_at to wheels, update count_user_wheels, add pg_cron cleanup"
```

---

## Task 3: TypeScript types + fixture updates

**Files:**
- Modify: `src/types/database.ts`
- Modify: `src/hooks/useWheel.test.ts`
- Modify: `src/components/WheelPage.test.tsx`
- Modify: `src/pages/SnapshotsPage.test.tsx`
- Modify: `src/pages/TrendPage.test.tsx`

- [ ] **Step 1: Update `WheelRow` and `Database.Tables.wheels.Update` in `src/types/database.ts`**

In `WheelRow` (line 21–27), add `deleted_at`:

```ts
export type WheelRow = {
  id: string
  user_id: string
  name: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}
```

In `Database.Tables.wheels` (line 103–108), add `deleted_at` to the `Update` type:

```ts
wheels: {
  Row: WheelRow
  Insert: Omit<WheelRow, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
  Update: Partial<Pick<WheelRow, 'name' | 'updated_at' | 'deleted_at'>>
  Relationships: []
}
```

- [ ] **Step 2: Update `mockWheel` fixture in `src/hooks/useWheel.test.ts`** (line 47–53)

```ts
const mockWheel: WheelRow = {
  id: 'wheel-001',
  user_id: USER_ID,
  name: 'My Wheel',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  deleted_at: null,
}
```

- [ ] **Step 3: Update `defaultWheelResult` in `src/components/WheelPage.test.tsx`** (line 17–35)

Add `deleted_at: null` to both the `wheel` object and every item in the `wheels` array:

```ts
const defaultWheelResult = {
  wheel: { id: 'wheel-1', user_id: 'user-1', name: 'My Wheel', created_at: '', updated_at: '', deleted_at: null },
  wheels: [{ id: 'wheel-1', user_id: 'user-1', name: 'My Wheel', created_at: '', updated_at: '', deleted_at: null }],
  // ... rest unchanged
}
```

- [ ] **Step 4: Update wheel fixtures in `src/pages/SnapshotsPage.test.tsx`** (line 31–46)

Add `deleted_at: null` to the `wheel` and `wheels` objects in the `useWheel` mock return:

```ts
vi.mock('@/hooks/useWheel', () => ({
  useWheel: vi.fn(() => ({
    wheel: { id: 'wheel-1', user_id: 'user-1', name: 'My Wheel', created_at: '', updated_at: '', deleted_at: null },
    wheels: [{ id: 'wheel-1', user_id: 'user-1', name: 'My Wheel', created_at: '', updated_at: '', deleted_at: null }],
    // ... rest unchanged
  })),
}))
```

- [ ] **Step 5: Update wheel fixtures in `src/pages/TrendPage.test.tsx`**

Same pattern — add `deleted_at: null` to all `WheelRow` fixtures in the `useWheel` mock.

- [ ] **Step 6: Run tests to verify fixtures compile and pass**

```bash
npm test
```

Expected: all existing tests pass (fixture updates are type-only, no logic changed).

- [ ] **Step 7: Commit**

```bash
git add src/types/database.ts src/hooks/useWheel.test.ts src/components/WheelPage.test.tsx src/pages/SnapshotsPage.test.tsx src/pages/TrendPage.test.tsx
git commit -m "feat: add deleted_at to WheelRow type and update test fixtures"
```

---

## Task 4: useWheel hook — deleteWheel / undoDeleteWheel

**Files:**
- Modify: `src/hooks/useWheel.ts`
- Modify: `src/hooks/useWheel.test.ts`

- [ ] **Step 1: Write failing tests** in `src/hooks/useWheel.test.ts`

Add a new `describe('deleteWheel')` block after the existing tests:

```ts
describe('deleteWheel', () => {
  it('sets deleted_at on the wheel in DB and updates local wheels state', async () => {
    const wheel2: WheelRow = { id: 'wheel-002', user_id: USER_ID, name: 'Wheel 2', created_at: '2026-02-01T00:00:00Z', updated_at: '2026-02-01T00:00:00Z', deleted_at: null }

    // Initial load: free tier + two wheels
    mockFromSequence([
      { data: { id: USER_ID, tier: 'free', created_at: '' }, error: null }, // profiles
      { data: [mockWheel, wheel2], error: null },                           // wheels
      { data: [], error: null },                                            // categories for wheel-001
    ])

    const { result } = renderHook(() => useWheel(USER_ID))
    await waitFor(() => expect(result.current.loading).toBe(false))

    // deleteWheel calls: supabase.from('wheels').update().eq().eq()
    vi.mocked(supabase.from).mockImplementation(() => {
      const chain: Record<string, unknown> = {}
      chain.update = vi.fn().mockReturnValue(chain)
      chain.eq = vi.fn().mockReturnValue(chain)
      chain.then = (resolve: (v: unknown) => void) => Promise.resolve({ data: null, error: null }).then(resolve)
      return chain as ReturnType<typeof supabase.from>
    })

    await act(async () => { await result.current.deleteWheel('wheel-001') })

    const deletedWheel = result.current.wheels.find(w => w.id === 'wheel-001')
    expect(deletedWheel?.deleted_at).not.toBeNull()
  })

  it('auto-selects most recent non-deleted wheel after delete', async () => {
    const wheel2: WheelRow = { id: 'wheel-002', user_id: USER_ID, name: 'Wheel 2', created_at: '2026-02-01T00:00:00Z', updated_at: '2026-02-01T00:00:00Z', deleted_at: null }

    mockFromSequence([
      { data: { id: USER_ID, tier: 'free', created_at: '' }, error: null },
      { data: [mockWheel, wheel2], error: null },
      { data: [], error: null }, // categories for wheel-001
    ])

    const { result } = renderHook(() => useWheel(USER_ID))
    await waitFor(() => expect(result.current.loading).toBe(false))

    // Mock: update (deleteWheel) + categories fetch (selectWheel)
    let callCount = 0
    vi.mocked(supabase.from).mockImplementation(() => {
      callCount++
      const isUpdate = callCount === 1
      const chain: Record<string, unknown> = {}
      chain.select = vi.fn().mockReturnValue(chain)
      chain.update = vi.fn().mockReturnValue(chain)
      chain.eq = vi.fn().mockReturnValue(chain)
      chain.order = vi.fn().mockReturnValue(chain)
      const terminalData = isUpdate ? { data: null, error: null } : { data: [], error: null }
      chain.then = (resolve: (v: unknown) => void) => Promise.resolve(terminalData).then(resolve)
      return chain as ReturnType<typeof supabase.from>
    })

    await act(async () => { await result.current.deleteWheel('wheel-001') })

    expect(result.current.wheel?.id).toBe('wheel-002')
  })

  it('sets wheel=null and canCreateWheel=true when last wheel is deleted', async () => {
    mockFromSequence([
      { data: { id: USER_ID, tier: 'free', created_at: '' }, error: null },
      { data: [mockWheel], error: null },
      { data: [], error: null },
    ])

    const { result } = renderHook(() => useWheel(USER_ID))
    await waitFor(() => expect(result.current.loading).toBe(false))

    vi.mocked(supabase.from).mockImplementation(() => {
      const chain: Record<string, unknown> = {}
      chain.update = vi.fn().mockReturnValue(chain)
      chain.eq = vi.fn().mockReturnValue(chain)
      chain.then = (resolve: (v: unknown) => void) => Promise.resolve({ data: null, error: null }).then(resolve)
      return chain as ReturnType<typeof supabase.from>
    })

    await act(async () => { await result.current.deleteWheel('wheel-001') })

    expect(result.current.wheel).toBeNull()
    expect(result.current.canCreateWheel).toBe(true)
  })
})

describe('undoDeleteWheel', () => {
  it('clears deleted_at in DB and local state', async () => {
    const deletedWheel: WheelRow = { ...mockWheel, deleted_at: '2026-03-21T10:00:00Z' }

    mockFromSequence([
      { data: { id: USER_ID, tier: 'free', created_at: '' }, error: null },
      { data: [deletedWheel], error: null },
      { data: [], error: null },
    ])

    const { result } = renderHook(() => useWheel(USER_ID))
    await waitFor(() => expect(result.current.loading).toBe(false))

    vi.mocked(supabase.from).mockImplementation(() => {
      const chain: Record<string, unknown> = {}
      chain.select = vi.fn().mockReturnValue(chain)
      chain.update = vi.fn().mockReturnValue(chain)
      chain.eq = vi.fn().mockReturnValue(chain)
      chain.order = vi.fn().mockReturnValue(chain)
      chain.then = (resolve: (v: unknown) => void) => Promise.resolve({ data: null, error: null }).then(resolve)
      return chain as ReturnType<typeof supabase.from>
    })

    await act(async () => { await result.current.undoDeleteWheel('wheel-001') })

    const restoredWheel = result.current.wheels.find(w => w.id === 'wheel-001')
    expect(restoredWheel?.deleted_at).toBeNull()
  })

  it('sets canCreateWheel=false for free-tier user after undo restores a wheel', async () => {
    const deletedWheel: WheelRow = { ...mockWheel, deleted_at: '2026-03-21T10:00:00Z' }

    mockFromSequence([
      { data: { id: USER_ID, tier: 'free', created_at: '' }, error: null },
      { data: [deletedWheel], error: null },
      { data: [], error: null },
    ])

    const { result } = renderHook(() => useWheel(USER_ID))
    await waitFor(() => expect(result.current.loading).toBe(false))

    vi.mocked(supabase.from).mockImplementation(() => {
      const chain: Record<string, unknown> = {}
      chain.select = vi.fn().mockReturnValue(chain)
      chain.update = vi.fn().mockReturnValue(chain)
      chain.eq = vi.fn().mockReturnValue(chain)
      chain.order = vi.fn().mockReturnValue(chain)
      chain.then = (resolve: (v: unknown) => void) => Promise.resolve({ data: [], error: null }).then(resolve)
      return chain as ReturnType<typeof supabase.from>
    })

    await act(async () => { await result.current.undoDeleteWheel('wheel-001') })

    expect(result.current.canCreateWheel).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/hooks/useWheel.test.ts
```

Expected: FAIL — `deleteWheel is not a function` / `undoDeleteWheel is not a function`.

- [ ] **Step 3: Implement hook changes in `src/hooks/useWheel.ts`**

**3a. Add methods to `UseWheelResult` interface** (after `updateCategoryImportant` line 39):

```ts
deleteWheel: (wheelId: string) => Promise<void>
undoDeleteWheel: (wheelId: string) => Promise<void>
```

**3b. Fix the SELECT query** (line 81) — add `deleted_at`:

```ts
.select('id, user_id, name, created_at, updated_at, deleted_at')
```

**3c. Fix `canCreateWheel` computation** (line 95):

```ts
setCanCreateWheel(userTier === 'premium' || allWheels.filter(w => !w.deleted_at).length === 0)
```

**3d. Add `deleteWheel` function** (after `renameWheel`, before `reorderWithImportantFirst`):

```ts
async function deleteWheel(wheelId: string): Promise<void> {
  const now = new Date().toISOString()
  await supabase
    .from('wheels')
    .update({ deleted_at: now })
    .eq('id', wheelId)
    .eq('user_id', userId)

  setWheels(prev => prev.map(w => w.id === wheelId ? { ...w, deleted_at: now } : w))

  const remaining = wheels
    .filter(w => w.id !== wheelId && !w.deleted_at)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))

  if (remaining.length === 0) {
    setWheel(null)
    setCategories([])
    setCanCreateWheel(true)
  } else {
    await selectWheel(remaining[remaining.length - 1].id)
  }
}
```

**3e. Add `undoDeleteWheel` function** (after `deleteWheel`):

```ts
async function undoDeleteWheel(wheelId: string): Promise<void> {
  await supabase
    .from('wheels')
    .update({ deleted_at: null })
    .eq('id', wheelId)
    .eq('user_id', userId)

  setWheels(prev => prev.map(w => w.id === wheelId ? { ...w, deleted_at: null } : w))
  setWheel(prev => prev?.id === wheelId ? { ...prev, deleted_at: null } : prev)

  // If wheel was null (empty state undo), load the restored wheel
  if (!wheel) {
    await selectWheel(wheelId)
  }

  const activeCount = wheels.filter(w => w.id !== wheelId && !w.deleted_at).length + 1
  if (tier === 'free' && activeCount >= 1) {
    setCanCreateWheel(false)
  }
}
```

**3f. Add both to the return object** (after `updateCategoryImportant`):

```ts
deleteWheel,
undoDeleteWheel,
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/hooks/useWheel.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Run full suite to catch regressions**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useWheel.ts src/hooks/useWheel.test.ts
git commit -m "feat: add deleteWheel and undoDeleteWheel to useWheel hook"
```

---

## Task 5: WheelPage — delete button, undo banner, empty-state recovery, dropdown suffix

**Files:**
- Modify: `src/pages/WheelPage.tsx`
- Modify: `src/components/WheelPage.test.tsx`

- [ ] **Step 1: Write failing tests** in `src/components/WheelPage.test.tsx`

**1a. Add mock variables and AlertDialog mock** near the top, after the existing `vi.mock` blocks:

```ts
const mockDeleteWheel = vi.fn()
const mockUndoDeleteWheel = vi.fn()
```

Add `deleteWheel: mockDeleteWheel, undoDeleteWheel: mockUndoDeleteWheel` to `defaultWheelResult`.

Add the AlertDialog mock (Radix portals don't work in jsdom):

```ts
vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  AlertDialogContent: ({ children }: { children: React.ReactNode }) => <div data-testid="alert-dialog-content">{children}</div>,
  AlertDialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogAction: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button data-testid="alert-dialog-action" onClick={onClick}>{children}</button>
  ),
  AlertDialogCancel: ({ children }: { children: React.ReactNode }) => (
    <button data-testid="alert-dialog-cancel">{children}</button>
  ),
}))
```

**1b. Add test cases:**

```ts
describe('delete wheel', () => {
  it('renders a delete wheel button', () => {
    render(<MemoryRouter><WheelPage /></MemoryRouter>)
    expect(screen.getByRole('button', { name: /delete wheel/i })).toBeInTheDocument()
  })

  it('calls deleteWheel when Schedule deletion is confirmed', async () => {
    mockDeleteWheel.mockResolvedValue(undefined)
    render(<MemoryRouter><WheelPage /></MemoryRouter>)

    fireEvent.click(screen.getByRole('button', { name: /delete wheel/i }))
    fireEvent.click(screen.getByTestId('alert-dialog-action'))

    await waitFor(() => {
      expect(mockDeleteWheel).toHaveBeenCalledWith('wheel-1')
    })
  })

  it('shows undo banner when current wheel has deleted_at set', () => {
    vi.mocked(useWheel).mockReturnValueOnce({
      ...defaultWheelResult,
      wheel: { ...defaultWheelResult.wheel!, deleted_at: '2026-03-21T10:00:00Z' },
    })
    render(<MemoryRouter><WheelPage /></MemoryRouter>)
    expect(screen.getByText(/scheduled for deletion/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument()
  })

  it('calls undoDeleteWheel when Undo is clicked in the banner', async () => {
    mockUndoDeleteWheel.mockResolvedValue(undefined)
    vi.mocked(useWheel).mockReturnValueOnce({
      ...defaultWheelResult,
      wheel: { ...defaultWheelResult.wheel!, deleted_at: '2026-03-21T10:00:00Z' },
    })
    render(<MemoryRouter><WheelPage /></MemoryRouter>)

    fireEvent.click(screen.getByRole('button', { name: /undo/i }))
    await waitFor(() => {
      expect(mockUndoDeleteWheel).toHaveBeenCalledWith('wheel-1')
    })
  })

  it('shows recover section in empty state when soft-deleted wheels exist', () => {
    vi.mocked(useWheel).mockReturnValueOnce({
      ...defaultWheelResult,
      wheel: null,
      wheels: [{ id: 'wheel-1', user_id: 'user-1', name: 'My Wheel', created_at: '', updated_at: '', deleted_at: '2026-03-21T10:00:00Z' }],
    })
    render(<MemoryRouter><WheelPage /></MemoryRouter>)
    expect(screen.getByText(/recover a wheel/i)).toBeInTheDocument()
    expect(screen.getByText('My Wheel')).toBeInTheDocument()
  })

  it('shows soft-deleted wheel with suffix in dropdown', () => {
    vi.mocked(useWheel).mockReturnValueOnce({
      ...defaultWheelResult,
      wheels: [
        { id: 'wheel-1', user_id: 'user-1', name: 'Active', created_at: '', updated_at: '', deleted_at: null },
        { id: 'wheel-2', user_id: 'user-1', name: 'Old Wheel', created_at: '', updated_at: '', deleted_at: '2026-03-21T10:00:00Z' },
      ],
    })
    render(<MemoryRouter><WheelPage /></MemoryRouter>)
    expect(screen.getByText('Old Wheel — Deleting in ~10 min')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/components/WheelPage.test.tsx
```

Expected: FAIL — new test cases can't find elements that don't exist yet.

- [ ] **Step 3: Implement WheelPage changes in `src/pages/WheelPage.tsx`**

**3a. Add imports at the top:**

```ts
import { Trash2 } from 'lucide-react'
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogFooter, AlertDialogTitle, AlertDialogDescription,
  AlertDialogAction, AlertDialogCancel,
} from '@/components/ui/alert-dialog'
```

**3b. Destructure new hook methods** (update the `useWheel` destructure line):

```ts
const { wheel, wheels, categories, setCategories, loading, error, canCreateWheel, tier,
  selectWheel, createWheel, updateScore, renameWheel, updateCategoryImportant,
  deleteWheel, undoDeleteWheel } = useWheel(userId)
```

**3c. Update the wheel `<option>` rendering** wherever the wheel `<select>` appears. The WheelPage has a `<select>` in the header when `wheels.length > 1`. Update its `<option>` map:

```tsx
{wheels.map(w => (
  <option key={w.id} value={w.id} className={w.deleted_at ? 'text-red-400' : ''}>
    {w.deleted_at ? `${w.name} — Deleting in ~10 min` : w.name}
  </option>
))}
```

**3d. Add the undo banner** directly after the page's opening `<div className="p-6 ...">` wrapper (before the header row):

```tsx
{wheel?.deleted_at && (
  <div className="mb-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
    <span>This wheel is scheduled for deletion in ~10 min.</span>
    <button
      className="ml-4 font-medium underline hover:no-underline"
      onClick={() => void undoDeleteWheel(wheel.id)}
    >
      Undo
    </button>
  </div>
)}
```

**3e. Add the delete button** in the header's button row (after the "+ New wheel" button):

```tsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <button
      aria-label="Delete wheel"
      className="p-1.5 text-stone-400 hover:text-red-500 rounded"
    >
      <Trash2 size={16} />
    </button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete &ldquo;{wheel.name}&rdquo;?</AlertDialogTitle>
      <AlertDialogDescription>
        The wheel will be permanently deleted in 10 minutes. You can undo this from the wheel selector.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction
        className="bg-red-600 hover:bg-red-700 text-white"
        onClick={() => void deleteWheel(wheel.id)}
      >
        Schedule deletion
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**3f. Update the empty state** (`wheel === null` branch, lines 135–154). Replace the existing empty-state JSX with:

```tsx
if (wheel === null) {
  const softDeleted = wheels.filter(w => w.deleted_at !== null)
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      {softDeleted.length > 0 && (
        <div className="w-full max-w-sm space-y-2 mb-2">
          <p className="text-sm font-medium text-stone-600 text-center">Recover a wheel</p>
          {softDeleted.map(w => (
            <div key={w.id} className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm">
              <span className="text-stone-700">{w.name}</span>
              <button
                className="text-red-600 hover:text-red-800 font-medium"
                onClick={() => void undoDeleteWheel(w.id)}
              >
                Undo
              </button>
            </div>
          ))}
        </div>
      )}
      <p className="text-stone-600">You haven&apos;t created a wheel yet.</p>
      <button
        className="px-4 py-2 bg-stone-800 text-white rounded hover:bg-stone-700"
        onClick={() => setModalOpen(true)}
      >
        Create my wheel
      </button>
      <CreateWheelModal
        open={modalOpen}
        showUpgradePrompt={false}
        onOpenChange={setModalOpen}
        onCreate={async (mode, name) => { await createWheel(mode, name, userId) }}
      />
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/components/WheelPage.test.tsx
```

Expected: all tests pass.

- [ ] **Step 5: Run full suite**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/pages/WheelPage.tsx src/components/WheelPage.test.tsx
git commit -m "feat: soft-delete wheel with undo banner and empty-state recovery"
```

---

## Task 6: SnapshotsPage + TrendPage — soft-deleted wheel dropdown suffix

**Files:**
- Modify: `src/pages/SnapshotsPage.tsx`
- Modify: `src/pages/TrendPage.tsx`

These pages already render a wheel `<select>` when `wheels.length > 1`. The change is identical to Task 5 Step 3c — show the suffix for soft-deleted wheels.

- [ ] **Step 1: Update `<option>` in SnapshotsPage** (lines 165–173 in `src/pages/SnapshotsPage.tsx`):

```tsx
{wheels.map(w => (
  <option key={w.id} value={w.id} className={w.deleted_at ? 'text-red-400' : ''}>
    {w.deleted_at ? `${w.name} — Deleting in ~10 min` : w.name}
  </option>
))}
```

- [ ] **Step 2: Update `<option>` in TrendPage** (lines 126–129 in `src/pages/TrendPage.tsx`):

```tsx
{wheels.map(w => (
  <option key={w.id} value={w.id} className={w.deleted_at ? 'text-red-400' : ''}>
    {w.deleted_at ? `${w.name} — Deleting in ~10 min` : w.name}
  </option>
))}
```

- [ ] **Step 3: Run tests**

```bash
npm test
```

Expected: all tests pass (no new tests needed — the suffix is cosmetic and tested via existing wheel selector tests).

- [ ] **Step 4: Commit**

```bash
git add src/pages/SnapshotsPage.tsx src/pages/TrendPage.tsx
git commit -m "feat: show soft-deleted wheel suffix in SnapshotsPage and TrendPage selectors"
```

---

## Task 7: useSnapshots — deleteSnapshot

**Files:**
- Modify: `src/hooks/useSnapshots.ts`

The existing test file at `src/pages/SnapshotsPage.test.tsx` (not a dedicated hook test) covers the hook indirectly. A focused hook test isn't required given the simplicity of the DB call. We test deletion behaviour through the page tests in Task 8.

- [ ] **Step 1: Add `deleteSnapshot` to `UseSnapshotsResult` interface** (after `checkSnapshotsExist` line 20):

```ts
deleteSnapshot: (snapshotId: string) => Promise<void>
```

- [ ] **Step 2: Add `deleteSnapshot` implementation** (after `checkSnapshotsExist` function, before the return):

```ts
async function deleteSnapshot(snapshotId: string): Promise<void> {
  await supabase
    .from('snapshots')
    .delete()
    .eq('id', snapshotId)
  // Cascade on FK handles snapshot_scores automatically
}
```

- [ ] **Step 3: Add to the return object**:

```ts
return { saveSnapshot, listSnapshots, fetchSnapshotScores, checkSnapshotsExist, deleteSnapshot }
```

- [ ] **Step 4: Run tests**

```bash
npm test
```

Expected: all tests pass (no existing test references `deleteSnapshot` yet, so nothing breaks).

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useSnapshots.ts
git commit -m "feat: add deleteSnapshot to useSnapshots hook"
```

---

## Task 8: SnapshotsPage — delete snapshot UI

**Files:**
- Modify: `src/pages/SnapshotsPage.tsx`
- Modify: `src/pages/SnapshotsPage.test.tsx`

- [ ] **Step 1: Write failing tests** in `src/pages/SnapshotsPage.test.tsx`

**1a. Add mock variable and AlertDialog mock** near the top:

```ts
const mockDeleteSnapshot = vi.hoisted(() => vi.fn())
```

Update the `useSnapshots` mock to include it:

```ts
vi.mock('@/hooks/useSnapshots', () => ({
  useSnapshots: vi.fn(() => ({
    listSnapshots: mockListSnapshots,
    saveSnapshot: mockSaveSnapshot,
    fetchSnapshotScores: mockFetchSnapshotScores,
    checkSnapshotsExist: mockCheckSnapshotsExist,
    deleteSnapshot: mockDeleteSnapshot,
  })),
}))
```

Add the same AlertDialog mock used in WheelPage.test.tsx:

```ts
vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  AlertDialogContent: ({ children }: { children: React.ReactNode }) => <div data-testid="alert-dialog-content">{children}</div>,
  AlertDialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogAction: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button data-testid="alert-dialog-action" onClick={onClick}>{children}</button>
  ),
  AlertDialogCancel: ({ children }: { children: React.ReactNode }) => (
    <button data-testid="alert-dialog-cancel">{children}</button>
  ),
}))
```

**1b. Add test cases:**

```ts
describe('delete snapshot', () => {
  const snap: SnapshotRow = { id: 'snap-1', wheel_id: 'wheel-1', user_id: 'user-1', name: 'Q1 2026', saved_at: '2026-01-01T00:00:00Z' }

  beforeEach(() => {
    mockListSnapshots.mockResolvedValue([snap])
    mockFetchSnapshotScores.mockResolvedValue([])
    mockDeleteSnapshot.mockResolvedValue(undefined)
  })

  it('renders a delete button for each snapshot', async () => {
    render(<MemoryRouter><SnapshotsPage /></MemoryRouter>)
    await waitFor(() => expect(screen.getByText('Q1 2026')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /delete snapshot/i })).toBeInTheDocument()
  })

  it('calls deleteSnapshot and removes snapshot from list on confirmation', async () => {
    render(<MemoryRouter><SnapshotsPage /></MemoryRouter>)
    await waitFor(() => expect(screen.getByText('Q1 2026')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /delete snapshot/i }))
    fireEvent.click(screen.getByTestId('alert-dialog-action'))

    await waitFor(() => {
      expect(mockDeleteSnapshot).toHaveBeenCalledWith('snap-1')
      expect(screen.queryByText('Q1 2026')).not.toBeInTheDocument()
    })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/pages/SnapshotsPage.test.tsx
```

Expected: FAIL — delete button not found.

- [ ] **Step 3: Implement SnapshotsPage changes in `src/pages/SnapshotsPage.tsx`**

**3a. Add imports:**

```ts
import { Trash2 } from 'lucide-react'
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogFooter, AlertDialogTitle, AlertDialogDescription,
  AlertDialogAction, AlertDialogCancel,
} from '@/components/ui/alert-dialog'
```

**3b. Destructure `deleteSnapshot`** from `useSnapshots()`:

```ts
const { listSnapshots, saveSnapshot, fetchSnapshotScores, deleteSnapshot } = useSnapshots()
```

**3c. Add `handleDeleteSnapshot` handler** (after `handleSaveSnapshot`):

```ts
async function handleDeleteSnapshot(snapshotId: string) {
  await deleteSnapshot(snapshotId)
  setSnapshots(prev => prev.filter(s => s.id !== snapshotId))
  setScoresCache(prev => { const next = { ...prev }; delete next[snapshotId]; return next })
  setAllHistoryScores(prev => prev.filter(s => s.snapshot_id !== snapshotId))
  setSelectedSnapIds(prev => { const next = new Set(prev); next.delete(snapshotId); return next })
}
```

**3d. Update the snapshot row** (lines 205–225) — add the trash icon and AlertDialog at the end of each row, inside the `<label>` wrapper. Replace the `<label>` block with:

```tsx
<div key={snap.id} className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50">
  <input
    type="checkbox"
    checked={isChecked}
    disabled={isDisabled}
    onChange={() => toggleSnapshot(snap.id)}
    className="w-4 h-4 rounded border-stone-300 text-stone-800 focus:ring-stone-500"
  />
  <span className="flex-1 text-stone-800 font-medium">{snap.name}</span>
  <span className="text-stone-400 text-sm">{formatDate(snap.saved_at)}</span>
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <button
        aria-label="Delete snapshot"
        className="p-1 text-stone-300 hover:text-red-500 rounded"
        onClick={e => e.stopPropagation()}
      >
        <Trash2 size={14} />
      </button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Delete &ldquo;{snap.name}&rdquo;?</AlertDialogTitle>
        <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction
          className="bg-red-600 hover:bg-red-700 text-white"
          onClick={() => void handleDeleteSnapshot(snap.id)}
        >
          Delete snapshot
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</div>
```

Note: the wrapping `<label>` is replaced with `<div>` since a `<label>` shouldn't contain interactive buttons other than the checkbox it labels.

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/pages/SnapshotsPage.test.tsx
```

Expected: all tests pass.

- [ ] **Step 5: Run full suite**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/pages/SnapshotsPage.tsx src/pages/SnapshotsPage.test.tsx src/hooks/useSnapshots.ts
git commit -m "feat: delete snapshot with confirmation and batched state update"
```

---

## Task 9: AppShell — authenticated footer

**Files:**
- Modify: `src/components/AppShell.tsx`

- [ ] **Step 1: Update `AppShell.tsx`**

Add `Link` import:

```ts
import { Outlet } from 'react-router'
import { Link } from 'react-router'
```

Replace the current JSX layout:

```tsx
// Before:
<div className="flex h-screen overflow-hidden bg-surface">
  <Sidebar />
  <main className="flex-1 overflow-y-auto">
    <Outlet />
  </main>
</div>

// After:
<div className="flex h-screen overflow-hidden bg-surface">
  <Sidebar />
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
</div>
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/AppShell.tsx
git commit -m "feat: add pinned footer with Terms and Privacy links to authenticated layout"
```

---

## Task 10: WheelChart — fix hover highlight

**Files:**
- Modify: `src/components/WheelChart.tsx`

- [ ] **Step 1: Remove `key` prop from `<RadarChart>`** (line 71)

```tsx
// Before:
<RadarChart key={highlightedCategory ?? ''} data={extendedData} cx="50%" cy="50%" outerRadius="70%">

// After:
<RadarChart data={extendedData} cx="50%" cy="50%" outerRadius="70%">
```

- [ ] **Step 2: Run tests**

```bash
npx vitest run src/components/WheelChart.test.tsx
```

Expected: all tests pass. (The test at line 92 verifies the Highlighted Radar always renders — this should still hold.)

- [ ] **Step 3: Run full suite**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/WheelChart.tsx
git commit -m "fix: remove RadarChart key prop to fix hover highlight re-render"
```

---

## Task 11: Close todos + UAT checkpoint

**Files:**
- Move: `.planning/todos/pending/2026-03-15-rename-wheel-name.md` → `.planning/todos/done/`
- Move: `.planning/todos/pending/2026-03-15-add-wheel-selector-to-trendpage.md` → `.planning/todos/done/`
- Move: `.planning/todos/pending/2026-03-16-polish-02-hover-highlight-not-working.md` → `.planning/todos/done/`
- Move: `.planning/todos/pending/2026-03-19-delete-wheel-and-snapshot.md` → `.planning/todos/done/`
- Move: `.planning/todos/pending/2026-03-19-footer-in-logged-in-views.md` → `.planning/todos/done/`

- [ ] **Step 1: Close confirmed-already-built todos**

```bash
mv ".planning/todos/pending/2026-03-15-rename-wheel-name.md" ".planning/todos/done/"
mv ".planning/todos/pending/2026-03-15-add-wheel-selector-to-trendpage.md" ".planning/todos/done/"
```

- [ ] **Step 2: Start Supabase and the dev server for browser testing**

```bash
npx supabase start
npm run dev
```

- [ ] **Step 3: UAT — soft-delete wheel**

Sign in as the free-tier dev user. Verify:
- [ ] Trash icon appears in WheelPage header
- [ ] Clicking trash opens dialog with "Schedule deletion" button
- [ ] After confirming: wheel shows "— Deleting in ~10 min" in selector, undo banner appears
- [ ] Clicking Undo: banner disappears, wheel returns to normal in selector
- [ ] With premium user (multiple wheels): after deleting current wheel, auto-selects the previous one
- [ ] With only one wheel: empty state shows "Recover a wheel" section with Undo button

- [ ] **Step 4: UAT — delete snapshot**

Navigate to Snapshots page. Verify:
- [ ] Trash icon appears on each snapshot row
- [ ] Clicking trash opens dialog with "Delete snapshot" button
- [ ] After confirming: snapshot disappears from list, comparison, and score history
- [ ] If deleted snapshot was selected in comparison, it is deselected

- [ ] **Step 5: UAT — footer**

Navigate to WheelPage, SnapshotsPage, TrendPage. Verify:
- [ ] Footer with "Terms · Privacy" is pinned at the bottom of every page
- [ ] Footer does not scroll with the page content
- [ ] Terms and Privacy links navigate correctly

- [ ] **Step 6: UAT — hover highlight**

On WheelPage with action items that have deadlines within 7 days (DueSoonWidget visible). Verify:
- [ ] Hovering over a due-soon item highlights the corresponding category axis in the wheel chart (amber fill overlay)
- [ ] Moving mouse off clears the highlight

**If highlight still does not appear:** follow the fallback in the spec — add `console.log('highlight:', highlightedCategory, extendedData)` in WheelChart, verify values, then apply `key` to only the Highlighted `<Radar>` if values are correct but SVG doesn't update.

- [ ] **Step 7: Close implementation todos and commit**

```bash
mv ".planning/todos/pending/2026-03-16-polish-02-hover-highlight-not-working.md" ".planning/todos/done/"
mv ".planning/todos/pending/2026-03-19-delete-wheel-and-snapshot.md" ".planning/todos/done/"
mv ".planning/todos/pending/2026-03-19-footer-in-logged-in-views.md" ".planning/todos/done/"
git add .planning/todos/
git commit -m "docs: close completed todos for phase 10"
```

- [ ] **Step 8: Final test run**

```bash
npm test && npm run build
```

Expected: all tests pass, build succeeds with no TypeScript errors.
