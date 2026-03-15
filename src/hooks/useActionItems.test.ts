// src/hooks/useActionItems.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useActionItems } from './useActionItems'

// Use vi.hoisted so mocks are available when vi.mock factory runs
const { mockFrom } = vi.hoisted(() => {
  const mockFrom = vi.fn()
  return { mockFrom }
})

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
}))

/**
 * Build a fluent Supabase chain that:
 * - supports any call order of select/insert/update/delete/eq/order
 * - resolves to `result` when awaited (via .then)
 * - exposes each step as a vi.fn() for assertions
 */
function buildChain(result: { data: unknown; error: unknown | null }) {
  const chain: Record<string, unknown> = {}
  chain.select = vi.fn().mockReturnValue(chain)
  chain.insert = vi.fn().mockReturnValue(chain)
  chain.update = vi.fn().mockReturnValue(chain)
  chain.delete = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.order = vi.fn().mockReturnValue(chain)
  chain.then = (resolve: (v: unknown) => void, reject?: (e: unknown) => void) =>
    Promise.resolve(result).then(resolve, reject)
  return chain
}

beforeEach(() => {
  vi.clearAllMocks()
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
      mockFrom.mockReturnValue(buildChain({ data: [newItem], error: null }))

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
      mockFrom.mockReturnValue(buildChain({ data: null, error: { message: 'DB error' } }))

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
    it('sends null to Supabase when deadline is null (ACTION-02 pitfall)', async () => {
      const chain = buildChain({ data: null, error: null })
      mockFrom.mockReturnValue(chain)

      const { setDeadline } = useActionItems()
      await setDeadline({ id: 'item-1', deadline: null })

      expect(mockFrom).toHaveBeenCalledWith('action_items')
      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({ deadline: null })
      )
      expect(chain.eq).toHaveBeenCalledWith('id', 'item-1')
    })

    it('sends ISO date string when deadline is set (ACTION-02)', async () => {
      const chain = buildChain({ data: null, error: null })
      mockFrom.mockReturnValue(chain)

      const { setDeadline } = useActionItems()
      await setDeadline({ id: 'item-1', deadline: '2026-04-30' })

      expect(mockFrom).toHaveBeenCalledWith('action_items')
      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({ deadline: '2026-04-30' })
      )
      expect(chain.eq).toHaveBeenCalledWith('id', 'item-1')
    })
  })

  describe('toggleActionItem', () => {
    it('calls Supabase update with is_complete value (ACTION-03)', async () => {
      const chain = buildChain({ data: null, error: null })
      mockFrom.mockReturnValue(chain)

      const { toggleActionItem } = useActionItems()
      await toggleActionItem({ id: 'item-1', isComplete: false })

      expect(mockFrom).toHaveBeenCalledWith('action_items')
      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({ is_complete: false })
      )
      expect(chain.eq).toHaveBeenCalledWith('id', 'item-1')
    })

    it('sets completed_at to an ISO string when completing (POLISH-01)', async () => {
      const chain = buildChain({ data: null, error: null })
      mockFrom.mockReturnValue(chain)

      const { toggleActionItem } = useActionItems()
      await toggleActionItem({ id: 'item-1', isComplete: true })

      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          is_complete: true,
          completed_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
        })
      )
    })

    it('sets completed_at to null when un-completing (POLISH-01)', async () => {
      const chain = buildChain({ data: null, error: null })
      mockFrom.mockReturnValue(chain)

      const { toggleActionItem } = useActionItems()
      await toggleActionItem({ id: 'item-1', isComplete: false })

      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          is_complete: false,
          completed_at: null,
        })
      )
    })
  })

  describe('deleteActionItem', () => {
    it('calls Supabase DELETE with the correct item id (ACTION-04)', async () => {
      const chain = buildChain({ data: null, error: null })
      mockFrom.mockReturnValue(chain)

      const { deleteActionItem } = useActionItems()
      await deleteActionItem('some-id')

      expect(mockFrom).toHaveBeenCalledWith('action_items')
      expect(chain.delete).toHaveBeenCalled()
      expect(chain.eq).toHaveBeenCalledWith('id', 'some-id')
    })
  })

  describe('loadActionItems', () => {
    it('calls .eq category_id and .order position ascending', async () => {
      const chain = buildChain({ data: [], error: null })
      mockFrom.mockReturnValue(chain)

      const { loadActionItems } = useActionItems()
      await loadActionItems('cat-id')

      expect(mockFrom).toHaveBeenCalledWith('action_items')
      expect(chain.eq).toHaveBeenCalledWith('category_id', 'cat-id')
      expect(chain.order).toHaveBeenCalledWith('position', { ascending: true })
    })

    it('SELECT string includes completed_at and note columns (POLISH-01)', async () => {
      const chain = buildChain({ data: [], error: null })
      mockFrom.mockReturnValue(chain)

      const { loadActionItems } = useActionItems()
      await loadActionItems('cat-id')

      const selectArg: string = (chain.select as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(selectArg).toContain('completed_at')
      expect(selectArg).toContain('note')
    })
  })

  describe('saveCompletionNote', () => {
    it('updates note and updated_at for the given id (POLISH-01)', async () => {
      const chain = buildChain({ data: null, error: null })
      mockFrom.mockReturnValue(chain)

      const { saveCompletionNote } = useActionItems()
      await saveCompletionNote({ id: 'item-1', note: 'Great job!' })

      expect(mockFrom).toHaveBeenCalledWith('action_items')
      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({ note: 'Great job!' })
      )
      expect(chain.eq).toHaveBeenCalledWith('id', 'item-1')
    })
  })

  describe('reopenActionItem', () => {
    it('resets is_complete, completed_at, and note to false/null/null (POLISH-01)', async () => {
      const chain = buildChain({ data: null, error: null })
      mockFrom.mockReturnValue(chain)

      const { reopenActionItem } = useActionItems()
      await reopenActionItem('item-1')

      expect(mockFrom).toHaveBeenCalledWith('action_items')
      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          is_complete: false,
          completed_at: null,
          note: null,
        })
      )
      expect(chain.eq).toHaveBeenCalledWith('id', 'item-1')
    })
  })
})
