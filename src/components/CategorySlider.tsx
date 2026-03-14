import { Slider } from '@/components/ui/slider'

interface CategorySliderProps {
  categoryName: string
  asisValue: number
  tobeValue: number
  onAsisChange: (v: number) => void
  onAsisCommit: (v: number) => void
  onTobeChange: (v: number) => void
  onTobeCommit: (v: number) => void
}

export function CategorySlider({
  categoryName,
  asisValue,
  tobeValue,
  onAsisChange,
  onAsisCommit,
  onTobeChange,
  onTobeCommit,
}: CategorySliderProps) {
  return (
    <div className="space-y-2 py-2 border-b border-stone-100 last:border-0">
      <span className="text-sm font-medium text-stone-700">{categoryName}</span>
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
        <span className="w-5 text-sm font-medium text-stone-800 text-right">{asisValue}</span>
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
        <span className="w-5 text-sm font-medium text-stone-800 text-right">{tobeValue}</span>
      </div>
    </div>
  )
}
