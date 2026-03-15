import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useWheel } from '@/hooks/useWheel'
import { useSnapshots } from '@/hooks/useSnapshots'
import { TrendChart, type TrendChartPoint } from '@/components/TrendChart'
import type { SnapshotRow, SnapshotScoreRow } from '@/types/database'

function formatDate(savedAt: string): string {
  return new Date(savedAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function TrendPage() {
  const { session } = useAuth()
  const userId = session?.user?.id ?? ''

  const { wheel } = useWheel(userId)
  const { listSnapshots, fetchSnapshotScores } = useSnapshots()

  const [snapshots, setSnapshots] = useState<SnapshotRow[]>([])
  const [allScores, setAllScores] = useState<SnapshotScoreRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('')

  useEffect(() => {
    if (!wheel?.id) return

    let cancelled = false

    async function load() {
      setLoading(true)
      const rows = await listSnapshots(wheel!.id)
      if (cancelled) return

      // listSnapshots returns DESC — reverse for ASC (oldest first)
      const asc = [...rows].reverse()
      setSnapshots(asc)

      if (rows.length > 0) {
        const allScoreArrays = await Promise.all(
          rows.map(s => fetchSnapshotScores(s.id))
        )
        if (!cancelled) {
          const flat = allScoreArrays.flat()
          setAllScores(flat)

          const cats = [...new Set(flat.map(s => s.category_name))].sort()
          if (cats.length > 0) setSelectedCategory(cats[0])
        }
      }

      if (!cancelled) setLoading(false)
    }

    void load()
    return () => { cancelled = true }
  }, [wheel?.id])

  const categoryNames = [...new Set(allScores.map(s => s.category_name))].sort()

  const chartData: TrendChartPoint[] = snapshots
    .map(snap => {
      const score = allScores.find(
        s => s.snapshot_id === snap.id && s.category_name === selectedCategory
      )
      if (!score) return null
      return {
        date: formatDate(snap.saved_at),
        asis: score.score_asis,
        tobe: score.score_tobe,
      }
    })
    .filter((point): point is NonNullable<typeof point> => point !== null)

  const hasEnoughSnapshots = snapshots.length >= 3

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-stone-800">Trend</h1>
      {loading ? (
        <p className="text-stone-500">Loading...</p>
      ) : !hasEnoughSnapshots ? (
        <div className="rounded-lg border border-stone-200 p-8 text-center space-y-2">
          <p className="text-stone-600 font-medium">Not enough snapshots yet</p>
          <p className="text-stone-400 text-sm">
            Save at least 3 snapshots to see how your scores have changed over time.
            You have {snapshots.length} so far.
          </p>
        </div>
      ) : (
        <>
          {categoryNames.length > 0 && (
            <div className="flex items-center gap-3">
              <label htmlFor="trend-category" className="text-sm text-stone-600">Category:</label>
              <select
                id="trend-category"
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="text-sm border border-stone-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-stone-400"
              >
                {categoryNames.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          )}
          <TrendChart data={chartData} categoryName={selectedCategory} />
        </>
      )}
    </div>
  )
}
