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
  Radar: ({ name, fill }: { name?: string; fill?: string }) => (
    <div data-testid="radar" data-name={name} data-fill={fill} />
  ),
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

  it('renders without errors when importantCategories and highlightedCategory are not provided (regression)', () => {
    expect(() => render(<WheelChart data={SAMPLE_DATA} />)).not.toThrow()
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
  })

  it('renders without errors when importantCategories and highlightedCategory are both provided', () => {
    expect(() =>
      render(
        <WheelChart
          data={SAMPLE_DATA}
          importantCategories={['Health']}
          highlightedCategory="Career"
        />
      )
    ).not.toThrow()
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
  })

  it('renders Important Radar layer when importantCategories is non-empty', () => {
    render(<WheelChart data={SAMPLE_DATA} importantCategories={['Health']} />)
    const radars = screen.getAllByTestId('radar')
    const importantRadar = radars.find(r => r.getAttribute('data-name') === 'Important')
    expect(importantRadar).toBeTruthy()
    expect(importantRadar?.getAttribute('data-fill')).toBe('#b45309')
  })

  it('does NOT render Important Radar layer when importantCategories is empty', () => {
    render(<WheelChart data={SAMPLE_DATA} importantCategories={[]} />)
    const radars = screen.getAllByTestId('radar')
    const importantRadar = radars.find(r => r.getAttribute('data-name') === 'Important')
    expect(importantRadar).toBeFalsy()
  })

  it('renders Highlighted Radar layer when highlightedCategory is set', () => {
    render(<WheelChart data={SAMPLE_DATA} highlightedCategory="Career" />)
    const radars = screen.getAllByTestId('radar')
    const highlightRadar = radars.find(r => r.getAttribute('data-name') === 'Highlighted')
    expect(highlightRadar).toBeTruthy()
    expect(highlightRadar?.getAttribute('data-fill')).toBe('#fbbf24')
  })

  it('always renders Highlighted Radar layer (zero values when highlightedCategory is undefined)', () => {
    render(<WheelChart data={SAMPLE_DATA} />)
    const radars = screen.getAllByTestId('radar')
    const highlightRadar = radars.find(r => r.getAttribute('data-name') === 'Highlighted')
    expect(highlightRadar).toBeTruthy()
  })
})
