import type { ActionItemRow } from '@/types/database'

interface ImprovementInterval {
  fromLabel: string
  toLabel: string
  scoreDelta: number
  items: ActionItemRow[]
}

interface ActionInsightsPanelProps {
  improvementActions: ImprovementInterval[]
  allItems: ActionItemRow[]
}

export function ActionInsightsPanel({ improvementActions, allItems }: ActionInsightsPanelProps) {
  const activeItems = allItems.filter(item => !item.is_complete)
  const completedItems = allItems.filter(item => item.is_complete)

  const hasImprovements = improvementActions.length > 0
  const hasItems = allItems.length > 0

  if (!hasImprovements && !hasItems) return null

  return (
    <div className="space-y-4">
      {hasImprovements && (
        <div className="space-y-3">
          {improvementActions.map((interval, i) => (
            <div
              key={i}
              className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2"
            >
              <p className="text-sm font-medium text-green-800">
                Between {interval.fromLabel} and {interval.toLabel} your score improved by +{interval.scoreDelta}. You completed these actions:
              </p>
              <ul className="space-y-1">
                {interval.items.map(item => (
                  <li key={item.id} className="text-sm text-stone-700 flex items-start gap-1.5">
                    <span className="text-green-600 mt-0.5">✓</span>
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {hasItems && (
        <div>
          {activeItems.length > 0 && (
            <>
              <p className="text-sm font-semibold text-stone-700 mt-4 mb-2">Active actions</p>
              <ul className="space-y-1">
                {activeItems.map(item => (
                  <li key={item.id} className="text-sm text-stone-600 flex items-start gap-1.5">
                    <span className="mt-0.5">•</span>
                    {item.text}
                  </li>
                ))}
              </ul>
            </>
          )}
          {completedItems.length > 0 && (
            <>
              <p className="text-sm font-semibold text-stone-700 mt-4 mb-2">Completed actions</p>
              <ul className="space-y-1">
                {completedItems.map(item => (
                  <li key={item.id} className="text-sm text-stone-400 line-through flex items-start gap-1.5">
                    <span className="mt-0.5">•</span>
                    {item.text}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  )
}
