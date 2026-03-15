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
  it.todo('feature showcase section is present with 3 feature rows')
  it.todo('feature showcase renders wheel chart and comparison chart demos')

  // LAND-03: Social proof
  it.todo('social proof section shows 3 testimonial cards with quote, name, role')

  // LAND-04: Pricing
  it.todo('pricing section shows Free ($0/mo) and Premium ($5/mo) columns')
  it.todo("premium CTA button is disabled with text 'Coming soon'")
  it.todo('free CTA links to /auth')
})
