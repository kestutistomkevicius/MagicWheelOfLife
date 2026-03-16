import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import type { ActionItemRow, CategoryRow } from '@/types/database'

export type DueSoonItem = {
  categoryName: string
  item: ActionItemRow
  daysRemaining: number
}

export function getDueSoonItems(
  actionItemsByCategory: Record<string, ActionItemRow[]>,
  categories: CategoryRow[],
  withinDays = 7
): DueSoonItem[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const result: DueSoonItem[] = []
  for (const cat of categories) {
    const items = actionItemsByCategory[cat.id] ?? []
    for (const item of items) {
      if (!item.deadline || item.is_complete) continue
      const deadline = new Date(item.deadline)
      deadline.setHours(0, 0, 0, 0)
      const diff = Math.round((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      if (diff >= 0 && diff <= withinDays) {
        result.push({ categoryName: cat.name, item, daysRemaining: diff })
      }
    }
  }
  return result.sort((a, b) => a.daysRemaining - b.daysRemaining)
}

interface DueSoonWidgetProps {
  items: DueSoonItem[]
  highlightedCategory: string | null
  onHighlight: (categoryName: string | null) => void
  onMarkComplete: (itemId: string) => void
}

export function DueSoonWidget({ items, onHighlight, onMarkComplete }: DueSoonWidgetProps) {
  const [selectedItem, setSelectedItem] = useState<DueSoonItem | null>(null)

  if (items.length === 0) return null

  return (
    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
      <p className="text-xs font-medium text-amber-700 mb-2">Due within 7 days</p>
      <ul className="space-y-1">
        {items.map(dueSoon => (
          <li
            key={dueSoon.item.id}
            className="flex items-center justify-between text-sm text-stone-700 cursor-pointer hover:text-stone-900 rounded px-1 -mx-1 hover:bg-amber-100"
            onMouseEnter={() => onHighlight(dueSoon.categoryName)}
            onMouseLeave={() => onHighlight(null)}
            onClick={() => setSelectedItem(dueSoon)}
          >
            <span>
              <span className="text-stone-500">{dueSoon.categoryName}</span>
              {' — '}
              {dueSoon.item.text}
            </span>
            <span className="text-xs text-amber-600 ml-2 shrink-0">
              {dueSoon.daysRemaining === 0
                ? 'Today'
                : `${dueSoon.daysRemaining} day${dueSoon.daysRemaining === 1 ? '' : 's'}`}
            </span>
          </li>
        ))}
      </ul>

      {/* Mini modal */}
      <Dialog open={selectedItem !== null} onOpenChange={(open) => { if (!open) setSelectedItem(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedItem?.categoryName}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-stone-700">{selectedItem?.item.text}</p>
          {selectedItem?.item.deadline && (
            <p className="text-xs text-stone-500">
              Due: {new Date(selectedItem.item.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          )}
          <DialogFooter>
            <button
              type="button"
              onClick={() => { onMarkComplete(selectedItem!.item.id); setSelectedItem(null) }}
              className="px-4 py-2 text-sm bg-stone-800 text-white rounded hover:bg-stone-700"
            >
              Mark complete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
