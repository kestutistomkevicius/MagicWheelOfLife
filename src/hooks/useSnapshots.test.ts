// src/hooks/useSnapshots.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSnapshots } from './useSnapshots'

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
 * - supports any call order of select/insert/update/delete/eq/order/in
 * - resolves to `result` when awaited (via .then)
 * - exposes each step as a vi.fn() for assertions
 */
function buildChain(result: { data: unknown; error: unknown | null; count?: number | null }) {
  const chain: Record<string, unknown> = {}
  chain.select = vi.fn().mockReturnValue(chain)
  chain.insert = vi.fn().mockReturnValue(chain)
  chain.update = vi.fn().mockReturnValue(chain)
  chain.delete = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.order = vi.fn().mockReturnValue(chain)
  chain.in = vi.fn().mockReturnValue(chain)
  chain.then = (resolve: (v: unknown) => void, reject?: (e: unknown) => void) =>
    Promise.resolve(result).then(resolve, reject)
  return chain
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useSnapshots', () => {
  describe('saveSnapshot', () => {
    it('inserts snapshot row then snapshot_scores rows and returns SnapshotRow (SNAP-01)', async () => {
      const snapshotRow = {
        id: 'snap-1',
        wheel_id: 'wheel-1',
        user_id: 'user-1',
        name: 'Baseline',
        saved_at: '2026-03-15T00:00:00Z',
      }
      const snapChain = buildChain({ data: [snapshotRow], error: null })
      const scoresChain = buildChain({ data: null, error: null })
      mockFrom.mockReturnValueOnce(snapChain).mockReturnValueOnce(scoresChain)

      const { saveSnapshot } = useSnapshots()
      const result = await saveSnapshot({
        wheelId: 'wheel-1',
        userId: 'user-1',
        name: 'Baseline',
        categories: [
          { name: 'Health', position: 0, score_asis: 7, score_tobe: 9 },
          { name: 'Career', position: 1, score_asis: 5, score_tobe: 8 },
        ],
      })

      expect(result).toEqual(snapshotRow)
      expect(mockFrom).toHaveBeenNthCalledWith(1, 'snapshots')
      expect(snapChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({ wheel_id: 'wheel-1', user_id: 'user-1', name: 'Baseline' })
      )
      expect(mockFrom).toHaveBeenNthCalledWith(2, 'snapshot_scores')
      expect(scoresChain.insert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ snapshot_id: 'snap-1', category_name: 'Health' }),
          expect.objectContaining({ snapshot_id: 'snap-1', category_name: 'Career' }),
        ])
      )
    })

    it('returns error object when snapshot insert fails', async () => {
      const snapChain = buildChain({ data: null, error: { message: 'Insert failed' } })
      mockFrom.mockReturnValueOnce(snapChain)

      const { saveSnapshot } = useSnapshots()
      const result = await saveSnapshot({
        wheelId: 'wheel-1',
        userId: 'user-1',
        name: 'Baseline',
        categories: [{ name: 'Health', position: 0, score_asis: 7, score_tobe: 9 }],
      })

      expect(result).toEqual({ error: 'Insert failed' })
    })

    it('returns error object when score insert fails', async () => {
      const snapshotRow = {
        id: 'snap-1',
        wheel_id: 'wheel-1',
        user_id: 'user-1',
        name: 'Baseline',
        saved_at: '2026-03-15T00:00:00Z',
      }
      const snapChain = buildChain({ data: [snapshotRow], error: null })
      const scoresChain = buildChain({ data: null, error: { message: 'Scores insert failed' } })
      mockFrom.mockReturnValueOnce(snapChain).mockReturnValueOnce(scoresChain)

      const { saveSnapshot } = useSnapshots()
      const result = await saveSnapshot({
        wheelId: 'wheel-1',
        userId: 'user-1',
        name: 'Baseline',
        categories: [{ name: 'Health', position: 0, score_asis: 7, score_tobe: 9 }],
      })

      expect(result).toEqual({ error: 'Scores insert failed' })
    })

    it('returns error when categories array is empty', async () => {
      const { saveSnapshot } = useSnapshots()
      const result = await saveSnapshot({
        wheelId: 'wheel-1',
        userId: 'user-1',
        name: 'Baseline',
        categories: [],
      })

      expect(result).toEqual({ error: 'Cannot save an empty wheel' })
      expect(mockFrom).not.toHaveBeenCalled()
    })
  })

  describe('listSnapshots', () => {
    it('returns snapshots ordered by saved_at descending (SNAP-02)', async () => {
      const snapshots = [
        { id: 'snap-2', wheel_id: 'wheel-1', user_id: 'user-1', name: 'Month 2', saved_at: '2026-02-15T00:00:00Z' },
        { id: 'snap-1', wheel_id: 'wheel-1', user_id: 'user-1', name: 'Baseline', saved_at: '2026-01-15T00:00:00Z' },
      ]
      const chain = buildChain({ data: snapshots, error: null })
      mockFrom.mockReturnValue(chain)

      const { listSnapshots } = useSnapshots()
      const result = await listSnapshots('wheel-1')

      expect(result).toEqual(snapshots)
      expect(mockFrom).toHaveBeenCalledWith('snapshots')
      expect(chain.eq).toHaveBeenCalledWith('wheel_id', 'wheel-1')
      expect(chain.order).toHaveBeenCalledWith('saved_at', { ascending: false })
    })

    it('returns empty array when no snapshots exist', async () => {
      const chain = buildChain({ data: null, error: { message: 'No data' } })
      mockFrom.mockReturnValue(chain)

      const { listSnapshots } = useSnapshots()
      const result = await listSnapshots('wheel-1')

      expect(result).toEqual([])
    })
  })

  describe('fetchSnapshotScores', () => {
    it('returns scores ordered by position ascending for a given snapshotId', async () => {
      const scores = [
        { id: 'score-1', snapshot_id: 'snap-1', user_id: 'user-1', category_name: 'Health', position: 0, score_asis: 7, score_tobe: 9 },
        { id: 'score-2', snapshot_id: 'snap-1', user_id: 'user-1', category_name: 'Career', position: 1, score_asis: 5, score_tobe: 8 },
      ]
      const chain = buildChain({ data: scores, error: null })
      mockFrom.mockReturnValue(chain)

      const { fetchSnapshotScores } = useSnapshots()
      const result = await fetchSnapshotScores('snap-1')

      expect(result).toEqual(scores)
      expect(mockFrom).toHaveBeenCalledWith('snapshot_scores')
      expect(chain.eq).toHaveBeenCalledWith('snapshot_id', 'snap-1')
      expect(chain.order).toHaveBeenCalledWith('position', { ascending: true })
    })
  })

  describe('checkSnapshotsExist', () => {
    it('returns true when at least one snapshot exists for the wheel', async () => {
      const chain = buildChain({ data: null, error: null, count: 1 })
      mockFrom.mockReturnValue(chain)

      const { checkSnapshotsExist } = useSnapshots()
      const result = await checkSnapshotsExist('wheel-1')

      expect(result).toBe(true)
      expect(mockFrom).toHaveBeenCalledWith('snapshots')
      expect(chain.eq).toHaveBeenCalledWith('wheel_id', 'wheel-1')
    })

    it('returns false when no snapshots exist for the wheel', async () => {
      const chain = buildChain({ data: null, error: null, count: 0 })
      mockFrom.mockReturnValue(chain)

      const { checkSnapshotsExist } = useSnapshots()
      const result = await checkSnapshotsExist('wheel-1')

      expect(result).toBe(false)
    })
  })
})
