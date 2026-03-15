import type { ActionItemRow, CategoryRow } from '@/types/database'

export type DueSoonItem = {
  categoryName: string
  item: ActionItemRow
  daysRemaining: number
}

export function getDueSoonItems(
  _actionItemsByCategory: Record<string, ActionItemRow[]>,
  _categories: CategoryRow[],
  _withinDays?: number
): DueSoonItem[] {
  return []  // stub — implemented in Plan 05
}

interface DueSoonWidgetProps {
  items: DueSoonItem[]
  highlightedCategory: string | null
  onHighlight: (categoryName: string | null) => void
  onMarkComplete: (itemId: string) => void
}

export function DueSoonWidget(_props: DueSoonWidgetProps) {
  return null  // stub — implemented in Plan 05
}
