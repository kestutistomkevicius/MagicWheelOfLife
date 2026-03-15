import { useState } from 'react'
import { Slider } from '@/components/ui/slider'

interface CategorySliderProps {
  categoryName: string
  asisValue: number
  tobeValue: number
  onAsisChange: (v: number) => void
  onAsisCommit: (v: number) => void
  onTobeChange: (v: number) => void
  onTobeCommit: (v: number) => void
  onRename?: (newName: string) => void
  onRemove?: () => void
  removeDisabled?: boolean
  isExpanded?: boolean
  onExpandToggle?: () => void
  actionItemCount?: number
}

export function CategorySlider({
  categoryName,
  asisValue,
  tobeValue,
  onAsisChange,
  onAsisCommit,
  onTobeChange,
  onTobeCommit,
  onRename,
  onRemove,
  removeDisabled,
  isExpanded,
  onExpandToggle,
  actionItemCount,
}: CategorySliderProps) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(categoryName)

  function handleRenameSubmit() {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== categoryName && onRename) {
      onRename(trimmed)
    }
    setEditing(false)
  }

  return (
    <div className="space-y-2 py-2 pr-4 border-b border-stone-100 last:border-0">
      <div className="flex items-center justify-between gap-2">
        {editing ? (
          <input
            className="text-sm font-medium text-stone-700 border border-stone-300 rounded px-1"
            value={editValue}
            autoFocus
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit()
              if (e.key === 'Escape') setEditing(false)
            }}
          />
        ) : (
          <span
            className="text-sm font-medium text-stone-700 cursor-pointer hover:underline"
            onClick={() => { if (onRename) { setEditValue(categoryName); setEditing(true) } }}
          >
            {categoryName}
          </span>
        )}
        <div className="flex gap-1">
          {onExpandToggle && (
            <button
              className="text-xs text-stone-400 hover:text-stone-600"
              onClick={onExpandToggle}
              aria-label={isExpanded ? 'Collapse action items' : 'Expand action items'}
              aria-expanded={isExpanded}
            >
              {actionItemCount ? `Actions (${actionItemCount})` : '+ Actions'} {isExpanded ? '▲' : '▼'}
            </button>
          )}
          {onRename && (
            <button
              className="text-xs text-stone-400 hover:text-stone-600"
              onClick={() => {
                setEditValue(categoryName)
                setEditing(true)
              }}
            >
              Rename
            </button>
          )}
          {onRemove && (
            <button
              className="text-xs text-stone-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
              onClick={onRemove}
              disabled={removeDisabled}
            >
              Remove
            </button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="w-14 text-xs text-stone-500 shrink-0">As-Is</span>
        <Slider
          min={1}
          max={10}
          step={1}
          value={[asisValue]}
          onValueChange={([v]) => onAsisChange(v)}
          onValueCommit={([v]) => onAsisCommit(v)}
          aria-label={`As-Is score for ${categoryName}`}
          className="flex-1"
        />
        <span className="w-8 text-sm font-medium text-stone-800 text-right">{asisValue}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="w-14 text-xs text-stone-500 shrink-0">To-Be</span>
        <Slider
          min={1}
          max={10}
          step={1}
          value={[tobeValue]}
          onValueChange={([v]) => onTobeChange(v)}
          onValueCommit={([v]) => onTobeCommit(v)}
          aria-label={`To-Be score for ${categoryName}`}
          className="flex-1"
        />
        <span className="w-8 text-sm font-medium text-stone-800 text-right">{tobeValue}</span>
      </div>
    </div>
  )
}
