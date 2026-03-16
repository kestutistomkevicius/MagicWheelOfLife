import {
  RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Legend, Tooltip
} from 'recharts'

export type WheelChartPoint = {
  category: string
  asis: number
  tobe: number
}

type ExtendedChartPoint = WheelChartPoint & {
  asisImportant: number
  asisHighlight: number
}

interface WheelChartProps {
  data: WheelChartPoint[]
  highlightedCategory?: string
  importantCategories?: string[]
}

export function WheelChart({ data, highlightedCategory, importantCategories }: WheelChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-stone-400 text-sm">
        Add categories to see your wheel
      </div>
    )
  }

  const extendedData: ExtendedChartPoint[] = data.map(d => ({
    ...d,
    asisImportant: (importantCategories ?? []).includes(d.category) ? d.asis : 0,
    asisHighlight: d.category === highlightedCategory ? d.asis : 0,
  }))

  return (
    <ResponsiveContainer width="100%" height={400}>
      <RadarChart data={extendedData} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis dataKey="category" tick={{ fontSize: 12 }} />
        <PolarRadiusAxis domain={[0, 10]} tickCount={6} tick={false} axisLine={false} />
        <Radar name="As-Is" dataKey="asis" stroke="#e8a23a" fill="#e8a23a" fillOpacity={0.4} dot={false} />
        <Radar name="To-Be" dataKey="tobe" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.15} dot={false} />
        {(importantCategories ?? []).length > 0 && (
          <Radar
            name="Important"
            dataKey="asisImportant"
            stroke="#b45309"
            fill="#b45309"
            fillOpacity={0.65}
            dot={false}
            legendType="none"
          />
        )}
        {highlightedCategory && (
          <Radar
            name="Highlighted"
            dataKey="asisHighlight"
            stroke="none"
            fill="#fbbf24"
            fillOpacity={0.5}
            dot={false}
            legendType="none"
          />
        )}
        <Legend />
        <Tooltip
          wrapperStyle={{ outline: 'none' }}
          contentStyle={{ border: 'none', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.10)' }}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
