# ActionInsightsPanel Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the stacked improvement cards + bulleted lists in `ActionInsightsPanel` with a single headline-only improvement card (most recent interval only) and a unified action items table.

**Architecture:** Two files change — the component and its test file. The component is rewritten in-place: improvement card renders only `improvementActions[0]` as a headline, and all action items are rendered in a `<table>` with Task / Due / Completed / Status columns. Tests are updated to assert against table structure and the new card behaviour.

**Tech Stack:** React, TypeScript, Tailwind CSS, Vitest + Testing Library

**Spec:** `docs/superpowers/specs/2026-03-25-action-insights-panel-redesign.md`

---

## File Map

| File | Change |
|------|--------|
| `src/components/ActionInsightsPanel.tsx` | Rewrite component (same props interface) |
| `src/components/ActionInsightsPanel.test.tsx` | Update all tests to match new rendering |

---

### Task 1: Rewrite ActionInsightsPanel component

**Files:**
- Modify: `src/components/ActionInsightsPanel.tsx`

- [ ] **Step 1: Read the current component**

  Open `src/components/ActionInsightsPanel.tsx` and confirm the existing props interface:
  ```ts
  interface ActionInsightsPanelProps {
    improvementActions: ImprovementInterval[]
    allItems: ActionItemRow[]
  }
  ```
  The interface does **not** change.

- [ ] **Step 2: Replace the component implementation**

  Overwrite `src/components/ActionInsightsPanel.tsx` with:

  ```tsx
  import type { ActionItemRow } from '@/types/database'

  interface ImprovementInterval {
    fromLabel: string
    toLabel: string
    scoreDelta: number
    items: ActionItemRow[]
  }

  interface ActionInsightsPanelProps {
    improvementActions: ImprovementInterval[]
    allItems: ActionItemRow[]
  }

  export function ActionInsightsPanel({ improvementActions, allItems }: ActionInsightsPanelProps) {
    const latestImprovement = improvementActions.length > 0 ? improvementActions[0] : null
    const activeItems = allItems.filter(item => !item.is_complete)
    const completedItems = allItems.filter(item => item.is_complete)

    if (!latestImprovement && allItems.length === 0) return null

    return (
      <div className="space-y-4">
        {latestImprovement && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <p className="text-sm font-medium text-green-800">
              Between {latestImprovement.fromLabel} and {latestImprovement.toLabel} your score improved by +{latestImprovement.scoreDelta}
            </p>
          </div>
        )}

        {allItems.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-2">Action items</p>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-stone-200">
                  <th className="text-left py-1.5 px-2 text-xs font-medium uppercase tracking-wide text-stone-400">Task</th>
                  <th className="text-left py-1.5 px-2 text-xs font-medium uppercase tracking-wide text-stone-400">Due</th>
                  <th className="text-left py-1.5 px-2 text-xs font-medium uppercase tracking-wide text-stone-400">Completed</th>
                  <th className="text-left py-1.5 px-2 text-xs font-medium uppercase tracking-wide text-stone-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {activeItems.map(item => (
                  <tr key={item.id} className="border-b border-stone-100">
                    <td className="py-1.5 px-2 text-stone-800">{item.text}</td>
                    <td className="py-1.5 px-2 text-stone-500">{item.deadline ?? '—'}</td>
                    <td className="py-1.5 px-2 text-stone-400">—</td>
                    <td className="py-1.5 px-2">
                      <span className="rounded px-1.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-800">Active</span>
                    </td>
                  </tr>
                ))}
                {completedItems.map(item => (
                  <tr key={item.id} className="border-b border-stone-100 opacity-60">
                    <td className="py-1.5 px-2 text-stone-500 line-through">{item.text}</td>
                    <td className="py-1.5 px-2 text-stone-400">{item.deadline ?? '—'}</td>
                    <td className="py-1.5 px-2 text-stone-500">{item.completed_at ? item.completed_at.slice(0, 10) : '—'}</td>
                    <td className="py-1.5 px-2">
                      <span className="rounded px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">Done</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }
  ```

- [ ] **Step 3: Verify TypeScript compiles**

  ```bash
  npx tsc --noEmit
  ```
  Expected: no errors.

- [ ] **Step 4: Commit**

  ```bash
  git add src/components/ActionInsightsPanel.tsx
  git commit -m "feat: redesign ActionInsightsPanel — single win card + action items table"
  ```

---

### Task 2: Update tests

**Files:**
- Modify: `src/components/ActionInsightsPanel.test.tsx`

The existing tests assert against the old `<ul>/<li>` structure. They need to be updated to assert against the new `<table>` structure and the simplified improvement card.

- [ ] **Step 1: Run existing tests to see which ones fail**

  ```bash
  npx vitest run src/components/ActionInsightsPanel.test.tsx
  ```
  Expected: several failures — tests that check for `<li>`, strikethrough on `<li>`, item text inside the improvement card.

- [ ] **Step 2: Rewrite the test file**

  Overwrite `src/components/ActionInsightsPanel.test.tsx` with:

  ```tsx
  import { describe, it, expect } from 'vitest'
  import { render, screen } from '@testing-library/react'
  import { ActionInsightsPanel } from '@/components/ActionInsightsPanel'
  import type { ActionItemRow } from '@/types/database'

  function makeItem(
    id: string,
    text: string,
    isComplete: boolean,
    opts: { completedAt?: string; deadline?: string } = {},
  ): ActionItemRow {
    return {
      id,
      category_id: 'cat-1',
      user_id: 'u1',
      text,
      is_complete: isComplete,
      deadline: opts.deadline ?? null,
      completed_at: opts.completedAt ?? null,
      note: null,
      position: 0,
      created_at: '',
      updated_at: '',
    }
  }

  describe('ActionInsightsPanel', () => {
    it('renders nothing when no data', () => {
      const { container } = render(
        <ActionInsightsPanel improvementActions={[]} allItems={[]} />
      )
      expect(container.firstChild).toBeNull()
    })

    it('renders improvement card with headline only (no item list inside card)', () => {
      const items = [makeItem('i1', 'Go for a run', true, { completedAt: '2026-01-15T00:00:00Z' })]
      const improvementActions = [
        { fromLabel: '01 Jan 2026', toLabel: '01 Feb 2026', scoreDelta: 3, items },
      ]
      render(<ActionInsightsPanel improvementActions={improvementActions} allItems={[]} />)
      expect(screen.getByText(/01 Jan 2026/)).toBeInTheDocument()
      expect(screen.getByText(/01 Feb 2026/)).toBeInTheDocument()
      expect(screen.getByText(/\+3/)).toBeInTheDocument()
      // Item text must NOT appear inside the card (no inline list)
      expect(screen.queryByText('Go for a run')).toBeNull()
    })

    it('shows only the most recent improvement card when multiple intervals exist', () => {
      const improvementActions = [
        { fromLabel: 'Jan', toLabel: 'Feb', scoreDelta: 2, items: [] },
        { fromLabel: 'Nov', toLabel: 'Dec', scoreDelta: 1, items: [] },
      ]
      render(<ActionInsightsPanel improvementActions={improvementActions} allItems={[]} />)
      expect(screen.getByText(/Jan/)).toBeInTheDocument()
      expect(screen.queryByText(/Nov/)).toBeNull()
    })

    it('renders action items table with correct columns', () => {
      const allItems = [makeItem('i1', 'Active task', false)]
      render(<ActionInsightsPanel improvementActions={[]} allItems={allItems} />)
      expect(screen.getByRole('table')).toBeInTheDocument()
      expect(screen.getByText('Task')).toBeInTheDocument()
      expect(screen.getByText('Due')).toBeInTheDocument()
      expect(screen.getByText('Completed')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
    })

    it('renders active item row with Active badge and no strikethrough', () => {
      const allItems = [makeItem('i1', 'Morning run', false)]
      render(<ActionInsightsPanel improvementActions={[]} allItems={allItems} />)
      expect(screen.getByText('Morning run')).toBeInTheDocument()
      expect(screen.getByText('Active')).toBeInTheDocument()
      const taskCell = screen.getByText('Morning run')
      expect(taskCell.className).not.toContain('line-through')
    })

    it('renders active item deadline when set', () => {
      const allItems = [makeItem('i1', 'Morning run', false, { deadline: '2026-04-01' })]
      render(<ActionInsightsPanel improvementActions={[]} allItems={allItems} />)
      expect(screen.getByText('2026-04-01')).toBeInTheDocument()
    })

    it('renders completed item row with Done badge and strikethrough', () => {
      const allItems = [makeItem('i2', 'Done task', true, { completedAt: '2026-02-10T08:00:00Z' })]
      render(<ActionInsightsPanel improvementActions={[]} allItems={allItems} />)
      expect(screen.getByText('Done task')).toBeInTheDocument()
      expect(screen.getByText('Done')).toBeInTheDocument()
      const taskCell = screen.getByText('Done task')
      expect(taskCell.className).toContain('line-through')
    })

    it('renders completed_at as YYYY-MM-DD date portion', () => {
      const allItems = [makeItem('i2', 'Done task', true, { completedAt: '2026-02-10T08:30:00Z' })]
      render(<ActionInsightsPanel improvementActions={[]} allItems={allItems} />)
      expect(screen.getByText('2026-02-10')).toBeInTheDocument()
    })

    it('renders — for null deadline and null completed_at', () => {
      const allItems = [
        makeItem('i1', 'Active no deadline', false),
        makeItem('i2', 'Done no date', true),
      ]
      render(<ActionInsightsPanel improvementActions={[]} allItems={allItems} />)
      // Multiple — cells are expected; just confirm at least one exists
      const dashes = screen.getAllByText('—')
      expect(dashes.length).toBeGreaterThan(0)
    })

    it('renders active items before completed items', () => {
      const allItems = [
        makeItem('i1', 'Done first in array', true, { completedAt: '2026-01-01T00:00:00Z' }),
        makeItem('i2', 'Active second in array', false),
      ]
      render(<ActionInsightsPanel improvementActions={[]} allItems={allItems} />)
      const rows = screen.getAllByRole('row')
      // rows[0] = header, rows[1] = first data row (should be active), rows[2] = completed
      expect(rows[1].textContent).toContain('Active second in array')
      expect(rows[2].textContent).toContain('Done first in array')
    })

    it('renders card and table together when both exist', () => {
      const improvementActions = [
        { fromLabel: 'Jan', toLabel: 'Feb', scoreDelta: 1, items: [] },
      ]
      const allItems = [makeItem('i1', 'Some task', false)]
      render(<ActionInsightsPanel improvementActions={improvementActions} allItems={allItems} />)
      expect(screen.getByText(/Jan/)).toBeInTheDocument()
      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    it('renders card without table when allItems is empty', () => {
      const improvementActions = [
        { fromLabel: 'Jan', toLabel: 'Feb', scoreDelta: 1, items: [] },
      ]
      render(<ActionInsightsPanel improvementActions={improvementActions} allItems={[]} />)
      expect(screen.getByText(/Jan/)).toBeInTheDocument()
      expect(screen.queryByRole('table')).toBeNull()
    })
  })
  ```

- [ ] **Step 3: Run the updated tests**

  ```bash
  npx vitest run src/components/ActionInsightsPanel.test.tsx
  ```
  Expected: all tests pass.

- [ ] **Step 4: Run the full test suite to check for regressions**

  ```bash
  npx vitest run
  ```
  Expected: all 343+ tests pass, 0 failures.

- [ ] **Step 5: Commit**

  ```bash
  git add src/components/ActionInsightsPanel.test.tsx
  git commit -m "test: update ActionInsightsPanel tests for table redesign"
  ```
