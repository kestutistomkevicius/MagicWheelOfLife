// src/components/ActionItemList.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { ActionItemList } from './ActionItemList'
import type { ActionItemRow } from '@/types/database'

// Mock shadcn Checkbox as a native checkbox for jsdom compatibility
vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({
    id,
    checked,
    onCheckedChange,
    'aria-label': ariaLabel,
  }: {
    id: string
    checked: boolean
    onCheckedChange: (v: boolean) => void
    'aria-label'?: string
  }) => (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      aria-label={ariaLabel}
      onChange={(e) => onCheckedChange(e.target.checked)}
    />
  ),
}))

// Mock shadcn Dialog using the Radix mock pattern from SnapshotNameDialog.test.tsx
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children, onOpenChange }: { open: boolean; children: React.ReactNode; onOpenChange?: (open: boolean) => void }) =>
    open ? <div data-testid="dialog" onClick={(e) => { if ((e.target as HTMLElement).dataset.closeDialog) onOpenChange?.(false) }}>{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-header">{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h2 data-testid="dialog-title">{children}</h2>
  ),
  DialogFooter: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-footer">{children}</div>
  ),
}))

// Mock useActionItems hook
const mockAddActionItem = vi.fn()
const mockToggleActionItem = vi.fn().mockResolvedValue(undefined)
const mockSetDeadline = vi.fn().mockResolvedValue(undefined)
const mockDeleteActionItem = vi.fn().mockResolvedValue(undefined)
const mockLoadActionItems = vi.fn().mockResolvedValue([])
const mockSaveCompletionNote = vi.fn().mockResolvedValue(undefined)
const mockReopenActionItem = vi.fn().mockResolvedValue(undefined)

vi.mock('@/hooks/useActionItems', () => ({
  useActionItems: () => ({
    loadActionItems: mockLoadActionItems,
    addActionItem: mockAddActionItem,
    toggleActionItem: mockToggleActionItem,
    setDeadline: mockSetDeadline,
    deleteActionItem: mockDeleteActionItem,
    saveCompletionNote: mockSaveCompletionNote,
    reopenActionItem: mockReopenActionItem,
  }),
}))

function makeItem(overrides: Partial<ActionItemRow> = {}): ActionItemRow {
  return {
    id: 'item-1',
    category_id: 'cat-1',
    user_id: 'user-1',
    text: 'Test item',
    is_complete: false,
    deadline: null,
    completed_at: null,
    note: null,
    position: 0,
    created_at: '2026-03-15T00:00:00Z',
    updated_at: '2026-03-15T00:00:00Z',
    ...overrides,
  }
}

function makeItems(count: number): ActionItemRow[] {
  return Array.from({ length: count }, (_, i) =>
    makeItem({ id: `item-${i + 1}`, text: `Item ${i + 1}`, position: i })
  )
}

const defaultProps = {
  categoryId: 'cat-1',
  userId: 'user-1',
  items: [] as ActionItemRow[],
  onItemsChange: vi.fn(),
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.useRealTimers()
})

describe('ActionItemList', () => {
  describe('ACTION-01: add item', () => {
    it('renders "+ Add action item" button when item count < 7', () => {
      render(<ActionItemList {...defaultProps} items={makeItems(6)} />)
      expect(screen.getByRole('button', { name: /add action item/i })).toBeInTheDocument()
    })

    it('does NOT render add button when item count = 7', () => {
      render(<ActionItemList {...defaultProps} items={makeItems(7)} />)
      expect(screen.queryByRole('button', { name: /add action item/i })).toBeNull()
    })

    it('adds item to list after pressing Enter in input', async () => {
      const newItem = makeItem({ id: 'item-new', text: 'My new task' })
      mockAddActionItem.mockResolvedValue(newItem)
      const onItemsChange = vi.fn()

      render(<ActionItemList {...defaultProps} onItemsChange={onItemsChange} />)

      fireEvent.click(screen.getByRole('button', { name: /add action item/i }))
      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: 'My new task' } })
      fireEvent.keyDown(input, { key: 'Enter' })

      await waitFor(() => {
        expect(mockAddActionItem).toHaveBeenCalledWith({
          categoryId: 'cat-1',
          userId: 'user-1',
          text: 'My new task',
          currentCount: 0,
        })
      })
      expect(onItemsChange).toHaveBeenCalledWith([newItem])
    })
  })

  describe('ACTION-02: deadline', () => {
    it('renders date input for each item', () => {
      render(<ActionItemList {...defaultProps} items={[makeItem()]} />)
      expect(screen.getByDisplayValue('')).toBeInTheDocument()
    })

    it('shows empty date input when deadline is null', () => {
      render(<ActionItemList {...defaultProps} items={[makeItem({ deadline: null })]} />)
      const dateInputs = Array.from(document.querySelectorAll('input[type="date"]'))
      expect(dateInputs).toHaveLength(1)
      expect((dateInputs[0] as HTMLInputElement).value).toBe('')
    })

    it('shows ISO date value when deadline is set', () => {
      render(<ActionItemList {...defaultProps} items={[makeItem({ deadline: '2026-04-30' })]} />)
      const dateInputs = Array.from(document.querySelectorAll('input[type="date"]'))
      expect(dateInputs).toHaveLength(1)
      expect((dateInputs[0] as HTMLInputElement).value).toBe('2026-04-30')
    })
  })

  describe('ACTION-03: complete toggle', () => {
    it('completed item appears in completed table (not active list)', () => {
      const completedItem = makeItem({ is_complete: true, completed_at: '2026-03-15T00:00:00Z' })
      render(<ActionItemList {...defaultProps} items={[completedItem]} />)
      // No checkbox in active list (completed items go to the table section)
      expect(screen.queryByRole('checkbox')).toBeNull()
      // "1 completed" toggle button should appear
      expect(screen.getByRole('button', { name: /1 completed/i })).toBeInTheDocument()
    })

    it('completed item text has line-through when table is expanded', () => {
      const completedItem = makeItem({ is_complete: true, completed_at: '2026-03-15T00:00:00Z' })
      render(<ActionItemList {...defaultProps} items={[completedItem]} />)
      fireEvent.click(screen.getByRole('button', { name: /1 completed/i }))
      const cell = screen.getByText('Test item')
      expect(cell.className).toContain('line-through')
    })

    it('calls toggleActionItem when Checkbox is clicked on active item', async () => {
      vi.useFakeTimers()
      const onItemsChange = vi.fn()
      render(
        <ActionItemList
          {...defaultProps}
          items={[makeItem({ is_complete: false })]}
          onItemsChange={onItemsChange}
        />
      )
      await act(async () => {
        fireEvent.click(screen.getByRole('checkbox'))
      })
      expect(mockToggleActionItem).toHaveBeenCalledWith({ id: 'item-1', isComplete: true })
      act(() => { vi.advanceTimersByTime(800) })
      expect(onItemsChange).toHaveBeenCalled()
      vi.useRealTimers()
    })
  })

  describe('ACTION-04: delete', () => {
    it('removes item from list immediately on delete click (optimistic)', async () => {
      const item = makeItem()
      const onItemsChange = vi.fn()
      render(
        <ActionItemList
          {...defaultProps}
          items={[item]}
          onItemsChange={onItemsChange}
        />
      )
      fireEvent.click(screen.getByRole('button', { name: /delete/i }))
      expect(onItemsChange).toHaveBeenCalledWith([])
    })

    it('calls deleteActionItem with correct id', async () => {
      const item = makeItem({ id: 'item-99' })
      render(<ActionItemList {...defaultProps} items={[item]} />)
      fireEvent.click(screen.getByRole('button', { name: /delete/i }))
      await waitFor(() => {
        expect(mockDeleteActionItem).toHaveBeenCalledWith('item-99')
      })
    })
  })

  describe('POLISH-01: celebration animation', () => {
    it('applies animate-celebrate-row class when item is being celebrated', async () => {
      vi.useFakeTimers()
      const item = makeItem({ is_complete: false })
      const onItemsChange = vi.fn()
      render(
        <ActionItemList
          {...defaultProps}
          items={[item]}
          onItemsChange={onItemsChange}
        />
      )
      const checkbox = screen.getByRole('checkbox')
      fireEvent.click(checkbox)
      // After click, celebrating state is set — row should have the animation class
      const row = checkbox.closest('[class*="animate-celebrate-row"]') ??
                  screen.getByText('Test item').closest('[class*="animate-celebrate-row"]')
      expect(row).toBeTruthy()

      // After 800ms, celebrating state is cleared
      act(() => {
        vi.advanceTimersByTime(800)
      })
      const rowAfter = screen.getByText('Test item').closest('[class*="animate-celebrate-row"]')
      expect(rowAfter).toBeNull()
      vi.useRealTimers()
    })
  })

  describe('POLISH-08: completion modal', () => {
    it('opens completion modal after checking an incomplete item', async () => {
      const item = makeItem({ is_complete: false })
      const onItemsChange = vi.fn()
      render(
        <ActionItemList
          {...defaultProps}
          items={[item]}
          onItemsChange={onItemsChange}
        />
      )
      fireEvent.click(screen.getByRole('checkbox'))
      await waitFor(() => {
        expect(screen.getByTestId('dialog')).toBeInTheDocument()
      })
      expect(screen.getByTestId('dialog-title')).toHaveTextContent('Great work!')
    })

    it('does NOT open completion modal when reopening a completed item', async () => {
      const item = makeItem({ is_complete: true, completed_at: '2026-03-15T00:00:00Z' })
      const onItemsChange = vi.fn()
      render(
        <ActionItemList
          {...defaultProps}
          items={[item]}
          onItemsChange={onItemsChange}
        />
      )
      // Expand completed section to see Reopen button
      fireEvent.click(screen.getByRole('button', { name: /1 completed/i }))
      fireEvent.click(screen.getByRole('button', { name: /reopen/i }))
      await waitFor(() => {
        expect(mockReopenActionItem).toHaveBeenCalledWith('item-1')
      })
      expect(screen.queryByTestId('dialog')).toBeNull()
    })

    it('calls saveCompletionNote with correct args when Save note is clicked', async () => {
      const item = makeItem({ is_complete: false })
      const onItemsChange = vi.fn()
      render(
        <ActionItemList
          {...defaultProps}
          items={[item]}
          onItemsChange={onItemsChange}
        />
      )
      fireEvent.click(screen.getByRole('checkbox'))
      await waitFor(() => {
        expect(screen.getByTestId('dialog')).toBeInTheDocument()
      })
      const textarea = screen.getByRole('textbox', { name: /note/i })
      fireEvent.change(textarea, { target: { value: 'Great progress!' } })
      fireEvent.click(screen.getByRole('button', { name: /save note/i }))
      await waitFor(() => {
        expect(mockSaveCompletionNote).toHaveBeenCalledWith({
          id: 'item-1',
          note: 'Great progress!',
        })
      })
      // Modal should close
      expect(screen.queryByTestId('dialog')).toBeNull()
    })

    it('closes modal without calling saveCompletionNote when Skip is clicked', async () => {
      const item = makeItem({ is_complete: false })
      const onItemsChange = vi.fn()
      render(
        <ActionItemList
          {...defaultProps}
          items={[item]}
          onItemsChange={onItemsChange}
        />
      )
      fireEvent.click(screen.getByRole('checkbox'))
      await waitFor(() => {
        expect(screen.getByTestId('dialog')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByRole('button', { name: /skip/i }))
      expect(mockSaveCompletionNote).not.toHaveBeenCalled()
      expect(screen.queryByTestId('dialog')).toBeNull()
    })

  })

  describe('POLISH-08: completed items table', () => {
    it('shows "X completed ▼" toggle button when completed items exist', () => {
      const items = [
        makeItem({ id: 'item-1', is_complete: false }),
        makeItem({ id: 'item-2', text: 'Done', is_complete: true, completed_at: '2026-03-10T00:00:00Z' }),
      ]
      render(<ActionItemList {...defaultProps} items={items} />)
      expect(screen.getByRole('button', { name: /1 completed ▼/i })).toBeInTheDocument()
    })

    it('table is NOT visible by default (collapsed)', () => {
      const items = [
        makeItem({ id: 'item-2', text: 'Done', is_complete: true, completed_at: '2026-03-10T00:00:00Z' }),
      ]
      render(<ActionItemList {...defaultProps} items={items} />)
      expect(screen.queryByRole('table')).toBeNull()
    })

    it('table becomes visible after clicking the toggle button', () => {
      const items = [
        makeItem({ id: 'item-2', text: 'Done item', is_complete: true, completed_at: '2026-03-10T00:00:00Z', note: 'My note' }),
      ]
      render(<ActionItemList {...defaultProps} items={items} />)
      fireEvent.click(screen.getByRole('button', { name: /1 completed/i }))
      expect(screen.getByRole('table')).toBeInTheDocument()
      expect(screen.getByText('Done item')).toBeInTheDocument()
      expect(screen.getByText('My note')).toBeInTheDocument()
    })

    it('Reopen button calls reopenActionItem with correct id', async () => {
      const items = [
        makeItem({ id: 'item-99', text: 'Done', is_complete: true, completed_at: '2026-03-10T00:00:00Z' }),
      ]
      render(<ActionItemList {...defaultProps} items={items} />)
      fireEvent.click(screen.getByRole('button', { name: /1 completed/i }))
      fireEvent.click(screen.getByRole('button', { name: /reopen/i }))
      await waitFor(() => {
        expect(mockReopenActionItem).toHaveBeenCalledWith('item-99')
      })
    })

    it('reopened item disappears from completed section (optimistic update)', () => {
      const items = [
        makeItem({ id: 'item-2', text: 'Done', is_complete: true, completed_at: '2026-03-10T00:00:00Z' }),
      ]
      const onItemsChange = vi.fn()
      render(<ActionItemList {...defaultProps} items={items} onItemsChange={onItemsChange} />)
      fireEvent.click(screen.getByRole('button', { name: /1 completed/i }))
      fireEvent.click(screen.getByRole('button', { name: /reopen/i }))
      expect(onItemsChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'item-2', is_complete: false, completed_at: null, note: null }),
        ])
      )
    })
  })

  describe('POLISH-01: active-items cap', () => {
    it('active-items cap: shows "+ Add action item" when activeItems < 7 even if total items >= 7 (some completed)', () => {
      // 6 active + 1 completed = 7 total, but activeItems is only 6 so button should show
      const items = [
        ...makeItems(6),
        makeItem({ id: 'item-completed', text: 'Done item', is_complete: true, completed_at: '2026-03-15T00:00:00Z', position: 6 }),
      ]
      render(<ActionItemList {...defaultProps} items={items} />)
      expect(screen.getByRole('button', { name: /add action item/i })).toBeInTheDocument()
    })
  })
})
