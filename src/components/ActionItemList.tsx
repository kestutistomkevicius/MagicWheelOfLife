// src/components/ActionItemList.tsx
import { useState, useRef } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useActionItems } from '@/hooks/useActionItems'
import { cn } from '@/lib/utils'
import type { ActionItemRow } from '@/types/database'

interface ActionItemListProps {
  categoryId: string
  userId: string
  items: ActionItemRow[]
  onItemsChange: (items: ActionItemRow[]) => void
}

export function ActionItemList({
  categoryId,
  userId,
  items,
  onItemsChange,
}: ActionItemListProps) {
  const [newText, setNewText] = useState('')
  const [adding, setAdding] = useState(false)
  const [celebrating, setCelebrating] = useState<string | null>(null)
  const celebrateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const modalTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [completionPending, setCompletionPending] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const [completedExpanded, setCompletedExpanded] = useState(false)

  const { addActionItem, toggleActionItem, setDeadline, deleteActionItem, saveCompletionNote, reopenActionItem } =
    useActionItems()

  const activeItems = items.filter((i) => !i.is_complete)
  const completedItems = items.filter((i) => i.is_complete)

  async function handleAdd() {
    if (!newText.trim()) return
    const result = await addActionItem({
      categoryId,
      userId,
      text: newText.trim(),
      currentCount: activeItems.length,
    })
    if (!('error' in result)) {
      onItemsChange([...items, result])
      setNewText('')
      setAdding(false)
    }
  }

  async function handleToggle(id: string, currentValue: boolean) {
    if (!currentValue) {
      // Completing an item: animate first, then open modal, then move to completed
      if (celebrateTimeoutRef.current) clearTimeout(celebrateTimeoutRef.current)
      if (modalTimeoutRef.current) clearTimeout(modalTimeoutRef.current)

      setCelebrating(id)

      // Open modal partway through animation so user sees the flash first
      modalTimeoutRef.current = setTimeout(() => setCompletionPending(id), 500)

      // Move item to completed list after animation finishes
      celebrateTimeoutRef.current = setTimeout(() => {
        setCelebrating(null)
        onItemsChange(
          items.map((i) =>
            i.id === id ? { ...i, is_complete: true, completed_at: new Date().toISOString() } : i
          )
        )
      }, 800)

      await toggleActionItem({ id, isComplete: true })
    } else {
      // Un-completing: no modal, just toggle
      const toggled = items.map((item) =>
        item.id === id ? { ...item, is_complete: false } : item
      )
      onItemsChange(toggled)
      await toggleActionItem({ id, isComplete: false })
    }
  }

  async function handleDelete(id: string) {
    onItemsChange(items.filter((item) => item.id !== id))
    await deleteActionItem(id)
  }

  async function handleDeadlineChange(id: string, value: string) {
    const deadline = value === '' ? null : value
    const updated = items.map((item) =>
      item.id === id ? { ...item, deadline } : item
    )
    onItemsChange(updated)
    await setDeadline({ id, deadline })
  }

  async function handleSaveNote() {
    if (!completionPending) return
    await saveCompletionNote({ id: completionPending, note: noteText })
    setCompletionPending(null)
    setNoteText('')
  }

  function handleSkip() {
    setCompletionPending(null)
    setNoteText('')
  }

  async function handleReopen(id: string) {
    onItemsChange(items.map((i) => i.id === id ? { ...i, is_complete: false, completed_at: null, note: null } : i))
    await reopenActionItem(id)
  }

  return (
    <div className="mt-2 space-y-1 pl-1 pr-4">
      {activeItems.map((item) => (
        <div
          key={item.id}
          className={cn(
            'flex items-start gap-2 py-1 rounded transition-colors',
            celebrating === item.id && 'animate-celebrate-row'
          )}
        >
          <Checkbox
            id={`check-${item.id}`}
            checked={item.is_complete}
            onCheckedChange={(_checked) => {
              void handleToggle(item.id, item.is_complete)
            }}
            aria-label={`Mark "${item.text}" as complete`}
          />
          <label
            htmlFor={`check-${item.id}`}
            className="flex-1 text-sm cursor-pointer text-stone-700"
          >
            {item.text}
          </label>
          <input
            type="date"
            value={item.deadline ?? ''}
            onChange={(e) => void handleDeadlineChange(item.id, e.target.value)}
            className="text-xs text-stone-500 border-b border-stone-200 bg-transparent focus:outline-none"
          />
          <button
            type="button"
            onClick={() => void handleDelete(item.id)}
            aria-label={`Delete "${item.text}"`}
            className="text-sm text-stone-400 hover:text-red-400 shrink-0 leading-none"
          >
            &times;
          </button>
        </div>
      ))}

      {adding && (
        <div className="flex items-center gap-2 py-1">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleAdd()
              if (e.key === 'Escape') {
                setAdding(false)
                setNewText('')
              }
            }}
            placeholder="Describe action item…"
            autoFocus
            className="flex-1 text-sm border-b border-stone-300 bg-transparent focus:outline-none"
          />
        </div>
      )}

      {activeItems.length < 7 && (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="text-xs text-stone-400 hover:text-stone-600"
        >
          + Add action item
        </button>
      )}

      {completedItems.length > 0 && (
        <div className="mt-3">
          <button
            type="button"
            className="text-xs text-stone-400 hover:text-stone-600 flex items-center gap-1"
            onClick={() => setCompletedExpanded((prev) => !prev)}
            aria-expanded={completedExpanded}
          >
            {completedItems.length} completed {completedExpanded ? '▲' : '▼'}
          </button>
          {completedExpanded && (
            <table className="mt-2 w-full text-xs text-stone-600">
              <thead>
                <tr className="text-left text-stone-400">
                  <th className="pb-1 font-normal">Task</th>
                  <th className="pb-1 font-normal">Completed</th>
                  <th className="pb-1 font-normal">Note</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {completedItems.map((item) => (
                  <tr key={item.id} className="border-t border-stone-100">
                    <td className="py-1 pr-2 text-stone-400 line-through">{item.text}</td>
                    <td className="py-1 pr-2 whitespace-nowrap">
                      {item.completed_at
                        ? new Date(item.completed_at).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td className="py-1 pr-2">{item.note ?? '—'}</td>
                    <td className="py-1">
                      <button
                        type="button"
                        onClick={() => void handleReopen(item.id)}
                        className="text-stone-400 hover:text-stone-600"
                        aria-label={`Reopen "${item.text}"`}
                      >
                        Reopen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <Dialog
        open={completionPending !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCompletionPending(null)
            setNoteText('')
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Great work!</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label htmlFor="completion-note" className="text-sm text-stone-600">
              Note (optional)
            </label>
            <textarea
              id="completion-note"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              maxLength={500}
              placeholder="Add a note to yourself…"
              className="w-full text-sm border border-stone-200 rounded p-2 focus:outline-none focus:border-stone-400 resize-none"
              rows={3}
              aria-label="Note"
            />
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={handleSkip}
              className="px-4 py-2 text-sm text-stone-500 hover:text-stone-700"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={() => void handleSaveNote()}
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
