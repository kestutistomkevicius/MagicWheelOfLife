// src/hooks/useActionItems.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useActionItems } from './useActionItems'

const mockEq = vi.fn().mockReturnThis()
const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null })
const mockSelect = vi.fn().mockResolvedValue({ data: [], error: null })
const mockInsert = vi.fn().mockReturnThis()
const mockUpdate = vi.fn().mockReturnThis()
const mockDelete = vi.fn().mockReturnThis()
const mockFrom = vi.fn().mockReturnValue({
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDelete,
  eq: mockEq,
  order: mockOrder,
})

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
}))

beforeEach(() => {
  vi.clearAllMocks()
  // Reset eq to support chaining in both select and delete paths
  mockEq.mockReturnThis()
  mockOrder.mockResolvedValue({ data: [], error: null })
  mockSelect.mockResolvedValue({ data: [], error: null })
})

describe('useActionItems', () => {
  describe('addActionItem', () => {
    it('returns error when currentCount >= 7 (ACTION-01 limit)', async () => {
      const { addActionItem } = useActionItems()
      const result = await addActionItem({
        categoryId: 'cat-1',
        userId: 'user-1',
        text: 'Some action',
        currentCount: 7,
      })
      expect(result).toEqual({ error: 'Maximum 7 action items per category' })
      expect(mockFrom).not.toHaveBeenCalled()
    })

    it('returns ActionItemRow on successful insert (ACTION-01)', async () => {
      const newItem = {
        id: 'item-1',
        category_id: 'cat-1',
        user_id: 'user-1',
        text: 'Run 3x per week',
        is_complete: false,
        deadline: null,
        position: 3,
        created_at: '2026-03-15T00:00:00Z',
        updated_at: '2026-03-15T00:00:00Z',
      }
      mockInsert.mockReturnThis()
      mockSelect.mockResolvedValue({ data: [newItem], error: null })

      const { addActionItem } = useActionItems()
      const result = await addActionItem({
        categoryId: 'cat-1',
        userId: 'user-1',
        text: 'Run 3x per week',
        currentCount: 3,
      })
      expect(result).toEqual(newItem)
    })

    it('returns error object when Supabase insert fails (ACTION-01)', async () => {
      mockInsert.mockReturnThis()
      mockSelect.mockResolvedValue({ data: null, error: { message: 'DB error' } })

      const { addActionItem } = useActionItems()
      const result = await addActionItem({
        categoryId: 'cat-1',
        userId: 'user-1',
        text: 'Failing item',
        currentCount: 3,
      })
      expect(result).toEqual({ error: 'DB error' })
    })
  })

  describe('setDeadline', () => {
    it('sends null to Supabase when value is null (ACTION-02 pitfall)', async () => {
      mockUpdate.mockReturnThis()
      mockEq.mockResolvedValue({ data: null, error: null })

      const { setDeadline } = useActionItems()
      await setDeadline({ id: 'item-1', deadline: null })

      expect(mockFrom).toHaveBeenCalledWith('action_items')
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ deadline: null })
      )
      expect(mockEq).toHaveBeenCalledWith('id', 'item-1')
    })

    it('sends ISO date string when value is set (ACTION-02)', async () => {
      mockUpdate.mockReturnThis()
      mockEq.mockResolvedValue({ data: null, error: null })

      const { setDeadline } = useActionItems()
      await setDeadline({ id: 'item-1', deadline: '2026-04-30' })

      expect(mockFrom).toHaveBeenCalledWith('action_items')
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ deadline: '2026-04-30' })
      )
      expect(mockEq).toHaveBeenCalledWith('id', 'item-1')
    })
  })

  describe('toggleActionItem', () => {
    it('calls Supabase update with is_complete value (ACTION-03)', async () => {
      mockUpdate.mockReturnThis()
      mockEq.mockResolvedValue({ data: null, error: null })

      const { toggleActionItem } = useActionItems()
      await toggleActionItem({ id: 'item-1', isComplete: false })

      expect(mockFrom).toHaveBeenCalledWith('action_items')
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ is_complete: false })
      )
      expect(mockEq).toHaveBeenCalledWith('id', 'item-1')
    })
  })

  describe('deleteActionItem', () => {
    it('calls Supabase DELETE with the correct item id (ACTION-04)', async () => {
      mockDelete.mockReturnThis()
      mockEq.mockResolvedValue({ data: null, error: null })

      const { deleteActionItem } = useActionItems()
      await deleteActionItem('some-id')

      expect(mockFrom).toHaveBeenCalledWith('action_items')
      expect(mockDelete).toHaveBeenCalled()
      expect(mockEq).toHaveBeenCalledWith('id', 'some-id')
    })
  })

  describe('loadActionItems', () => {
    it('calls .eq category_id and .order position ascending', async () => {
      const { loadActionItems } = useActionItems()
      await loadActionItems('cat-id')

      expect(mockFrom).toHaveBeenCalledWith('action_items')
      expect(mockEq).toHaveBeenCalledWith('category_id', 'cat-id')
      expect(mockOrder).toHaveBeenCalledWith('position', { ascending: true })
    })
  })
})
