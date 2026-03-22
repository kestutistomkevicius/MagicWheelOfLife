import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useWheel } from '@/hooks/useWheel'
import { useSnapshots } from '@/hooks/useSnapshots'
import { ComparisonChart } from '@/components/ComparisonChart'
import { SnapshotNameDialog } from '@/components/SnapshotNameDialog'
import { Button } from '@/components/ui/button'
import type { SnapshotRow, SnapshotScoreRow } from '@/types/database'
import { supabase } from '@/lib/supabase'

function formatDate(savedAt: string): string {
  return new Date(savedAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function SnapshotsPage() {
  const { session } = useAuth()
  const userId = session?.user?.id ?? ''

  const { wheel, wheels, categories, selectWheel } = useWheel(userId)
  const { listSnapshots, saveSnapshot, fetchSnapshotScores } = useSnapshots()

  const [snapshots, setSnapshots] = useState<SnapshotRow[]>([])
  const [loading, setLoading] = useState(true)

  // Two-snapshot comparison selection
  const [selectedSnapIds, setSelectedSnapIds] = useState<Set<string>>(new Set())
  const [scoresCache, setScoresCache] = useState<Record<string, SnapshotScoreRow[]>>({})

  // Score history table state
  const [allHistoryScores, setAllHistoryScores] = useState<SnapshotScoreRow[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')

  // Delete confirmation
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Load snapshots on mount (when wheel.id is available)
  useEffect(() => {
    if (!wheel?.id) return

    let cancelled = false

    async function load() {
      setLoading(true)
      const rows = await listSnapshots(wheel!.id)
      if (cancelled) return

      // listSnapshots returns DESC — reverse for chronological (oldest first) display
      const chronological = [...rows].reverse()
      setSnapshots(chronological)
      setLoading(false)

      // Batch-load all snapshot scores for history table
      if (rows.length > 0) {
        const allScoreArrays = await Promise.all(
          rows.map(s => fetchSnapshotScores(s.id))
        )
        if (!cancelled) {
          const flat = allScoreArrays.flat()
          setAllHistoryScores(flat)

          // Derive unique category names for the select; pick first as default
          const cats = [...new Set(flat.map(s => s.category_name))].sort()
          if (cats.length > 0) setSelectedCategory(cats[0])
        }
      }
    }

    void load()
    return () => { cancelled = true }
  }, [wheel?.id])

  // Derive unique categories from history scores
  const categoryNames = [...new Set(allHistoryScores.map(s => s.category_name))].sort()

  // Filter history rows for selected category, ordered by saved_at ASC (chronological order matches snapshots array)
  const historyRows = snapshots.map(snap => {
    const score = allHistoryScores.find(
      s => s.snapshot_id === snap.id && s.category_name === selectedCategory
    )
    return { snap, score }
  }).filter(r => r.score !== undefined)

  // Snapshot selection toggle
  function toggleSnapshot(id: string) {
    setSelectedSnapIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (next.size < 2) {
        next.add(id)
      }
      return next
    })

    // Lazy-fetch scores for comparison when selected
    if (!scoresCache[id]) {
      void fetchSnapshotScores(id).then(scores => {
        setScoresCache(prev => ({ ...prev, [id]: scores }))
      })
    }
  }

  // Get comparison data when 2 snapshots selected
  const selectedIds = [...selectedSnapIds]
  const snap1 = selectedIds[0] ? snapshots.find(s => s.id === selectedIds[0]) : undefined
  const snap2 = selectedIds[1] ? snapshots.find(s => s.id === selectedIds[1]) : undefined
  const snap1Scores = selectedIds[0] ? (scoresCache[selectedIds[0]] ?? []) : []
  const snap2Scores = selectedIds[1] ? (scoresCache[selectedIds[1]] ?? []) : []

  async function handleSaveSnapshot(name: string) {
    if (!wheel) return
    setIsSaving(true)
    const snapshotCategories = categories.map(c => ({
      name: c.name,
      position: c.position,
      score_asis: c.score_asis,
      score_tobe: c.score_tobe,
    }))
    const result = await saveSnapshot({ wheelId: wheel.id, userId, name, categories: snapshotCategories })
    setIsSaving(false)
    setDialogOpen(false)

    if (!('error' in result)) {
      // Refresh snapshots list
      const rows = await listSnapshots(wheel.id)
      const chronological = [...rows].reverse()
      setSnapshots(chronological)

      // Refresh history scores
      const allScoreArrays = await Promise.all(rows.map(s => fetchSnapshotScores(s.id)))
      const flat = allScoreArrays.flat()
      setAllHistoryScores(flat)

      if (categoryNames.length === 0) {
        const cats = [...new Set(flat.map(s => s.category_name))].sort()
        if (cats.length > 0) setSelectedCategory(cats[0])
      }
    }
  }

  async function deleteSnapshot(snapId: string): Promise<void> {
    // Optimistic local removal
    setSnapshots(prev => prev.filter(s => s.id !== snapId))
    setSelectedSnapIds(prev => {
      const next = new Set(prev)
      next.delete(snapId)
      return next
    })
    setScoresCache(prev => {
      const next = { ...prev }
      delete next[snapId]
      return next
    })
    setAllHistoryScores(prev => prev.filter(s => s.snapshot_id !== snapId))
    setPendingDeleteId(null)
    // Persist deletion
    await supabase
      .from('snapshots')
      .delete()
      .eq('id', snapId)
      .eq('user_id', userId)
  }

  if (loading && !snapshots.length) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-center h-32">
          <div
            role="status"
            aria-label="Loading"
            className="w-8 h-8 border-4 border-stone-300 border-t-stone-600 rounded-full animate-spin"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-stone-800">Snapshots</h1>
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
        <Button onClick={() => setDialogOpen(true)} disabled={!wheel}>
          Save snapshot
        </Button>
      </div>

      {/* Snapshot list */}
      {snapshots.length === 0 ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-brand-200 bg-brand-50 p-4 text-sm">
            <p className="font-medium text-brand-800">What is a snapshot?</p>
            <p className="mt-1 text-stone-600">
              A snapshot is a saved copy of your current wheel scores. Take one now to
              capture where you stand today — you'll be able to compare it with future
              snapshots to see how you've grown over time.
            </p>
          </div>
          <div className="rounded-lg border border-stone-200 p-8 text-center text-stone-500">
            <p>No snapshots yet. Save your first snapshot to get started.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {snapshots.length === 1 && (
            <p className="text-sm text-stone-500 mb-3">
              Save at least one more snapshot to compare.
            </p>
          )}
          <div className="rounded-lg border border-stone-200 divide-y divide-stone-100">
            {snapshots.map(snap => {
              const isChecked = selectedSnapIds.has(snap.id)
              const isDisabled = !isChecked && selectedSnapIds.size >= 2
              return (
                <label
                  key={snap.id}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-stone-50"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={isDisabled}
                    onChange={() => toggleSnapshot(snap.id)}
                    className="w-4 h-4 rounded border-stone-300 text-stone-800 focus:ring-stone-500"
                  />
                  <span className="flex-1 text-stone-800 font-medium">{snap.name}</span>
                  <span className="text-stone-400 text-sm">{formatDate(snap.saved_at)}</span>
                  {pendingDeleteId === snap.id ? (
                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        onClick={() => void deleteSnapshot(snap.id)}
                        className="text-xs text-red-400 hover:text-red-300 font-medium"
                      >
                        Confirm delete
                      </button>
                      <button
                        onClick={() => setPendingDeleteId(null)}
                        className="text-xs text-stone-400 hover:text-stone-300"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setPendingDeleteId(snap.id)}
                      className="ml-auto text-xs text-stone-500 hover:text-red-400 transition-colors"
                      aria-label={`Delete snapshot ${snap.name}`}
                    >
                      Delete
                    </button>
                  )}
                </label>
              )
            })}
          </div>
        </div>
      )}

      {/* Comparison chart — only when exactly 2 selected */}
      {selectedSnapIds.size === 2 && snap1 && snap2 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-stone-800">Comparison</h2>
          <ComparisonChart
            snap1Scores={snap1Scores}
            snap2Scores={snap2Scores}
            snap1Label={`${snap1.name} — ${formatDate(snap1.saved_at)}`}
            snap2Label={`${snap2.name} — ${formatDate(snap2.saved_at)}`}
          />
        </div>
      )}

      {/* Score history table — only when at least 1 snapshot exists */}
      {snapshots.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-stone-800">Score History</h2>
          <div className="flex items-center gap-3">
            <label htmlFor="history-category" className="text-sm text-stone-600">
              Category:
            </label>
            <select
              id="history-category"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="text-sm border border-stone-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-stone-400"
            >
              {categoryNames.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-stone-200 rounded-lg">
              <thead>
                <tr className="bg-stone-50 text-stone-600">
                  <th className="text-left px-4 py-2 font-medium">Snapshot</th>
                  <th className="text-left px-4 py-2 font-medium">Date</th>
                  <th className="text-center px-4 py-2 font-medium">As-Is</th>
                  <th className="text-center px-4 py-2 font-medium">To-Be</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {historyRows.map(({ snap, score }) => (
                  <tr key={snap.id} className="hover:bg-stone-50">
                    <td className="px-4 py-2 text-stone-800">{snap.name}</td>
                    <td className="px-4 py-2 text-stone-500">{formatDate(snap.saved_at)}</td>
                    <td className="px-4 py-2 text-center text-stone-800">{score?.score_asis ?? '—'}</td>
                    <td className="px-4 py-2 text-center text-stone-800">{score?.score_tobe ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <SnapshotNameDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSaveSnapshot}
        isSaving={isSaving}
      />
    </div>
  )
}
