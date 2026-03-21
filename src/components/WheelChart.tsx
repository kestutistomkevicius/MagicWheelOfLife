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
  primaryColor?: string
  secondaryColor?: string
  importantColor?: string
  highlightColor?: string
}

export function WheelChart({
  data,
  highlightedCategory,
  importantCategories,
  primaryColor = '#e8a23a',
  secondaryColor = '#60a5fa',
  importantColor = '#b45309',
  highlightColor = '#fbbf24',
}: WheelChartProps) {
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

  const customTick = (props: { x: string | number; y: string | number; textAnchor?: 'end' | 'inherit' | 'start' | 'middle'; payload?: { value: string } }) => {
    const { x, y, textAnchor, payload } = props
    const label = payload?.value ?? ''
    const isHighlighted = label === highlightedCategory
    return (
      <text
        x={x}
        y={y}
        textAnchor={textAnchor}
        fontSize={isHighlighted ? 13 : 12}
        fontWeight={isHighlighted ? 700 : 400}
        fill={isHighlighted ? highlightColor : '#374151'}
      >
        {label}
      </text>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <RadarChart key={highlightedCategory ?? ''} data={extendedData} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis dataKey="category" tick={customTick} />
        <PolarRadiusAxis domain={[0, 10]} tickCount={6} tick={false} axisLine={false} />
        <Radar name="As-Is" dataKey="asis" stroke={primaryColor} fill={primaryColor} fillOpacity={0.4} dot={false} isAnimationActive={false} />
        <Radar name="To-Be" dataKey="tobe" stroke={secondaryColor} fill={secondaryColor} fillOpacity={0.15} dot={false} isAnimationActive={false} />
        {(importantCategories ?? []).length > 0 && (
          <Radar
            name="Important"
            dataKey="asisImportant"
            stroke={importantColor}
            fill={importantColor}
            fillOpacity={0.65}
            dot={false}
            legendType="none"
            isAnimationActive={false}
          />
        )}
        <Radar
          name="Highlighted"
          dataKey="asisHighlight"
          stroke="none"
          fill={highlightColor}
          fillOpacity={0.5}
          dot={false}
          legendType="none"
          isAnimationActive={false}
        />
        <Legend />
        <Tooltip
          wrapperStyle={{ outline: 'none' }}
          contentStyle={{ border: 'none', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.10)' }}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
