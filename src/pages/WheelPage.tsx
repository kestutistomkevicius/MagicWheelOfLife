import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useWheel } from '@/hooks/useWheel'
import { useCategories } from '@/hooks/useCategories'
import { WheelChart } from '@/components/WheelChart'
import { CategorySlider } from '@/components/CategorySlider'
import { CreateWheelModal } from '@/components/CreateWheelModal'
import { SnapshotWarningDialog } from '@/components/SnapshotWarningDialog'
import type { CategoryRow } from '@/hooks/useWheel'

interface ConfirmState {
  type: 'rename' | 'remove'
  categoryId: string
  categoryName: string
  newName?: string
}

export function WheelPage() {
  const { session } = useAuth()
  const userId = session?.user?.id ?? ''

  const {
    wheel,
    categories,
    setCategories,
    loading,
    error,
    canCreateWheel,
    createWheel,
    updateScore,
  } = useWheel(userId)

  const { addCategory, renameCategory, removeCategory } = useCategories()

  const [localCategories, setLocalCategories] = useState<CategoryRow[]>(categories)
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)

  // Sync local categories from hook whenever categories change (e.g., after createWheel)
  useEffect(() => {
    setLocalCategories(categories)
  }, [categories])

  const chartData = useMemo(
    () => localCategories.map(c => ({ category: c.name, asis: c.score_asis, tobe: c.score_tobe })),
    [localCategories]
  )

  // Loading state: wheel is undefined (still resolving) OR loading flag is true
  if (loading || wheel === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          role="status"
          aria-label="Loading"
          className="w-8 h-8 border-4 border-stone-300 border-t-stone-600 rounded-full animate-spin"
        />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <p className="text-stone-500">{error}</p>
      </div>
    )
  }

  // Empty state: no wheel exists
  if (wheel === null) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-stone-600">You haven&apos;t created a wheel yet.</p>
        <button
          className="px-4 py-2 bg-stone-800 text-white rounded hover:bg-stone-700"
          onClick={() => setModalOpen(true)}
        >
          Create my wheel
        </button>
        <CreateWheelModal
          open={modalOpen}
          showUpgradePrompt={false}
          onOpenChange={setModalOpen}
          onCreate={async (mode) => {
            await createWheel(mode, userId)
          }}
        />
      </div>
    )
  }

  // Category management helpers
  const hasSnapshots = false // Phase 2: snapshots table does not exist yet

  function handleAsisChange(categoryId: string, value: number) {
    setLocalCategories(prev =>
      prev.map(c => c.id === categoryId ? { ...c, score_asis: value } : c)
    )
  }

  function handleAsisCommit(categoryId: string, value: number) {
    updateScore(categoryId, 'score_asis', value)
  }

  function handleTobeChange(categoryId: string, value: number) {
    setLocalCategories(prev =>
      prev.map(c => c.id === categoryId ? { ...c, score_tobe: value } : c)
    )
  }

  function handleTobeCommit(categoryId: string, value: number) {
    updateScore(categoryId, 'score_tobe', value)
  }

  async function handleRename(categoryId: string, categoryName: string, newName: string) {
    await renameCategory({
      categoryId,
      newName,
      hasSnapshots,
      onSnapshotWarning: () =>
        setConfirmState({ type: 'rename', categoryId, categoryName, newName }),
    })
    if (!hasSnapshots) {
      setCategories(prev => prev.map(c => c.id === categoryId ? { ...c, name: newName } : c))
    }
  }

  async function handleRemove(categoryId: string, categoryName: string) {
    const result = await removeCategory({
      categoryId,
      currentCount: localCategories.length,
      hasSnapshots,
      onSnapshotWarning: () =>
        setConfirmState({ type: 'remove', categoryId, categoryName }),
    })
    if (!hasSnapshots && !result) {
      setCategories(prev => prev.filter(c => c.id !== categoryId))
    }
  }

  async function handleAddCategory() {
    if (!wheel || localCategories.length >= 12) return
    const maxPosition = localCategories.reduce((max, c) => Math.max(max, c.position), -1)
    const result = await addCategory({
      wheelId: wheel.id,
      userId,
      name: 'New Category',
      currentCount: localCategories.length,
      currentMaxPosition: maxPosition,
    })
    if ('error' in result) return
    setCategories(prev => [...prev, result])
  }

  async function handleCreateWheel(mode: 'template' | 'blank') {
    await createWheel(mode, userId)
  }

  function handleConfirmAction() {
    if (!confirmState) return
    const { type, categoryId, categoryName, newName } = confirmState

    if (type === 'rename' && newName) {
      renameCategory({
        categoryId,
        newName,
        hasSnapshots: false,
        onSnapshotWarning: () => {},
      }).then(() => {
        setCategories(prev => prev.map(c => c.id === categoryId ? { ...c, name: newName } : c))
      })
    } else if (type === 'remove') {
      removeCategory({
        categoryId,
        currentCount: localCategories.length,
        hasSnapshots: false,
        onSnapshotWarning: () => {},
      }).then(() => {
        setCategories(prev => prev.filter(c => c.id !== categoryId))
      })
    }

    setConfirmState(null)
    // suppress unused variable warning
    void categoryName
  }

  return (
    <div className="p-6">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-stone-800">{wheel.name}</h2>
        <div className="flex gap-2">
          <button
            className="px-3 py-1.5 text-sm border border-stone-300 rounded hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={localCategories.length >= 12}
            onClick={handleAddCategory}
          >
            + Add category
          </button>
          <button
            className="px-3 py-1.5 text-sm bg-stone-800 text-white rounded hover:bg-stone-700"
            onClick={() => setModalOpen(true)}
          >
            Create new wheel
          </button>
        </div>
      </div>

      {/* Two-column layout: chart left, sliders right */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Chart */}
        <div className="flex-1 min-w-0">
          <WheelChart data={chartData} />
        </div>

        {/* Category sliders */}
        <div className="flex-1 min-w-0 overflow-y-auto max-h-[500px]">
          {localCategories.map(cat => (
            <CategorySlider
              key={cat.id}
              categoryName={cat.name}
              asisValue={cat.score_asis}
              tobeValue={cat.score_tobe}
              onAsisChange={(v) => handleAsisChange(cat.id, v)}
              onAsisCommit={(v) => handleAsisCommit(cat.id, v)}
              onTobeChange={(v) => handleTobeChange(cat.id, v)}
              onTobeCommit={(v) => handleTobeCommit(cat.id, v)}
              onRename={(newName) => handleRename(cat.id, cat.name, newName)}
              onRemove={() => handleRemove(cat.id, cat.name)}
              removeDisabled={localCategories.length <= 3}
            />
          ))}
        </div>
      </div>

      {/* Create wheel modal */}
      <CreateWheelModal
        open={modalOpen}
        showUpgradePrompt={!canCreateWheel}
        onOpenChange={setModalOpen}
        onCreate={handleCreateWheel}
      />

      {/* Snapshot warning dialog */}
      <SnapshotWarningDialog
        open={confirmState !== null}
        action={confirmState?.type ?? 'rename'}
        categoryName={confirmState?.categoryName ?? ''}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmState(null)}
      />
    </div>
  )
}
