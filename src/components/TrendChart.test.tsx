import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TrendChart } from './TrendChart'

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
}))

const makePoint = (date: string, asis: number, tobe: number) => ({ date, asis, tobe })

describe('TrendChart', () => {
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
