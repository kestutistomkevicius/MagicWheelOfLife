import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WheelChart, type WheelChartPoint } from './WheelChart'

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
  Radar: () => <div data-testid="radar" />,
  PolarGrid: () => <div data-testid="polar-grid" />,
  PolarAngleAxis: () => <div data-testid="polar-angle-axis" />,
  PolarRadiusAxis: () => <div data-testid="polar-radius-axis" />,
  Legend: () => <div data-testid="legend" />,
  Tooltip: () => <div data-testid="tooltip" />,
}))

const SAMPLE_DATA: WheelChartPoint[] = [
  { category: 'Health', asis: 7, tobe: 9 },
  { category: 'Career', asis: 6, tobe: 8 },
  { category: 'Relationships', asis: 8, tobe: 9 },
  { category: 'Finance', asis: 5, tobe: 7 },
  { category: 'Fun & Recreation', asis: 4, tobe: 6 },
  { category: 'Personal Growth', asis: 7, tobe: 8 },
  { category: 'Physical Environment', asis: 6, tobe: 7 },
  { category: 'Family & Friends', asis: 9, tobe: 9 },
]

describe('WheelChart', () => {
  it('renders without throwing when given a non-empty data array', () => {
    expect(() => render(<WheelChart data={SAMPLE_DATA} />)).not.toThrow()
  })

  it('renders an empty/placeholder state when data array is empty', () => {
    render(<WheelChart data={[]} />)
    expect(screen.getByText(/add categories/i)).toBeInTheDocument()
  })

  it('chart container div is present in the rendered output', () => {
    render(<WheelChart data={SAMPLE_DATA} />)
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
  })
})
