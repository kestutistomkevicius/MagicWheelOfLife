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

interface WheelChartProps {
  data: WheelChartPoint[]
  highlightedCategory?: string    // stub — rendered in Plan 06
  importantCategories?: string[]  // stub — rendered in Plan 06
}

export function WheelChart({ data, highlightedCategory: _highlightedCategory, importantCategories: _importantCategories }: WheelChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-stone-400 text-sm">
        Add categories to see your wheel
      </div>
    )
  }
  return (
    <ResponsiveContainer width="100%" height={400}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis dataKey="category" tick={{ fontSize: 12 }} />
        <PolarRadiusAxis domain={[0, 10]} tickCount={6} tick={false} axisLine={false} />
        <Radar name="As-Is" dataKey="asis" stroke="#e8a23a" fill="#e8a23a" fillOpacity={0.4} dot={false} />
        <Radar name="To-Be" dataKey="tobe" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.15} dot={false} />
        <Legend />
        <Tooltip
          wrapperStyle={{ outline: 'none' }}
          contentStyle={{ border: 'none', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.10)' }}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
