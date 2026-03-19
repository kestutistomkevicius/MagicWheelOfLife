import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TrendChart } from './TrendChart'
import type { TrendChartMarker } from './TrendChart'

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children, data }: { children: React.ReactNode; data: unknown[] }) => (
    <div data-testid="line-chart" data-points={data?.length}>{children}</div>
  ),
  Line: ({ dataKey, stroke }: { dataKey: string; stroke: string }) => (
    <div data-testid="line" data-key={dataKey} data-stroke={stroke} />
  ),
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ReferenceLine: ({ x, stroke, label }: { x: string; stroke: string; label: React.ReactNode }) => (
    <div
      data-testid="reference-line"
      data-x={x}
      data-stroke={stroke}
    >
      {label}
    </div>
  ),
}))

const makePoint = (date: string, asis: number, tobe: number) => ({ date, asis, tobe })

const makeMarker = (date: string, label: string, color: string): TrendChartMarker => ({ date, label, color })

describe('TrendChart', () => {
  it('renders without errors when markers is undefined (regression)', () => {
    const data = [makePoint('01 Jan 2026', 5, 7)]
    render(<TrendChart data={data} categoryName="Health" />)
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    expect(screen.queryAllByTestId('reference-line')).toHaveLength(0)
  })

  it('renders a ReferenceLine when markers prop contains one marker', () => {
    const data = [
      makePoint('01 Jan 2026', 5, 7),
      makePoint('01 Feb 2026', 6, 8),
      makePoint('01 Mar 2026', 7, 9),
    ]
    const markers = [makeMarker('01 Feb 2026', 'Finish marathon training', '#16a34a')]
    render(<TrendChart data={data} categoryName="Health" markers={markers} />)
    const lines = screen.getAllByTestId('reference-line')
    expect(lines).toHaveLength(1)
    expect(lines[0]).toHaveAttribute('data-x', '01 Feb 2026')
    expect(lines[0]).toHaveAttribute('data-stroke', '#16a34a')
  })

  it('renders multiple ReferenceLines for multiple markers', () => {
    const data = [
      makePoint('01 Jan 2026', 5, 7),
      makePoint('01 Feb 2026', 6, 8),
      makePoint('01 Mar 2026', 7, 9),
    ]
    const markers = [
      makeMarker('01 Jan 2026', 'Start gym', '#16a34a'),
      makeMarker('01 Feb 2026', 'Deadline push-ups', '#dc2626'),
      makeMarker('01 Mar 2026', 'Stretch goal', '#d97706'),
    ]
    render(<TrendChart data={data} categoryName="Health" markers={markers} />)
    const lines = screen.getAllByTestId('reference-line')
    expect(lines).toHaveLength(3)
  })

  it('DiamondLabel renders ◆ text', () => {
    const data = [makePoint('01 Jan 2026', 5, 7)]
    const markers = [makeMarker('01 Jan 2026', 'Test item', '#16a34a')]
    render(<TrendChart data={data} categoryName="Health" markers={markers} />)
    // The DiamondLabel is passed as 'label' prop to ReferenceLine mock — rendered as child
    expect(screen.getByText('◆')).toBeInTheDocument()
  })

  it('renders line chart with correct data point count', () => {
    const data = [
      makePoint('01 Jan 2026', 5, 7),
      makePoint('01 Feb 2026', 6, 8),
      makePoint('01 Mar 2026', 7, 9),
    ]

    render(<TrendChart data={data} categoryName="Health" />)

    const chart = screen.getByTestId('line-chart')
    expect(chart).toHaveAttribute('data-points', '3')
  })

  it('renders as-is line with amber color', () => {
    const data = [makePoint('01 Jan 2026', 5, 7)]

    render(<TrendChart data={data} categoryName="Health" />)

    const lines = screen.getAllByTestId('line')
    const asisLine = lines.find(l => l.getAttribute('data-key') === 'asis')
    expect(asisLine).toBeDefined()
    expect(asisLine).toHaveAttribute('data-stroke', '#e8a23a')
  })

  it('renders to-be line with blue color', () => {
    const data = [makePoint('01 Jan 2026', 5, 7)]

    render(<TrendChart data={data} categoryName="Health" />)

    const lines = screen.getAllByTestId('line')
    const tobeLine = lines.find(l => l.getAttribute('data-key') === 'tobe')
    expect(tobeLine).toBeDefined()
    expect(tobeLine).toHaveAttribute('data-stroke', '#60a5fa')
  })

  it('wraps in responsive container', () => {
    const data = [makePoint('01 Jan 2026', 5, 7)]

    render(<TrendChart data={data} categoryName="Health" />)

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
  })
})
