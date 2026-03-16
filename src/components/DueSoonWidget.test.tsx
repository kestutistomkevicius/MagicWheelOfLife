import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { getDueSoonItems, DueSoonWidget } from './DueSoonWidget'
import type { ActionItemRow, CategoryRow } from '@/types/database'
import React from 'react'

// Mock Radix Dialog — render children directly so mini modal content is testable
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="mini-modal">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeCategory(id: string, name: string): CategoryRow {
  return { id, wheel_id: 'w1', user_id: 'u1', name, position: 0, score_asis: 5, score_tobe: 5, is_important: false, created_at: '', updated_at: '' }
}

function makeItem(id: string, categoryId: string, opts: Partial<ActionItemRow> = {}): ActionItemRow {
  return {
    id,
    category_id: categoryId,
    user_id: 'u1',
    text: `Task ${id}`,
    is_complete: false,
    deadline: null,
    completed_at: null,
    note: null,
    position: 0,
    created_at: '',
    updated_at: '',
    ...opts,
  }
}

/** Returns an ISO date string N days from today */
function daysFromNow(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

// ── getDueSoonItems ─────────────────────────────────────────────────────────────

describe('getDueSoonItems', () => {
  it('returns items with deadline within 7 days (not completed)', () => {
    const cat = makeCategory('cat-1', 'Health')
    const item = makeItem('i1', 'cat-1', { deadline: daysFromNow(3) })
    const result = getDueSoonItems({ 'cat-1': [item] }, [cat])
    expect(result).toHaveLength(1)
    expect(result[0].categoryName).toBe('Health')
    expect(result[0].daysRemaining).toBe(3)
  })

  it('excludes completed items even if deadline is within 7 days', () => {
    const cat = makeCategory('cat-1', 'Health')
    const item = makeItem('i1', 'cat-1', { deadline: daysFromNow(2), is_complete: true })
    const result = getDueSoonItems({ 'cat-1': [item] }, [cat])
    expect(result).toHaveLength(0)
  })

  it('excludes items with deadline more than 7 days away', () => {
    const cat = makeCategory('cat-1', 'Health')
    const item = makeItem('i1', 'cat-1', { deadline: daysFromNow(8) })
    const result = getDueSoonItems({ 'cat-1': [item] }, [cat])
    expect(result).toHaveLength(0)
  })

  it('includes item due today (daysRemaining = 0)', () => {
    const cat = makeCategory('cat-1', 'Health')
    const item = makeItem('i1', 'cat-1', { deadline: daysFromNow(0) })
    const result = getDueSoonItems({ 'cat-1': [item] }, [cat])
    expect(result).toHaveLength(1)
    expect(result[0].daysRemaining).toBe(0)
  })

  it('returns items sorted by daysRemaining ascending', () => {
    const cat = makeCategory('cat-1', 'Health')
    const i1 = makeItem('i1', 'cat-1', { deadline: daysFromNow(5) })
    const i2 = makeItem('i2', 'cat-1', { deadline: daysFromNow(1) })
    const i3 = makeItem('i3', 'cat-1', { deadline: daysFromNow(3) })
    const result = getDueSoonItems({ 'cat-1': [i1, i2, i3] }, [cat])
    expect(result.map(r => r.daysRemaining)).toEqual([1, 3, 5])
  })

  it('excludes items with no deadline', () => {
    const cat = makeCategory('cat-1', 'Health')
    const item = makeItem('i1', 'cat-1', { deadline: null })
    const result = getDueSoonItems({ 'cat-1': [item] }, [cat])
    expect(result).toHaveLength(0)
  })
})

// ── DueSoonWidget ──────────────────────────────────────────────────────────────

describe('DueSoonWidget', () => {
  const onHighlight = vi.fn()
  const onMarkComplete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  function makeDueSoonItem(daysRemaining = 3) {
    return {
      categoryName: 'Health',
      item: makeItem('i1', 'cat-1', { deadline: daysFromNow(daysRemaining), text: 'Go for a run' }),
      daysRemaining,
    }
  }

  it('renders nothing when items array is empty', () => {
    const { container } = render(
      <DueSoonWidget items={[]} highlightedCategory={null} onHighlight={onHighlight} onMarkComplete={onMarkComplete} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders category name, task text, and days remaining', () => {
    render(
      <DueSoonWidget items={[makeDueSoonItem(3)]} highlightedCategory={null} onHighlight={onHighlight} onMarkComplete={onMarkComplete} />
    )
    expect(screen.getByText('Health')).toBeInTheDocument()
    expect(screen.getByText(/Go for a run/)).toBeInTheDocument()
    expect(screen.getByText('3 days')).toBeInTheDocument()
  })

  it('shows "Today" when daysRemaining is 0', () => {
    render(
      <DueSoonWidget items={[makeDueSoonItem(0)]} highlightedCategory={null} onHighlight={onHighlight} onMarkComplete={onMarkComplete} />
    )
    expect(screen.getByText('Today')).toBeInTheDocument()
  })

  it('calls onHighlight with categoryName on mouseenter', () => {
    render(
      <DueSoonWidget items={[makeDueSoonItem()]} highlightedCategory={null} onHighlight={onHighlight} onMarkComplete={onMarkComplete} />
    )
    const item = screen.getByText(/Go for a run/).closest('li')!
    fireEvent.mouseEnter(item)
    expect(onHighlight).toHaveBeenCalledWith('Health')
  })

  it('calls onHighlight with null on mouseleave', () => {
    render(
      <DueSoonWidget items={[makeDueSoonItem()]} highlightedCategory={null} onHighlight={onHighlight} onMarkComplete={onMarkComplete} />
    )
    const item = screen.getByText(/Go for a run/).closest('li')!
    fireEvent.mouseLeave(item)
    expect(onHighlight).toHaveBeenCalledWith(null)
  })

  it('opens mini modal with full text and Mark complete button on click', () => {
    render(
      <DueSoonWidget items={[makeDueSoonItem()]} highlightedCategory={null} onHighlight={onHighlight} onMarkComplete={onMarkComplete} />
    )
    const item = screen.getByText(/Go for a run/).closest('li')!
    fireEvent.click(item)
    expect(screen.getByTestId('mini-modal')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /mark complete/i })).toBeInTheDocument()
  })

  it('clicking Mark complete calls onMarkComplete with item id', () => {
    render(
      <DueSoonWidget items={[makeDueSoonItem()]} highlightedCategory={null} onHighlight={onHighlight} onMarkComplete={onMarkComplete} />
    )
    fireEvent.click(screen.getByText(/Go for a run/).closest('li')!)
    fireEvent.click(screen.getByRole('button', { name: /mark complete/i }))
    expect(onMarkComplete).toHaveBeenCalledWith('i1')
  })
})
