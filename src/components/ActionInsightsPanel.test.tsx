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
