import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCategories } from './useCategories'
import type { CategoryRow } from '@/types/database'

// ── Supabase mock ────────────────────────────────────────────────────────────

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

import { supabase } from '@/lib/supabase'

// ── Test data ────────────────────────────────────────────────────────────────

const WHEEL_ID = 'wheel-001'
const USER_ID = 'user-123'

function makeCategory(id: string, name: string, position: number): CategoryRow {
  return {
    id,
    wheel_id: WHEEL_ID,
    user_id: USER_ID,
    name,
    position,
    score_asis: 5,
    score_tobe: 5,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }
}

const threeCategories: CategoryRow[] = [
  makeCategory('cat-001', 'Health', 0),
  makeCategory('cat-002', 'Career', 1),
  makeCategory('cat-003', 'Finance', 2),
]

// Helper: build a minimal Supabase chain that resolves to given result
function buildChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {}
  chain.insert = vi.fn().mockReturnValue(chain)
  chain.update = vi.fn().mockReturnValue(chain)
  chain.delete = vi.fn().mockReturnValue(chain)
  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn().mockResolvedValue(result)
  chain.then = (resolve: (v: unknown) => void) => Promise.resolve(result).then(resolve)
  return chain as ReturnType<typeof supabase.from>
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ── Tests ────────────────────────────────────────────────────────────────────

describe('useCategories', () => {
  describe('addCategory (WHEEL-03)', () => {
    it('inserts a new category and returns updated list', async () => {
      const newCat = makeCategory('cat-new', 'Fun', 3)
      vi.mocked(supabase.from).mockReturnValue(buildChain({ data: [newCat], error: null }))

      const { result } = renderHook(() => useCategories())
      let returned: CategoryRow | { error: string } | undefined

      await act(async () => {
        returned = await result.current.addCategory({
          wheelId: WHEEL_ID,
          userId: USER_ID,
          name: 'Fun',
          currentCount: 3,
          currentMaxPosition: 2,
        })
      })

      expect(supabase.from).toHaveBeenCalledWith('categories')
      expect(returned).toEqual(newCat)
    })

    it('blocks insertion when category count is already 12', async () => {
      const { result } = renderHook(() => useCategories())
      let returned: CategoryRow | { error: string } | undefined

      await act(async () => {
        returned = await result.current.addCategory({
          wheelId: WHEEL_ID,
          userId: USER_ID,
          name: 'Extra',
          currentCount: 12,
          currentMaxPosition: 11,
        })
      })

      // Should not call Supabase at all
      expect(supabase.from).not.toHaveBeenCalled()
      expect(returned).toEqual({ error: 'Maximum 12 categories reached' })
    })

    it('assigns next sequential position to new category', async () => {
      const newCat = makeCategory('cat-new', 'Spirituality', 5)
      vi.mocked(supabase.from).mockReturnValue(buildChain({ data: [newCat], error: null }))

      const { result } = renderHook(() => useCategories())

      // Capture what was passed to insert
      const insertSpy = vi.fn().mockReturnValue(buildChain({ data: [newCat], error: null }))
      vi.mocked(supabase.from).mockReturnValue({
        insert: insertSpy,
        select: vi.fn().mockReturnThis(),
        then: (resolve: (v: unknown) => void) => Promise.resolve({ data: [newCat], error: null }).then(resolve),
      } as unknown as ReturnType<typeof supabase.from>)

      await act(async () => {
        await result.current.addCategory({
          wheelId: WHEEL_ID,
          userId: USER_ID,
          name: 'Spirituality',
          currentCount: 5,
          currentMaxPosition: 4,
        })
      })

      expect(insertSpy).toHaveBeenCalledWith(
        expect.objectContaining({ position: 5 })
      )
    })
  })

  describe('renameCategory (WHEEL-04)', () => {
    it('updates category name in Supabase', async () => {
      const eqChain = { then: (resolve: (v: unknown) => void) => Promise.resolve({ data: null, error: null }).then(resolve) }
      const updateFn = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue(eqChain) })
      vi.mocked(supabase.from).mockReturnValue({ update: updateFn } as unknown as ReturnType<typeof supabase.from>)

      const { result } = renderHook(() => useCategories())

      await act(async () => {
        await result.current.renameCategory({
          categoryId: 'cat-001',
          newName: 'Wellbeing',
          hasSnapshots: false,
          onSnapshotWarning: vi.fn(),
        })
      })

      expect(supabase.from).toHaveBeenCalledWith('categories')
      expect(updateFn).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Wellbeing' })
      )
    })

    it('calls onSnapshotWarning callback before rename when hasSnapshots is true', async () => {
      const onSnapshotWarning = vi.fn()
      const { result } = renderHook(() => useCategories())

      await act(async () => {
        await result.current.renameCategory({
          categoryId: 'cat-001',
          newName: 'Wellbeing',
          hasSnapshots: true,
          onSnapshotWarning,
        })
      })

      expect(onSnapshotWarning).toHaveBeenCalledOnce()
      // Should NOT call Supabase when hasSnapshots=true
      expect(supabase.from).not.toHaveBeenCalled()
    })

    it('proceeds without warning when hasSnapshots is false', async () => {
      const onSnapshotWarning = vi.fn()
      const eqChain = { then: (resolve: (v: unknown) => void) => Promise.resolve({ data: null, error: null }).then(resolve) }
      const updateFn = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue(eqChain) })
      vi.mocked(supabase.from).mockReturnValue({ update: updateFn } as unknown as ReturnType<typeof supabase.from>)

      const { result } = renderHook(() => useCategories())

      await act(async () => {
        await result.current.renameCategory({
          categoryId: 'cat-001',
          newName: 'Health',
          hasSnapshots: false,
          onSnapshotWarning,
        })
      })

      expect(onSnapshotWarning).not.toHaveBeenCalled()
      expect(supabase.from).toHaveBeenCalledWith('categories')
    })
  })

  describe('removeCategory (WHEEL-05)', () => {
    it('deletes category from Supabase', async () => {
      const eqChain = { then: (resolve: (v: unknown) => void) => Promise.resolve({ data: null, error: null }).then(resolve) }
      const deleteFn = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue(eqChain) })
      vi.mocked(supabase.from).mockReturnValue({ delete: deleteFn } as unknown as ReturnType<typeof supabase.from>)

      const { result } = renderHook(() => useCategories())

      await act(async () => {
        await result.current.removeCategory({
          categoryId: 'cat-001',
          currentCount: threeCategories.length + 1, // 4, safe to delete
          hasSnapshots: false,
          onSnapshotWarning: vi.fn(),
        })
      })

      expect(supabase.from).toHaveBeenCalledWith('categories')
      expect(deleteFn).toHaveBeenCalled()
    })

    it('blocks deletion when category count is already 3', async () => {
      const { result } = renderHook(() => useCategories())
      let returned: void | { error: string } | undefined

      await act(async () => {
        returned = await result.current.removeCategory({
          categoryId: 'cat-001',
          currentCount: 3,
          hasSnapshots: false,
          onSnapshotWarning: vi.fn(),
        })
      })

      expect(supabase.from).not.toHaveBeenCalled()
      expect(returned).toEqual({ error: 'Minimum 3 categories required' })
    })

    it('calls onSnapshotWarning callback before remove when hasSnapshots is true', async () => {
      const onSnapshotWarning = vi.fn()
      const { result } = renderHook(() => useCategories())

      await act(async () => {
        await result.current.removeCategory({
          categoryId: 'cat-001',
          currentCount: 5,
          hasSnapshots: true,
          onSnapshotWarning,
        })
      })

      expect(onSnapshotWarning).toHaveBeenCalledOnce()
      expect(supabase.from).not.toHaveBeenCalled()
    })
  })
})
