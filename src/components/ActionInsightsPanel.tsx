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
  const latestImprovement = improvementActions.length > 0 ? improvementActions[0] : null
  const activeItems = allItems.filter(item => !item.is_complete)
  const completedItems = allItems.filter(item => item.is_complete)

  if (!latestImprovement && allItems.length === 0) return null

  return (
    <div className="space-y-4">
      {latestImprovement && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          <p className="text-sm font-medium text-green-800">
            Between {latestImprovement.fromLabel} and {latestImprovement.toLabel} your score improved by +{latestImprovement.scoreDelta}
          </p>
        </div>
      )}

      {allItems.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-2">Action items</p>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-stone-200">
                <th className="text-left py-1.5 px-2 text-xs font-medium uppercase tracking-wide text-stone-400">Task</th>
                <th className="text-left py-1.5 px-2 text-xs font-medium uppercase tracking-wide text-stone-400">Due</th>
                <th className="text-left py-1.5 px-2 text-xs font-medium uppercase tracking-wide text-stone-400">Completed</th>
                <th className="text-left py-1.5 px-2 text-xs font-medium uppercase tracking-wide text-stone-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {activeItems.map(item => (
                <tr key={item.id} className="border-b border-stone-100">
                  <td className="py-1.5 px-2 text-stone-800">{item.text}</td>
                  <td className="py-1.5 px-2 text-stone-500">{item.deadline ?? '—'}</td>
                  <td className="py-1.5 px-2 text-stone-400">—</td>
                  <td className="py-1.5 px-2">
                    <span className="rounded px-1.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-800">Active</span>
                  </td>
                </tr>
              ))}
              {completedItems.map(item => (
                <tr key={item.id} className="border-b border-stone-100 opacity-60">
                  <td className="py-1.5 px-2 text-stone-500 line-through">{item.text}</td>
                  <td className="py-1.5 px-2 text-stone-400">{item.deadline ?? '—'}</td>
                  <td className="py-1.5 px-2 text-stone-500">{item.completed_at ? item.completed_at.slice(0, 10) : '—'}</td>
                  <td className="py-1.5 px-2">
                    <span className="rounded px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">Done</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
