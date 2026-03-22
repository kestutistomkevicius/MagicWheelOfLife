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
    <svg data-testid="radar-chart">{children}</svg>
  ),
  Radar: ({ name, fill }: { name?: string; fill?: string }) => (
    <g data-testid="radar" data-name={name} data-fill={fill} />
  ),
  PolarGrid: () => <g data-testid="polar-grid" />,
  PolarAngleAxis: ({ tick }: { tick?: (props: unknown) => React.ReactNode }) => {
    // Invoke the custom tick renderer with synthetic props so customTick logic runs in tests
    if (typeof tick === 'function') {
      const rendered = tick({ x: 100, y: 50, cx: 200, cy: 200, textAnchor: 'middle', payload: { value: 'Health' } })
      return <g data-testid="polar-angle-axis">{rendered}</g>
    }
    return <g data-testid="polar-angle-axis" />
  },
  PolarRadiusAxis: () => <g data-testid="polar-radius-axis" />,
  Legend: () => <g data-testid="legend" />,
  Tooltip: () => <g data-testid="tooltip" />,
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

  it('uses amber defaults when no color props are provided', () => {
    render(<WheelChart data={SAMPLE_DATA} />)
    const radars = screen.getAllByTestId('radar')
    const asisRadar = radars.find(r => r.getAttribute('data-name') === 'As-Is')
    expect(asisRadar?.getAttribute('data-fill')).toBe('#e8a23a')
    const tobeRadar = radars.find(r => r.getAttribute('data-name') === 'To-Be')
    expect(tobeRadar?.getAttribute('data-fill')).toBe('#60a5fa')
  })

  it('uses primaryColor prop for As-Is radar when provided', () => {
    render(<WheelChart data={SAMPLE_DATA} primaryColor="#ff0000" />)
    const radars = screen.getAllByTestId('radar')
    const asisRadar = radars.find(r => r.getAttribute('data-name') === 'As-Is')
    expect(asisRadar?.getAttribute('data-fill')).toBe('#ff0000')
  })

  it('uses secondaryColor prop for To-Be radar when provided', () => {
    render(<WheelChart data={SAMPLE_DATA} secondaryColor="#00ff00" />)
    const radars = screen.getAllByTestId('radar')
    const tobeRadar = radars.find(r => r.getAttribute('data-name') === 'To-Be')
    expect(tobeRadar?.getAttribute('data-fill')).toBe('#00ff00')
  })

  it('uses importantColor prop for Important radar when provided', () => {
    render(<WheelChart data={SAMPLE_DATA} importantCategories={['Health']} importantColor="#0000ff" />)
    const radars = screen.getAllByTestId('radar')
    const importantRadar = radars.find(r => r.getAttribute('data-name') === 'Important')
    expect(importantRadar?.getAttribute('data-fill')).toBe('#0000ff')
  })

  it('uses highlightColor prop for Highlighted radar when provided', () => {
    render(<WheelChart data={SAMPLE_DATA} highlightColor="#ff00ff" />)
    const radars = screen.getAllByTestId('radar')
    const highlightRadar = radars.find(r => r.getAttribute('data-name') === 'Highlighted')
    expect(highlightRadar?.getAttribute('data-fill')).toBe('#ff00ff')
  })
})

describe('DueSoon spoke highlight', () => {
  it('renders a <line> SVG element when highlightedCategory is set', () => {
    // The PolarAngleAxis mock invokes the tick prop with payload.value='Health'
    // When highlightedCategory='Health' the customTick renders a <line> for the spoke
    const { container } = render(
      <WheelChart
        data={SAMPLE_DATA}
        highlightedCategory="Health"
        highlightColor="#fbbf24"
      />
    )
    const lines = container.querySelectorAll('line[stroke="#fbbf24"]')
    expect(lines.length).toBeGreaterThan(0)
  })

  it('does not render spoke line when highlightedCategory is null', () => {
    // The PolarAngleAxis mock invokes the tick prop with payload.value='Health'
    // When highlightedCategory is undefined, no <line> should be rendered
    const { container } = render(
      <WheelChart
        data={SAMPLE_DATA}
        highlightedCategory={undefined}
        highlightColor="#fbbf24"
      />
    )
    const lines = container.querySelectorAll('line[stroke="#fbbf24"]')
    expect(lines.length).toBe(0)
  })
})
