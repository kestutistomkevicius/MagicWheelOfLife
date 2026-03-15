import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

export type TrendChartPoint = {
  date: string   // formatted for display e.g. "15 Jan 2026"
  asis: number
  tobe: number
}

interface TrendChartProps {
  data: TrendChartPoint[]
  categoryName: string
}

export function TrendChart({ data, categoryName: _categoryName }: TrendChartProps) {
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
          formatter={(value: number, name: string) =>
            [value, name === 'asis' ? 'As-Is' : 'To-Be']
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
      </LineChart>
    </ResponsiveContainer>
  )
}
