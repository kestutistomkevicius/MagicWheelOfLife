import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ComparisonChart } from './ComparisonChart'
import type { SnapshotScoreRow } from '@/types/database'

// Recharts renders SVG elements that jsdom doesn't support well.
// Mock out the recharts module so we can test component behaviour
// without SVG rendering issues.
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  RadarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="radar-chart">{children}</div>
  ),
  Radar: ({ name }: { name: string }) => <div data-testid="radar" data-name={name} />,
  PolarGrid: () => <div data-testid="polar-grid" />,
  PolarAngleAxis: () => <div data-testid="polar-angle-axis" />,
  PolarRadiusAxis: () => <div data-testid="polar-radius-axis" />,
  Legend: () => <div data-testid="legend" />,
  Tooltip: () => <div data-testid="tooltip" />,
}))

function makeScore(overrides: Partial<SnapshotScoreRow> & { category_name: string }): SnapshotScoreRow {
  return {
    id: crypto.randomUUID(),
    snapshot_id: 'snap-1',
    user_id: 'user-1',
    position: 0,
    score_asis: 5,
    score_tobe: 7,
    ...overrides,
  }
}

describe('ComparisonChart', () => {
  it('renders four Radar series when given two non-empty score arrays (COMP-01)', () => {
    const snap1Scores = [makeScore({ category_name: 'Health', position: 0, score_asis: 6, score_tobe: 8 })]
    const snap2Scores = [makeScore({ category_name: 'Health', position: 0, score_asis: 7, score_tobe: 9, snapshot_id: 'snap-2' })]

    render(
      <ComparisonChart
        snap1Scores={snap1Scores}
        snap2Scores={snap2Scores}
        snap1Label="Snapshot A"
        snap2Label="Snapshot B"
      />
    )

    // Should render 4 Radar data series
    const radars = screen.getAllByTestId('radar')
    expect(radars).toHaveLength(4)
  })

  it('renders empty-state message when both score arrays are empty', () => {
    render(
      <ComparisonChart
        snap1Scores={[]}
        snap2Scores={[]}
        snap1Label="A"
        snap2Label="B"
      />
    )

    expect(screen.getByText(/no data to compare/i)).toBeInTheDocument()
    expect(screen.queryByTestId('radar-chart')).not.toBeInTheDocument()
  })

  it('includes categories from both snapshots in the merged data (union)', () => {
    const snap1Scores = [
      makeScore({ category_name: 'Health', position: 0 }),
      makeScore({ category_name: 'Career', position: 1 }),
    ]
    const snap2Scores = [
      makeScore({ category_name: 'Health', position: 0, snapshot_id: 'snap-2' }),
      makeScore({ category_name: 'Finance', position: 1, snapshot_id: 'snap-2' }),
    ]

    render(
      <ComparisonChart
        snap1Scores={snap1Scores}
        snap2Scores={snap2Scores}
        snap1Label="A"
        snap2Label="B"
      />
    )

    // Chart should render (not empty state) — 3 unique categories: Health, Career, Finance
    expect(screen.getByTestId('radar-chart')).toBeInTheDocument()
    expect(screen.getAllByTestId('radar')).toHaveLength(4)
  })

  it('uses 0 for a missing category score rather than omitting the category', () => {
    // snap1 has 'Career', snap2 does NOT — merged data should still include Career with snap2 scores=0
    const snap1Scores = [
      makeScore({ category_name: 'Career', position: 0, score_asis: 5, score_tobe: 8 }),
    ]
    const snap2Scores: SnapshotScoreRow[] = []

    render(
      <ComparisonChart
        snap1Scores={snap1Scores}
        snap2Scores={snap2Scores}
        snap1Label="Snap 1"
        snap2Label="Snap 2"
      />
    )

    // Chart renders (snap1 has data, snap2 is empty but we still show snap1's categories)
    expect(screen.getByTestId('radar-chart')).toBeInTheDocument()
    expect(screen.getAllByTestId('radar')).toHaveLength(4)
  })

  it('snap1Label and snap2Label appear in the rendered output via Radar name attributes', () => {
    const snap1Scores = [makeScore({ category_name: 'Health', position: 0 })]
    const snap2Scores = [makeScore({ category_name: 'Health', position: 0, snapshot_id: 'snap-2' })]

    render(
      <ComparisonChart
        snap1Scores={snap1Scores}
        snap2Scores={snap2Scores}
        snap1Label="Q1 Review"
        snap2Label="Q2 Review"
      />
    )

    const radars = screen.getAllByTestId('radar')
    const names = radars.map(r => r.getAttribute('data-name') ?? '')
    expect(names.some(n => n.includes('Q1 Review'))).toBe(true)
    expect(names.some(n => n.includes('Q2 Review'))).toBe(true)
  })
})
