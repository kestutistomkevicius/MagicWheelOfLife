// src/components/ActionItemList.tsx
import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { useActionItems } from '@/hooks/useActionItems'
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
  const { addActionItem, toggleActionItem, setDeadline, deleteActionItem } =
    useActionItems()

  async function handleAdd() {
    if (!newText.trim()) return
    const result = await addActionItem({
      categoryId,
      userId,
      text: newText.trim(),
      currentCount: items.length,
    })
    if (!('error' in result)) {
      onItemsChange([...items, result])
      setNewText('')
      setAdding(false)
    }
  }

  async function handleToggle(id: string, currentValue: boolean) {
    const toggled = items.map((item) =>
      item.id === id ? { ...item, is_complete: !currentValue } : item
    )
    onItemsChange(toggled)
    await toggleActionItem({ id, isComplete: !currentValue })
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

  return (
    <div className="mt-2 space-y-1 pl-1">
      {items.map((item) => (
        <div key={item.id} className="flex items-start gap-2 py-1">
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
            className={
              item.is_complete
                ? 'flex-1 text-sm cursor-pointer line-through text-stone-400'
                : 'flex-1 text-sm cursor-pointer text-stone-700'
            }
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
            className="text-xs text-stone-300 hover:text-red-400 shrink-0"
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

      {items.length < 7 && (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="text-xs text-stone-400 hover:text-stone-600"
        >
          + Add action item
        </button>
      )}
    </div>
  )
}
