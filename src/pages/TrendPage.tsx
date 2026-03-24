import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useWheel } from '@/hooks/useWheel'
import { useSnapshots } from '@/hooks/useSnapshots'
import { useActionItems } from '@/hooks/useActionItems'
import { TrendChart, type TrendChartPoint, type TrendChartMarker } from '@/components/TrendChart'
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

  const { wheel, wheels, categories, selectWheel } = useWheel(userId)
  const { listSnapshots, fetchSnapshotScores } = useSnapshots()
  const { loadActionItems } = useActionItems()

  const [snapshots, setSnapshots] = useState<SnapshotRow[]>([])
  const [allScores, setAllScores] = useState<SnapshotScoreRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [actionItemMarkers, setActionItemMarkers] = useState<TrendChartMarker[]>([])

  useEffect(() => {
    if (!wheel?.id) return

    // Clear stale data immediately — prevents old wheel's data showing while new data loads
    setSnapshots([])
    setAllScores([])
    setSelectedCategory('')

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

  useEffect(() => {
    if (!selectedCategory || snapshots.length < 3) return
    const cat = categories.find(c => c.name === selectedCategory)
    if (!cat) return
    loadActionItems(cat.id).then(items => {
      const snapshotDates = new Set(snapshots.map(s => formatDate(s.saved_at)))
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const markers: TrendChartMarker[] = []
      for (const item of items) {
        // Completed items: use completed_at date
        if (item.completed_at) {
          const d = formatDate(item.completed_at)
          if (snapshotDates.has(d)) {
            markers.push({ date: d, label: item.text, color: '#16a34a' })
          }
        }
        // Items with deadline (not complete)
        if (item.deadline && !item.is_complete) {
          const d = formatDate(item.deadline + 'T00:00:00')
          if (snapshotDates.has(d)) {
            const deadlineDate = new Date(item.deadline)
            deadlineDate.setHours(0, 0, 0, 0)
            const diff = Math.round((deadlineDate.getTime() - today.getTime()) / 86400000)
            const color = diff < 0 ? '#dc2626' : '#d97706'
            markers.push({ date: d, label: item.text, color })
          }
        }
      }
      setActionItemMarkers(markers)
    })
  }, [selectedCategory, snapshots, categories])

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
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold text-stone-800">Trend</h1>
        {wheels.length > 1 && (
          <select
            value={wheel?.id ?? ''}
            onChange={e => void selectWheel(e.target.value)}
            className="text-sm border border-stone-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-stone-400"
          >
            {wheels.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        )}
      </div>
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
          <TrendChart data={chartData} categoryName={selectedCategory} markers={actionItemMarkers} />
        </>
      )}
    </div>
  )
}
