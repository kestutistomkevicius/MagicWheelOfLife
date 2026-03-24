import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ActionInsightsPanel } from '@/components/ActionInsightsPanel'
import type { ActionItemRow } from '@/types/database'

function makeItem(
  id: string,
  text: string,
  isComplete: boolean,
  completedAt: string | null = null,
): ActionItemRow {
  return {
    id,
    category_id: 'cat-1',
    user_id: 'u1',
    text,
    is_complete: isComplete,
    deadline: null,
    completed_at: completedAt,
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

  it('renders improvement interval card', () => {
    const improvementActions = [
      {
        fromLabel: '01 Jan 2026',
        toLabel: '01 Feb 2026',
        scoreDelta: 3,
        items: [makeItem('i1', 'Go for a run', true, '2026-01-15T00:00:00Z')],
      },
    ]
    render(<ActionInsightsPanel improvementActions={improvementActions} allItems={[]} />)
    expect(screen.getByText(/01 Jan 2026/i)).toBeInTheDocument()
    expect(screen.getByText(/01 Feb 2026/i)).toBeInTheDocument()
    expect(screen.getByText('Go for a run')).toBeInTheDocument()
  })

  it('renders +{scoreDelta} in improvement card', () => {
    const improvementActions = [
      {
        fromLabel: '01 Jan 2026',
        toLabel: '01 Feb 2026',
        scoreDelta: 3,
        items: [makeItem('i1', 'Go for a run', true, '2026-01-15T00:00:00Z')],
      },
    ]
    render(<ActionInsightsPanel improvementActions={improvementActions} allItems={[]} />)
    expect(screen.getByText(/\+3/)).toBeInTheDocument()
  })

  it('renders active items section', () => {
    const allItems = [makeItem('i1', 'Active task', false)]
    render(<ActionInsightsPanel improvementActions={[]} allItems={allItems} />)
    const el = screen.getByText('Active task')
    expect(el).toBeInTheDocument()
    expect(el.className).not.toContain('line-through')
  })

  it('renders completed items with strikethrough style', () => {
    const allItems = [makeItem('i2', 'Done task', true, '2026-01-10T00:00:00Z')]
    render(<ActionInsightsPanel improvementActions={[]} allItems={allItems} />)
    const el = screen.getByText('Done task')
    expect(el).toBeInTheDocument()
    // The <li> element containing the text should have line-through class
    const li = el.closest('li')
    expect(li?.className).toContain('line-through')
  })

  it('renders both active and completed sections when mixed', () => {
    const allItems = [
      makeItem('i1', 'Active task', false),
      makeItem('i2', 'Done task', true, '2026-01-10T00:00:00Z'),
    ]
    render(<ActionInsightsPanel improvementActions={[]} allItems={allItems} />)
    expect(screen.getByText('Active task')).toBeInTheDocument()
    expect(screen.getByText('Done task')).toBeInTheDocument()
  })
})
