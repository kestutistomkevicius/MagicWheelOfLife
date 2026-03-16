import React from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'

export type TrendChartPoint = {
  date: string   // formatted for display e.g. "15 Jan 2026"
  asis: number
  tobe: number
}

export type TrendChartMarker = {
  date: string    // formatted date string matching XAxis dataKey value exactly
  label: string   // action item text for tooltip
  color: string   // hex color
}

interface TrendChartProps {
  data: TrendChartPoint[]
  categoryName: string
  markers?: TrendChartMarker[]
}

function DiamondLabel({ viewBox, label, color, ...rest }: {
  viewBox?: { x?: number; y?: number }
  label: string
  color: string
  [key: string]: unknown
}) {
  const [hovered, setHovered] = React.useState(false)
  const x = viewBox?.x ?? 0
  const y = viewBox?.y ?? 0
  // Suppress unused rest variable warning
  void rest
  return (
    <g>
      <text
        x={x}
        y={y + 16}
        textAnchor="middle"
        fill={color}
        fontSize={12}
        style={{ cursor: 'default' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        ◆
      </text>
      {hovered && (
        <foreignObject x={x - 60} y={y + 20} width={120} height={40}>
          <div
            style={{
              background: 'white',
              border: '1px solid #e7e5e4',
              borderRadius: 6,
              padding: '2px 6px',
              fontSize: 11,
              color: '#44403c',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {label}
          </div>
        </foreignObject>
      )}
    </g>
  )
}

export function TrendChart({ data, categoryName: _categoryName, markers }: TrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={360}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: '#78716c' }}
          tickLine={false}
        />
        <YAxis
          domain={[0, 10]}
          ticks={[0, 2, 4, 6, 8, 10]}
          tick={{ fontSize: 12, fill: '#78716c' }}
          tickLine={false}
          axisLine={false}
          width={24}
        />
        <Tooltip
          contentStyle={{ fontSize: 13 }}
          formatter={(value, name) =>
            [value, name === 'asis' ? 'As-Is' : 'To-Be'] as [typeof value, string]
          }
        />
        <Legend
          formatter={(value: string) => (value === 'asis' ? 'As-Is' : 'To-Be')}
        />
        <Line
          type="monotone"
          dataKey="asis"
          name="asis"
          stroke="#e8a23a"
          strokeWidth={2}
          dot={{ r: 4, fill: '#e8a23a' }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="tobe"
          name="tobe"
          stroke="#60a5fa"
          strokeWidth={2}
          dot={{ r: 4, fill: '#60a5fa' }}
          activeDot={{ r: 5 }}
        />
        {(markers ?? []).map((m, i) => (
          <ReferenceLine
            key={i}
            x={m.date}
            stroke={m.color}
            strokeDasharray="3 3"
            label={<DiamondLabel label={m.label} color={m.color} />}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
