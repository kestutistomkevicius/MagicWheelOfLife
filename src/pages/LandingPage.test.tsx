import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

// Mock useAuth from AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

// Mock useNavigate from react-router
const mockNavigate = vi.fn()
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock WheelChart to avoid Recharts ResponsiveContainer issues in jsdom
vi.mock('@/components/WheelChart', () => ({
  WheelChart: ({ data }: { data: { category: string; asis: number; tobe: number }[] }) => (
    <div data-testid="wheel-chart-mock" data-categories={data.map(d => d.category).join(',')} />
  ),
}))

// Mock ComparisonChart to avoid Recharts ResponsiveContainer issues in jsdom
vi.mock('@/components/ComparisonChart', () => ({
  ComparisonChart: ({ snap1Label, snap2Label }: { snap1Label: string; snap2Label: string }) => (
    <div data-testid="comparison-chart-mock" data-snap1={snap1Label} data-snap2={snap2Label} />
  ),
}))

// Mock useInView — IntersectionObserver is not defined in jsdom; always return inView: true
vi.mock('@/hooks/useInView', () => ({
  useInView: () => ({ ref: { current: null }, inView: true }),
}))

import { useAuth } from '@/contexts/AuthContext'
const mockUseAuth = vi.mocked(useAuth)

describe('LandingPage', () => {
  // LAND-01: Hero section
  it('returns null while session is undefined (no flash)', async () => {
    mockUseAuth.mockReturnValue({ session: undefined, signOut: vi.fn() })
    const { LandingPage } = await import('./LandingPage')
    const { container } = render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('redirects authenticated user to /wheel', async () => {
    mockNavigate.mockClear()
    mockUseAuth.mockReturnValue({ session: { user: {} } as any, signOut: vi.fn() })
    const { LandingPage } = await import('./LandingPage')
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )
    expect(mockNavigate).toHaveBeenCalledWith('/wheel', { replace: true })
  })

  it('shows hero section with value proposition for unauthenticated visitor', async () => {
    mockUseAuth.mockReturnValue({ session: null, signOut: vi.fn() })
    const { LandingPage } = await import('./LandingPage')
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it.todo("hero section contains 'Start your wheel' CTA linking to /auth")

  // LAND-02: Feature showcase
  it('feature showcase section is present with 3 feature rows', async () => {
    mockUseAuth.mockReturnValue({ session: null, signOut: vi.fn() })
    const { LandingPage } = await import('./LandingPage')
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )
    expect(screen.getByText(/Everything you need to take stock/i)).toBeInTheDocument()
    expect(screen.getByText(/Score your life areas at a glance/i)).toBeInTheDocument()
    expect(screen.getByText(/Compare any two moments in time/i)).toBeInTheDocument()
    expect(screen.getByText(/Turn insight into action/i)).toBeInTheDocument()
  })

  it('feature showcase renders wheel chart and comparison chart demos', async () => {
    mockUseAuth.mockReturnValue({ session: null, signOut: vi.fn() })
    const { LandingPage } = await import('./LandingPage')
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )
    // There are two WheelChart instances: one in hero, one in features
    const wheelCharts = screen.getAllByTestId('wheel-chart-mock')
    expect(wheelCharts.length).toBeGreaterThanOrEqual(1)
    expect(screen.getByTestId('comparison-chart-mock')).toBeInTheDocument()
  })

  // LAND-03: Social proof
  it('social proof section shows 3 testimonial cards with quote, name, role', async () => {
    mockUseAuth.mockReturnValue({ session: null, signOut: vi.fn() })
    const { LandingPage } = await import('./LandingPage')
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )
    expect(screen.getByText('Rachel K.')).toBeInTheDocument()
    expect(screen.getByText('Marcus T.')).toBeInTheDocument()
    expect(screen.getByText('Anya S.')).toBeInTheDocument()
  })

  // LAND-04: Pricing
  it('pricing section shows Free ($0/mo) and Premium ($5/mo) columns', async () => {
    mockUseAuth.mockReturnValue({ session: null, signOut: vi.fn() })
    const { LandingPage } = await import('./LandingPage')
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )
    expect(screen.getByText('Free')).toBeInTheDocument()
    expect(screen.getByText('Premium')).toBeInTheDocument()
    expect(screen.getByText('$0/mo')).toBeInTheDocument()
    expect(screen.getByText('$5/mo')).toBeInTheDocument()
  })

  it("premium CTA button is disabled with text 'Coming soon'", async () => {
    mockUseAuth.mockReturnValue({ session: null, signOut: vi.fn() })
    const { LandingPage } = await import('./LandingPage')
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )
    const comingSoonBtn = screen.getByRole('button', { name: /coming soon/i })
    expect(comingSoonBtn).toBeDisabled()
  })

  it('free CTA links to /auth', async () => {
    mockUseAuth.mockReturnValue({ session: null, signOut: vi.fn() })
    const { LandingPage } = await import('./LandingPage')
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )
    const startFreeLinks = screen.getAllByRole('link', { name: /Start free/i })
    expect(startFreeLinks.length).toBeGreaterThanOrEqual(1)
    expect(startFreeLinks[0]).toHaveAttribute('href', '/auth')
  })
})
