import {
  RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Legend, Tooltip
} from 'recharts'
import type { SnapshotScoreRow } from '@/types/database'

export type ComparisonChartPoint = {
  category: string
  snap1_asis: number
  snap1_tobe: number
  snap2_asis: number
  snap2_tobe: number
}

interface ComparisonChartProps {
  snap1Scores: SnapshotScoreRow[]
  snap2Scores: SnapshotScoreRow[]
  snap1Label: string
  snap2Label: string
}

export function ComparisonChart({ snap1Scores, snap2Scores, snap1Label, snap2Label }: ComparisonChartProps) {
  // Build merged category list: snap1 order first (by position), then snap2-only categories
  const snap1Map = Object.fromEntries(snap1Scores.map(s => [s.category_name, s]))
  const snap2Map = Object.fromEntries(snap2Scores.map(s => [s.category_name, s]))

  const orderedCats = [
    ...snap1Scores.sort((a, b) => a.position - b.position).map(s => s.category_name),
    ...snap2Scores
      .filter(s => !snap1Map[s.category_name])
      .sort((a, b) => a.position - b.position)
      .map(s => s.category_name),
  ]

  const data: ComparisonChartPoint[] = orderedCats.map(cat => ({
    category: cat,
    snap1_asis: snap1Map[cat]?.score_asis ?? 0,
    snap1_tobe: snap1Map[cat]?.score_tobe ?? 0,
    snap2_asis: snap2Map[cat]?.score_asis ?? 0,
    snap2_tobe: snap2Map[cat]?.score_tobe ?? 0,
  }))

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-stone-400 text-sm">
        No data to compare
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid />
        <PolarAngleAxis dataKey="category" tick={{ fontSize: 12 }} />
        <PolarRadiusAxis domain={[0, 10]} tickCount={6} tick={false} />
        <Radar name={`${snap1Label} (As-Is)`} dataKey="snap1_asis" stroke="#e8a23a" fill="#e8a23a" fillOpacity={0.35} dot={false} />
        <Radar name={`${snap1Label} (To-Be)`} dataKey="snap1_tobe" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1}  dot={false} />
        <Radar name={`${snap2Label} (As-Is)`} dataKey="snap2_asis" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.35} dot={false} />
        <Radar name={`${snap2Label} (To-Be)`} dataKey="snap2_tobe" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1}  dot={false} />
        <Legend />
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  )
}
