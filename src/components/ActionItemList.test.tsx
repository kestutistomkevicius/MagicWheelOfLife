// src/components/ActionItemList.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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

// Mock useActionItems hook
const mockAddActionItem = vi.fn()
const mockToggleActionItem = vi.fn().mockResolvedValue(undefined)
const mockSetDeadline = vi.fn().mockResolvedValue(undefined)
const mockDeleteActionItem = vi.fn().mockResolvedValue(undefined)
const mockLoadActionItems = vi.fn().mockResolvedValue([])

vi.mock('@/hooks/useActionItems', () => ({
  useActionItems: () => ({
    loadActionItems: mockLoadActionItems,
    addActionItem: mockAddActionItem,
    toggleActionItem: mockToggleActionItem,
    setDeadline: mockSetDeadline,
    deleteActionItem: mockDeleteActionItem,
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
      const dateInput = screen.getByRole('textbox', { hidden: true }) || screen.getAllByDisplayValue('')[0]
      // Find all date inputs — there should be one with value ''
      const inputs = screen.getAllByRole('textbox', { hidden: true })
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
    it('renders Checkbox checked when item.is_complete is true', () => {
      render(<ActionItemList {...defaultProps} items={[makeItem({ is_complete: true })]} />)
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBeChecked()
    })

    it('item text has line-through class when is_complete is true', () => {
      render(<ActionItemList {...defaultProps} items={[makeItem({ is_complete: true })]} />)
      const label = screen.getByText('Test item')
      expect(label.className).toContain('line-through')
    })

    it('calls toggleActionItem when Checkbox is clicked', async () => {
      const onItemsChange = vi.fn()
      render(
        <ActionItemList
          {...defaultProps}
          items={[makeItem({ is_complete: false })]}
          onItemsChange={onItemsChange}
        />
      )
      fireEvent.click(screen.getByRole('checkbox'))
      await waitFor(() => {
        expect(mockToggleActionItem).toHaveBeenCalledWith({ id: 'item-1', isComplete: true })
      })
      expect(onItemsChange).toHaveBeenCalled()
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
})
