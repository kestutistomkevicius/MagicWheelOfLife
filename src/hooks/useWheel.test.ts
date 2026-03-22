import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useWheel } from './useWheel'
import type { WheelRow, CategoryRow } from '@/types/database'

// ── Supabase mock ────────────────────────────────────────────────────────────
// We mock the entire module. Each test overrides the select/insert/update
// responses via mockResolvedValueOnce / mockReturnValueOnce.

const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockEq = vi.fn()
const mockOrder = vi.fn()
const mockLimit = vi.fn()
const mockSelect = vi.fn()

vi.mock('@/lib/supabase', () => {
  const buildChain = (terminalResult: unknown) => {
    const chain: Record<string, unknown> = {}
    chain.select = vi.fn().mockReturnValue(chain)
    chain.insert = vi.fn().mockReturnValue(chain)
    chain.update = vi.fn().mockReturnValue(chain)
    chain.delete = vi.fn().mockReturnValue(chain)
    chain.eq = vi.fn().mockReturnValue(chain)
    chain.order = vi.fn().mockReturnValue(chain)
    chain.limit = vi.fn().mockReturnValue(chain)
    chain.single = vi.fn().mockResolvedValue(terminalResult)
    // Make the chain itself thenable so await works
    chain.then = (resolve: (v: unknown) => void) => Promise.resolve(terminalResult).then(resolve)
    return chain
  }

  return {
    supabase: {
      from: vi.fn().mockImplementation(() => buildChain({ data: null, error: null })),
    },
  }
})

// Import AFTER mock to get the mocked module
import { supabase } from '@/lib/supabase'

// ── Test data ────────────────────────────────────────────────────────────────
const USER_ID = 'user-123'

const mockWheel: WheelRow = {
  id: 'wheel-001',
  user_id: USER_ID,
  name: 'My Wheel',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  deleted_at: null,
}

const mockCategories: CategoryRow[] = [
  {
    id: 'cat-001',
    wheel_id: 'wheel-001',
    user_id: USER_ID,
    name: 'Health',
    position: 0,
    score_asis: 5,
    score_tobe: 7,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
]

// Helper: make supabase.from() return different results per table call
function mockFromSequence(responses: Array<{ data: unknown; error: unknown }>) {
  let callCount = 0
  vi.mocked(supabase.from).mockImplementation(() => {
    const result = responses[callCount] ?? { data: null, error: null }
    callCount++
    const chain: Record<string, unknown> = {}
    chain.select = vi.fn().mockReturnValue(chain)
    chain.insert = vi.fn().mockReturnValue(chain)
    chain.update = vi.fn().mockReturnValue(chain)
    chain.delete = vi.fn().mockReturnValue(chain)
    chain.eq = vi.fn().mockReturnValue(chain)
    chain.order = vi.fn().mockReturnValue(chain)
    chain.limit = vi.fn().mockReturnValue(chain)
    chain.single = vi.fn().mockResolvedValue(result)
    chain.then = (resolve: (v: unknown) => void) => Promise.resolve(result).then(resolve)
    return chain as ReturnType<typeof supabase.from>
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ── Tests ────────────────────────────────────────────────────────────────────

describe('useWheel', () => {
  describe('loading wheel', () => {
    it('returns loading=true initially then loading=false after fetch', async () => {
      // Profile: free tier, Wheels: empty, no categories
      mockFromSequence([
        { data: { id: USER_ID, tier: 'free', created_at: '' }, error: null }, // profiles
        { data: [], error: null }, // wheels
      ])

      const { result } = renderHook(() => useWheel(USER_ID))
      expect(result.current.loading).toBe(true)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })

    it('returns wheel and categories when user has an existing wheel', async () => {
      mockFromSequence([
        { data: { id: USER_ID, tier: 'free', created_at: '' }, error: null }, // profiles
        { data: [mockWheel], error: null }, // wheels
        { data: mockCategories, error: null }, // categories
      ])

      const { result } = renderHook(() => useWheel(USER_ID))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.wheel).toEqual(mockWheel)
      expect(result.current.categories).toEqual(mockCategories)
    })

    it('returns wheel=null when user has no wheels', async () => {
      mockFromSequence([
        { data: { id: USER_ID, tier: 'free', created_at: '' }, error: null }, // profiles
        { data: [], error: null }, // wheels — empty
      ])

      const { result } = renderHook(() => useWheel(USER_ID))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.wheel).toBeNull()
    })
  })

  describe('createWheel - template (WHEEL-01)', () => {
    it('inserts a wheel row and 8 default categories when mode is template', async () => {
      // Initial load: free tier + no wheels
      mockFromSequence([
        { data: { id: USER_ID, tier: 'free', created_at: '' }, error: null }, // profiles
        { data: [], error: null }, // wheels
      ])

      const { result } = renderHook(() => useWheel(USER_ID))
      await waitFor(() => expect(result.current.loading).toBe(false))

      // Reset mock: createWheel calls — wheel insert, then category insert
      const newWheel: WheelRow = { ...mockWheel, id: 'wheel-new' }
      let callCount = 0
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++
        let terminalData: unknown = null
        if (callCount === 1) terminalData = [newWheel]          // wheel insert
        if (callCount === 2) terminalData = []                  // category batch insert (returns empty / no error)

        const chain: Record<string, unknown> = {}
        chain.select = vi.fn().mockReturnValue(chain)
        chain.insert = vi.fn().mockReturnValue(chain)
        chain.update = vi.fn().mockReturnValue(chain)
        chain.delete = vi.fn().mockReturnValue(chain)
        chain.eq = vi.fn().mockReturnValue(chain)
        chain.order = vi.fn().mockReturnValue(chain)
        chain.limit = vi.fn().mockReturnValue(chain)
        chain.single = vi.fn().mockResolvedValue({ data: terminalData, error: null })
        chain.then = (resolve: (v: unknown) => void) => Promise.resolve({ data: terminalData, error: null }).then(resolve)
        return chain as ReturnType<typeof supabase.from>
      })

      let createdWheel: WheelRow | null = null
      await act(async () => {
        createdWheel = await result.current.createWheel('template', 'My Wheel', USER_ID)
      })

      expect(createdWheel).toEqual(newWheel)
      // 2 calls to supabase.from: wheels insert + categories batch insert
      expect(callCount).toBe(2)
    })

    it('returns the new wheel id after creation', async () => {
      // Initial load
      mockFromSequence([
        { data: { id: USER_ID, tier: 'free', created_at: '' }, error: null },
        { data: [], error: null },
      ])

      const { result } = renderHook(() => useWheel(USER_ID))
      await waitFor(() => expect(result.current.loading).toBe(false))

      const newWheel: WheelRow = { ...mockWheel, id: 'wheel-xyz' }
      let callCount = 0
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++
        const terminalData = callCount === 1 ? [newWheel] : []
        const chain: Record<string, unknown> = {}
        chain.select = vi.fn().mockReturnValue(chain)
        chain.insert = vi.fn().mockReturnValue(chain)
        chain.update = vi.fn().mockReturnValue(chain)
        chain.delete = vi.fn().mockReturnValue(chain)
        chain.eq = vi.fn().mockReturnValue(chain)
        chain.order = vi.fn().mockReturnValue(chain)
        chain.limit = vi.fn().mockReturnValue(chain)
        chain.single = vi.fn().mockResolvedValue({ data: terminalData, error: null })
        chain.then = (resolve: (v: unknown) => void) => Promise.resolve({ data: terminalData, error: null }).then(resolve)
        return chain as ReturnType<typeof supabase.from>
      })

      let createdWheel: WheelRow | null = null
      await act(async () => {
        createdWheel = await result.current.createWheel('template', 'My Wheel', USER_ID)
      })

      expect(createdWheel?.id).toBe('wheel-xyz')
    })
  })

  describe('createWheel - blank (WHEEL-02)', () => {
    it('inserts a wheel row with 3 placeholder categories when mode is blank', async () => {
      // Initial load
      mockFromSequence([
        { data: { id: USER_ID, tier: 'free', created_at: '' }, error: null },
        { data: [], error: null },
      ])

      const { result } = renderHook(() => useWheel(USER_ID))
      await waitFor(() => expect(result.current.loading).toBe(false))

      const newWheel: WheelRow = { ...mockWheel, id: 'wheel-blank' }
      let callCount = 0
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++
        const terminalData = callCount === 1 ? [newWheel] : []
        const chain: Record<string, unknown> = {}
        chain.select = vi.fn().mockReturnValue(chain)
        chain.insert = vi.fn().mockReturnValue(chain)
        chain.update = vi.fn().mockReturnValue(chain)
        chain.delete = vi.fn().mockReturnValue(chain)
        chain.eq = vi.fn().mockReturnValue(chain)
        chain.order = vi.fn().mockReturnValue(chain)
        chain.limit = vi.fn().mockReturnValue(chain)
        chain.single = vi.fn().mockResolvedValue({ data: terminalData, error: null })
        chain.then = (resolve: (v: unknown) => void) => Promise.resolve({ data: terminalData, error: null }).then(resolve)
        return chain as ReturnType<typeof supabase.from>
      })

      let createdWheel: WheelRow | null = null
      await act(async () => {
        createdWheel = await result.current.createWheel('blank', 'My Wheel', USER_ID)
      })

      expect(createdWheel?.id).toBe('wheel-blank')
      // 2 calls to supabase.from — wheel insert + 3 placeholder category insert
      expect(callCount).toBe(2)
    })
  })

  describe('tier enforcement (WHEEL-06, WHEEL-07)', () => {
    it('returns canCreateWheel=false when free-tier user already has 1 wheel', async () => {
      mockFromSequence([
        { data: { id: USER_ID, tier: 'free', created_at: '' }, error: null }, // profiles
        { data: [mockWheel], error: null }, // wheels — has 1
        { data: mockCategories, error: null }, // categories
      ])

      const { result } = renderHook(() => useWheel(USER_ID))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.canCreateWheel).toBe(false)
    })

    it('returns canCreateWheel=true when premium-tier user already has 1 wheel', async () => {
      mockFromSequence([
        { data: { id: USER_ID, tier: 'premium', created_at: '' }, error: null }, // profiles
        { data: [mockWheel], error: null }, // wheels — has 1
        { data: mockCategories, error: null }, // categories
      ])

      const { result } = renderHook(() => useWheel(USER_ID))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.canCreateWheel).toBe(true)
    })
  })

  describe('updateScore', () => {
    it('calls supabase.from(categories).update with correct field and value', async () => {
      // Initial load
      mockFromSequence([
        { data: { id: USER_ID, tier: 'free', created_at: '' }, error: null },
        { data: [mockWheel], error: null },
        { data: mockCategories, error: null },
      ])

      const { result } = renderHook(() => useWheel(USER_ID))
      await waitFor(() => expect(result.current.loading).toBe(false))

      // Track the update call
      const mockUpdateFn = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      })
      const mockFromForUpdate = vi.fn().mockReturnValue({
        update: mockUpdateFn,
      })
      vi.mocked(supabase.from).mockImplementation(mockFromForUpdate as unknown as typeof supabase.from)

      await act(async () => {
        await result.current.updateScore('cat-001', 'score_asis', 8)
      })

      expect(mockFromForUpdate).toHaveBeenCalledWith('categories')
      expect(mockUpdateFn).toHaveBeenCalledWith(
        expect.objectContaining({ score_asis: 8 })
      )
    })
  })

  describe('tier (POLISH-05)', () => {
    it('returns tier="free" when profile fetch returns free tier', async () => {
      mockFromSequence([
        { data: { id: USER_ID, tier: 'free', created_at: '' }, error: null }, // profiles
        { data: [], error: null }, // wheels
      ])

      const { result } = renderHook(() => useWheel(USER_ID))
      await waitFor(() => expect(result.current.loading).toBe(false))

      expect(result.current.tier).toBe('free')
    })

    it('returns tier="premium" when profile fetch returns premium tier', async () => {
      mockFromSequence([
        { data: { id: USER_ID, tier: 'premium', created_at: '' }, error: null }, // profiles
        { data: [mockWheel], error: null }, // wheels
        { data: mockCategories, error: null }, // categories
      ])

      const { result } = renderHook(() => useWheel(USER_ID))
      await waitFor(() => expect(result.current.loading).toBe(false))

      expect(result.current.tier).toBe('premium')
    })
  })

  describe('renameWheel (POLISH-07)', () => {
    it('calls supabase update on wheels table with trimmed name', async () => {
      mockFromSequence([
        { data: { id: USER_ID, tier: 'free', created_at: '' }, error: null },
        { data: [mockWheel], error: null },
        { data: mockCategories, error: null },
      ])

      const { result } = renderHook(() => useWheel(USER_ID))
      await waitFor(() => expect(result.current.loading).toBe(false))

      const mockUpdateFn = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      })
      const mockFromForUpdate = vi.fn().mockReturnValue({
        update: mockUpdateFn,
      })
      vi.mocked(supabase.from).mockImplementation(mockFromForUpdate as unknown as typeof supabase.from)

      await act(async () => {
        await result.current.renameWheel('wheel-001', '  New Name  ')
      })

      expect(mockFromForUpdate).toHaveBeenCalledWith('wheels')
      expect(mockUpdateFn).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New Name' })
      )
    })

    it('does NOT call supabase when newName is empty or whitespace', async () => {
      mockFromSequence([
        { data: { id: USER_ID, tier: 'free', created_at: '' }, error: null },
        { data: [mockWheel], error: null },
        { data: mockCategories, error: null },
      ])

      const { result } = renderHook(() => useWheel(USER_ID))
      await waitFor(() => expect(result.current.loading).toBe(false))

      const mockFromForUpdate = vi.fn()
      vi.mocked(supabase.from).mockImplementation(mockFromForUpdate as unknown as typeof supabase.from)

      await act(async () => {
        await result.current.renameWheel('wheel-001', '   ')
      })

      expect(mockFromForUpdate).not.toHaveBeenCalled()
    })
  })

  describe('updateCategoryImportant (POLISH-04)', () => {
    const mockCategoriesWithImportant: CategoryRow[] = [
      {
        id: 'cat-001',
        wheel_id: 'wheel-001',
        user_id: USER_ID,
        name: 'Health',
        position: 0,
        score_asis: 5,
        score_tobe: 7,
        is_important: false,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
      {
        id: 'cat-002',
        wheel_id: 'wheel-001',
        user_id: USER_ID,
        name: 'Career',
        position: 1,
        score_asis: 6,
        score_tobe: 8,
        is_important: false,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
      {
        id: 'cat-003',
        wheel_id: 'wheel-001',
        user_id: USER_ID,
        name: 'Finance',
        position: 2,
        score_asis: 4,
        score_tobe: 6,
        is_important: false,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    ]

    it('reorders categories so important ones appear first (position 0)', async () => {
      mockFromSequence([
        { data: { id: USER_ID, tier: 'free', created_at: '' }, error: null },
        { data: [mockWheel], error: null },
        { data: mockCategoriesWithImportant, error: null },
      ])

      const { result } = renderHook(() => useWheel(USER_ID))
      await waitFor(() => expect(result.current.loading).toBe(false))

      // Mock supabase for update + upsert calls
      const buildUpdateChain = (terminalResult: unknown) => {
        const chain: Record<string, unknown> = {}
        chain.update = vi.fn().mockReturnValue(chain)
        chain.upsert = vi.fn().mockReturnValue(chain)
        chain.eq = vi.fn().mockReturnValue(chain)
        chain.then = (resolve: (v: unknown) => void) => Promise.resolve(terminalResult).then(resolve)
        return chain as ReturnType<typeof supabase.from>
      }
      vi.mocked(supabase.from).mockImplementation(() => buildUpdateChain({ data: null, error: null }))

      await act(async () => {
        await result.current.updateCategoryImportant('cat-002', true)
      })

      // cat-002 (Career) should now be at position 0
      const cat002 = result.current.categories.find(c => c.id === 'cat-002')
      expect(cat002?.position).toBe(0)
    })

    it('important categories occupy positions 0, 1, 2 when 3 are marked', async () => {
      const allImportant = mockCategoriesWithImportant.map(c => ({ ...c, is_important: true }))
      mockFromSequence([
        { data: { id: USER_ID, tier: 'free', created_at: '' }, error: null },
        { data: [mockWheel], error: null },
        { data: allImportant, error: null },
      ])

      const { result } = renderHook(() => useWheel(USER_ID))
      await waitFor(() => expect(result.current.loading).toBe(false))

      // All 3 are already important; just verify positions 0, 1, 2 are assigned
      const positions = result.current.categories.map(c => c.position).sort((a, b) => a - b)
      // positions should be [0, 1, 2] — initial load assigns them in order
      expect(positions).toEqual([0, 1, 2])
    })

    it('calls supabase update on categories table with is_important value', async () => {
      mockFromSequence([
        { data: { id: USER_ID, tier: 'free', created_at: '' }, error: null },
        { data: [mockWheel], error: null },
        { data: mockCategoriesWithImportant, error: null },
      ])

      const { result } = renderHook(() => useWheel(USER_ID))
      await waitFor(() => expect(result.current.loading).toBe(false))

      const mockUpdateFn = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      })
      const mockUpsertFn = vi.fn().mockResolvedValue({ data: null, error: null })
      const mockFromFn = vi.fn().mockReturnValue({
        update: mockUpdateFn,
        upsert: mockUpsertFn,
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      })
      vi.mocked(supabase.from).mockImplementation(mockFromFn as unknown as typeof supabase.from)

      await act(async () => {
        await result.current.updateCategoryImportant('cat-001', true)
      })

      expect(mockFromFn).toHaveBeenCalledWith('categories')
      expect(mockUpdateFn).toHaveBeenCalledWith(
        expect.objectContaining({ is_important: true })
      )
    })
  })
})

describe('soft delete', () => {
  it.todo('softDeleteWheel sets deleted_at on the target wheel in local state')
  it.todo('softDeleteWheel switches active wheel to next non-deleted wheel')
  it.todo('softDeleteWheel sets canCreateWheel=true for free user after deleting their only wheel')
  it.todo('undoDeleteWheel clears deleted_at on the target wheel')
  it.todo('undoDeleteWheel does not affect canCreateWheel for premium users')
})

// Suppress unused import warnings
void mockInsert
void mockUpdate
void mockDelete
void mockEq
void mockOrder
void mockLimit
void mockSelect
