import { useState, useEffect, useMemo, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useWheel } from '@/hooks/useWheel'
import { useCategories } from '@/hooks/useCategories'
import { useSnapshots } from '@/hooks/useSnapshots'
import { WheelChart } from '@/components/WheelChart'
import { CategorySlider } from '@/components/CategorySlider'
import { ActionItemList } from '@/components/ActionItemList'
import { CreateWheelModal } from '@/components/CreateWheelModal'
import { SnapshotWarningDialog } from '@/components/SnapshotWarningDialog'
import { DueSoonWidget, getDueSoonItems } from '@/components/DueSoonWidget'
import { AiCoachDrawer } from '@/components/AiCoachDrawer'
import { useActionItems } from '@/hooks/useActionItems'
import { usePalette, PALETTES } from '@/contexts/PaletteContext'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import type { CategoryRow } from '@/hooks/useWheel'
import type { ActionItemRow } from '@/types/database'

interface ConfirmState {
  type: 'rename' | 'remove'
  categoryId: string
  categoryName: string
  newName?: string
}

function getNextCategoryName(existing: CategoryRow[]): string {
  const names = existing.map(c => c.name)
  if (!names.some(n => /^new category/i.test(n))) return 'New category'
  const nums = names
    .map(n => { const m = n.match(/^new category\s*(\d+)$/i); return m ? parseInt(m[1], 10) : 1 })
    .filter(n => !isNaN(n))
  return `New category ${Math.max(...nums) + 1}`
}

export function WheelPage() {
  const { session } = useAuth()
  const userId = session?.user?.id ?? ''

  const {
    wheel,
    wheels,
    categories,
    setCategories,
    loading,
    error,
    canCreateWheel,
    tier,
    selectWheel,
    createWheel,
    updateScore,
    renameWheel,
    updateCategoryImportant,
    softDeleteWheel,
    undoDeleteWheel,
  } = useWheel(userId)

  const { addCategory, renameCategory, removeCategory } = useCategories()
  const { checkSnapshotsExist } = useSnapshots()

  const [localCategories, setLocalCategories] = useState<CategoryRow[]>(categories)
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)
  const [actionItemsByCategory, setActionItemsByCategory] = useState<Record<string, ActionItemRow[]>>({})
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [editingWheelName, setEditingWheelName] = useState(false)
  const [wheelNameEdit, setWheelNameEdit] = useState('')
  const skipSaveOnBlurRef = useRef(false)
  const [showCategoryUpgradePrompt, setShowCategoryUpgradePrompt] = useState(false)
  const [highlightedCategory, setHighlightedCategory] = useState<string | null>(null)
  const [nudgeCategoryId, setNudgeCategoryId] = useState<string | null>(null)
  const [nudgeDismissed, setNudgeDismissed] = useState<Set<string>>(new Set())
  const { loadActionItems, toggleActionItem, saveCompletionNote } = useActionItems()
  const [dueSoonCompletionPending, setDueSoonCompletionPending] = useState<string | null>(null)
  const [dueSoonNoteText, setDueSoonNoteText] = useState('')
  const [drawerCategoryId, setDrawerCategoryId] = useState<string | null>(null)
  const drawerOpen = drawerCategoryId !== null

  const { currentPalette } = usePalette()
  const paletteVars = PALETTES[currentPalette] ?? PALETTES.amber

  // Sync local categories from hook whenever categories change (e.g., after createWheel or selectWheel)
  useEffect(() => {
    setLocalCategories(categories)
  }, [categories])

  // Pre-fetch action item counts for all categories so the badge shows on load
  useEffect(() => {
    if (categories.length === 0) return
    void Promise.all(
      categories.map(async (cat) => {
        const items = await loadActionItems(cat.id)
        setActionItemsByCategory(prev => ({ ...prev, [cat.id]: items }))
      })
    )
  }, [categories])

  const [hasSnapshots, setHasSnapshots] = useState(false) // optimistic default — warning only shows once confirmed
  useEffect(() => {
    if (!wheel?.id) return
    checkSnapshotsExist(wheel.id).then(exists => setHasSnapshots(exists))
  }, [wheel?.id])

  const chartData = useMemo(
    () => localCategories.map(c => ({ category: c.name, asis: c.score_asis, tobe: c.score_tobe })),
    [localCategories]
  )

  const softDeletedWheels = wheels.filter(w => w.deleted_at)

  // Loading state
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
        {softDeletedWheels.length > 0 && (
          <div className="mt-6 rounded-lg border border-stone-700 p-4 w-full max-w-sm">
            <p className="text-sm font-medium text-stone-300 mb-3">Recover a wheel</p>
            {softDeletedWheels.map(w => (
              <div key={w.id} className="flex items-center justify-between py-1">
                <span className="text-sm text-stone-400">{w.name} — Deleting in ~10 min</span>
                <button
                  onClick={() => void undoDeleteWheel(w.id)}
                  className="text-xs text-brand-400 hover:text-brand-300 font-medium"
                >
                  Undo
                </button>
              </div>
            ))}
          </div>
        )}
        <CreateWheelModal
          open={modalOpen}
          showUpgradePrompt={false}
          onOpenChange={setModalOpen}
          onCreate={async (mode, name) => {
            await createWheel(mode, name, userId)
          }}
        />
      </div>
    )
  }

  function handleAsisChange(categoryId: string, value: number) {
    setLocalCategories(prev =>
      prev.map(c => c.id === categoryId ? { ...c, score_asis: value } : c)
    )
  }

  function checkGapNudge(categoryId: string, cats: CategoryRow[]) {
    if (tier !== 'premium') return
    const cat = cats.find(c => c.id === categoryId)
    if (!cat) return
    if (cat.is_important) return
    if (nudgeDismissed.has(categoryId)) return
    if (cats.filter(c => c.is_important).length >= 3) return
    if (Math.abs(cat.score_tobe - cat.score_asis) >= 3) {
      setNudgeCategoryId(categoryId)
    }
  }

  function handleAsisCommit(categoryId: string, value: number) {
    const updatedCats = localCategories.map(c => c.id === categoryId ? { ...c, score_asis: value } : c)
    setLocalCategories(updatedCats)
    updateScore(categoryId, 'score_asis', value)
    checkGapNudge(categoryId, updatedCats)
  }

  function handleTobeChange(categoryId: string, value: number) {
    setLocalCategories(prev =>
      prev.map(c => c.id === categoryId ? { ...c, score_tobe: value } : c)
    )
  }

  function handleTobeCommit(categoryId: string, value: number) {
    const updatedCats = localCategories.map(c => c.id === categoryId ? { ...c, score_tobe: value } : c)
    setLocalCategories(updatedCats)
    updateScore(categoryId, 'score_tobe', value)
    checkGapNudge(categoryId, updatedCats)
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
    if (!wheel) return
    const maxCategories = tier === 'premium' ? 12 : 8
    if (localCategories.length >= maxCategories) {
      setShowCategoryUpgradePrompt(true)
      return
    }
    const maxPosition = localCategories.reduce((max, c) => Math.max(max, c.position), -1)
    const result = await addCategory({
      wheelId: wheel.id,
      userId,
      name: getNextCategoryName(localCategories),
      currentCount: localCategories.length,
      currentMaxPosition: maxPosition,
    })
    if ('error' in result) return
    setCategories(prev => [...prev, result])
  }

  function handleDueSoonMarkComplete(itemId: string) {
    for (const [catId, items] of Object.entries(actionItemsByCategory)) {
      const item = items.find(i => i.id === itemId)
      if (item) {
        const now = new Date().toISOString()
        setActionItemsByCategory(prev => ({
          ...prev,
          [catId]: items.map(i => i.id === itemId ? { ...i, is_complete: true, completed_at: now } : i),
        }))
        void toggleActionItem({ id: itemId, isComplete: true })
        setDueSoonCompletionPending(itemId)
        return
      }
    }
  }

  async function handleDueSoonSaveNote() {
    if (!dueSoonCompletionPending) return
    const savedId = dueSoonCompletionPending
    const savedNote = dueSoonNoteText
    setDueSoonCompletionPending(null)
    setDueSoonNoteText('')
    await saveCompletionNote({ id: savedId, note: savedNote })
    setActionItemsByCategory(prev => {
      const next = { ...prev }
      for (const catId of Object.keys(next)) {
        next[catId] = next[catId].map(i => i.id === savedId ? { ...i, note: savedNote } : i)
      }
      return next
    })
  }

  async function handleCreateWheel(mode: 'template' | 'blank', name: string) {
    await createWheel(mode, name, userId)
  }

  async function handleExpandCategory(categoryId: string) {
    const isCurrentlyExpanded = expandedCategories.has(categoryId)
    if (isCurrentlyExpanded) {
      setExpandedCategories(prev => {
        const s = new Set(prev)
        s.delete(categoryId)
        return s
      })
      return
    }
    // Lazy load: only fetch if not already loaded for this category
    if (!actionItemsByCategory[categoryId]) {
      const items = await loadActionItems(categoryId)
      setActionItemsByCategory(prev => ({ ...prev, [categoryId]: items }))
    }
    setExpandedCategories(prev => new Set(prev).add(categoryId))
  }

  function handleActionItemsChange(categoryId: string, items: ActionItemRow[]) {
    setActionItemsByCategory(prev => ({ ...prev, [categoryId]: items }))
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
    void categoryName
  }

  return (
    <div className="p-6">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Wheel switcher */}
          {wheels.length > 1 && !editingWheelName && (
            <select
              value={wheel.id}
              onChange={e => selectWheel(e.target.value)}
              className="text-xl font-semibold text-stone-800 bg-transparent border-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-stone-300 rounded px-1"
            >
              {wheels.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          )}
          {editingWheelName ? (
            <input
              className="text-xl font-semibold text-stone-800 border border-stone-300 rounded px-1 focus:outline-none"
              value={wheelNameEdit}
              autoFocus
              onChange={e => setWheelNameEdit(e.target.value)}
              onBlur={() => {
                if (skipSaveOnBlurRef.current) {
                  skipSaveOnBlurRef.current = false
                  setEditingWheelName(false)
                  return
                }
                if (wheelNameEdit.trim()) void renameWheel(wheel.id, wheelNameEdit)
                setEditingWheelName(false)
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  if (wheelNameEdit.trim()) void renameWheel(wheel.id, wheelNameEdit)
                  setEditingWheelName(false)
                }
                if (e.key === 'Escape') {
                  skipSaveOnBlurRef.current = true
                  setEditingWheelName(false)
                }
              }}
              aria-label="Rename wheel"
            />
          ) : wheels.length === 1 ? (
            <h2
              className="text-xl font-semibold text-stone-800 cursor-pointer hover:underline"
              onClick={() => { setWheelNameEdit(wheel.name); setEditingWheelName(true) }}
            >
              {wheel.name}
            </h2>
          ) : (
            <button
              type="button"
              aria-label="Rename wheel"
              onClick={() => { setWheelNameEdit(wheel.name); setEditingWheelName(true) }}
              className="text-stone-400 hover:text-stone-600"
            >
              ✎
            </button>
          )}
          {!editingWheelName && (
            <button
              onClick={() => void softDeleteWheel(wheel.id)}
              className="ml-2 text-xs text-stone-400 hover:text-red-400 transition-colors"
              aria-label="Delete this wheel"
            >
              Delete wheel
            </button>
          )}
        </div>
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
            + New wheel
          </button>
        </div>
      </div>

      {softDeletedWheels.length > 0 && (
        <div className="mb-4 rounded-lg border border-red-900/40 bg-red-950/20 px-4 py-3 space-y-1">
          <p className="text-xs text-red-400 font-medium">Pending deletion</p>
          {softDeletedWheels.map(w => (
            <div key={w.id} className="flex items-center justify-between">
              <span className="text-sm text-stone-400">
                {w.name} — Deleting in ~10 min
              </span>
              <button
                onClick={() => void undoDeleteWheel(w.id)}
                className="text-xs text-brand-400 hover:text-brand-300 font-medium"
              >
                Undo
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Two-column layout: chart left, sliders right */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Chart */}
        <div className="flex-1 min-w-0">
          <WheelChart
            data={chartData}
            highlightedCategory={highlightedCategory ?? undefined}
            importantCategories={localCategories.filter(c => c.is_important).map(c => c.name)}
            primaryColor={paletteVars['--palette-primary']}
            secondaryColor={paletteVars['--palette-secondary']}
            importantColor={paletteVars['--palette-important']}
            highlightColor={paletteVars['--palette-highlight']}
          />
          <DueSoonWidget
            items={getDueSoonItems(actionItemsByCategory, localCategories)}
            highlightedCategory={highlightedCategory}
            onHighlight={setHighlightedCategory}
            onMarkComplete={handleDueSoonMarkComplete}
          />
        </div>

        {/* Category sliders */}
        <div className="flex-1 min-w-0 overflow-y-auto max-h-[500px]">
          {tier === 'premium' && (
            <p className="text-xs text-stone-500 mb-2">
              Priority categories: {localCategories.filter(c => c.is_important).length} of 3 set
            </p>
          )}
          {localCategories.map(cat => (
            <div key={cat.id}>
              <CategorySlider
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
                isExpanded={expandedCategories.has(cat.id)}
                onExpandToggle={() => { void handleExpandCategory(cat.id) }}
                actionItemCount={actionItemsByCategory[cat.id]?.filter(i => !i.is_complete).length}
                isImportant={cat.is_important}
                onToggleImportant={() => void updateCategoryImportant(cat.id, !cat.is_important)}
                userTier={tier}
                importantCount={localCategories.filter(c => c.is_important).length}
                onAiCoach={() => setDrawerCategoryId(cat.id)}
                isPremiumForAi={tier === 'premium'}
              />
              {expandedCategories.has(cat.id) && (
                <ActionItemList
                  categoryId={cat.id}
                  userId={wheel?.user_id ?? ''}
                  items={actionItemsByCategory[cat.id] ?? []}
                  onItemsChange={(items) => handleActionItemsChange(cat.id, items)}
                />
              )}
            </div>
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

      {/* Category upgrade prompt */}
      <Dialog open={showCategoryUpgradePrompt} onOpenChange={setShowCategoryUpgradePrompt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade to add more categories</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-stone-600">Free accounts support up to 8 categories. Upgrade to premium for up to 12.</p>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setShowCategoryUpgradePrompt(false)}
              className="px-4 py-2 text-sm border border-stone-300 rounded hover:bg-stone-50"
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auto-prompt nudge for big score gaps */}
      <Dialog open={nudgeCategoryId !== null} onOpenChange={(open) => { if (!open) setNudgeCategoryId(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Big gap detected</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-stone-600">
            This area has a big gap between where you are and where you want to be. Mark it as a priority category?
          </p>
          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={() => {
                if (nudgeCategoryId && localCategories.filter(c => c.is_important).length < 3) {
                  void updateCategoryImportant(nudgeCategoryId, true)
                }
                setNudgeCategoryId(null)
              }}
              className="px-4 py-2 text-sm bg-stone-800 text-white rounded hover:bg-stone-700"
            >
              Mark as important
            </button>
            <button
              type="button"
              onClick={() => {
                if (nudgeCategoryId) {
                  setNudgeDismissed(prev => new Set([...prev, nudgeCategoryId]))
                }
                setNudgeCategoryId(null)
              }}
              className="px-4 py-2 text-sm border border-stone-300 rounded hover:bg-stone-50"
            >
              Dismiss
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Coach drawer */}
      {drawerOpen && drawerCategoryId !== null && (() => {
        const selectedCat = localCategories.find(c => c.id === drawerCategoryId)
        if (!selectedCat) return null
        return (
          <AiCoachDrawer
            categoryId={selectedCat.id}
            categoryName={selectedCat.name}
            asisScore={selectedCat.score_asis}
            tobeScore={selectedCat.score_tobe}
            onApplyAsis={(v) => handleAsisCommit(selectedCat.id, v)}
            onApplyTobe={(v) => handleTobeCommit(selectedCat.id, v)}
            onClose={() => setDrawerCategoryId(null)}
          />
        )
      })()}

      {/* Due Soon mark-complete note modal */}
      <Dialog
        open={dueSoonCompletionPending !== null}
        onOpenChange={(open) => { if (!open) { setDueSoonCompletionPending(null); setDueSoonNoteText('') } }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Great work!</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label htmlFor="due-soon-note" className="text-sm text-stone-600">
              Note for your future self and reflection (optional)
            </label>
            <textarea
              id="due-soon-note"
              value={dueSoonNoteText}
              onChange={(e) => setDueSoonNoteText(e.target.value)}
              maxLength={500}
              placeholder="Add a note to yourself…"
              className="w-full text-sm border border-stone-200 rounded p-2 focus:outline-none focus:border-stone-400 resize-none"
              rows={3}
            />
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => { setDueSoonCompletionPending(null); setDueSoonNoteText('') }}
              className="px-4 py-2 text-sm text-stone-500 hover:text-stone-700"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={() => void handleDueSoonSaveNote()}
              className="px-4 py-2 text-sm bg-brand-400 text-white rounded hover:bg-brand-500"
            >
              Save note
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
