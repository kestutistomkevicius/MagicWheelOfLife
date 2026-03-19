import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { Sidebar } from './Sidebar'

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/hooks/useProfile', () => ({
  useProfile: vi.fn(),
}))

import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
const mockUseAuth = vi.mocked(useAuth)
const mockUseProfile = vi.mocked(useProfile)

describe('Sidebar', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ session: {} as any, signOut: vi.fn() })
    mockUseProfile.mockReturnValue({
      avatarUrl: null,
      tier: 'free',
      loading: false,
      updateAvatar: vi.fn(),
      updateTier: vi.fn(),
    })
  })

  it('renders navigation links for My Wheel, Snapshots, Trend, Settings', () => {
    render(
      <MemoryRouter initialEntries={['/wheel']}>
        <Sidebar />
      </MemoryRouter>
    )
    expect(screen.getByRole('link', { name: /my wheel/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /snapshots/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /trend/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument()
  })

  it('calls signOut when the sign-out button is clicked', async () => {
    const mockSignOut = vi.fn().mockResolvedValue(undefined)
    mockUseAuth.mockReturnValue({ session: {} as any, signOut: mockSignOut })
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    )
    await user.click(screen.getByRole('button', { name: /sign out/i }))
    expect(mockSignOut).toHaveBeenCalledOnce()
  })

  it('renders letter initial when avatarUrl is null', () => {
    mockUseAuth.mockReturnValue({
      session: { user: { id: 'user-1', email: 'alice@example.com' } } as any,
      signOut: vi.fn(),
    })
    mockUseProfile.mockReturnValue({
      avatarUrl: null,
      tier: 'free',
      loading: false,
      updateAvatar: vi.fn(),
      updateTier: vi.fn(),
    })
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    )
    expect(screen.queryByRole('img', { name: /your avatar/i })).not.toBeInTheDocument()
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('renders img element with avatarUrl when avatar is set', () => {
    mockUseAuth.mockReturnValue({
      session: { user: { id: 'user-1', email: 'alice@example.com' } } as any,
      signOut: vi.fn(),
    })
    mockUseProfile.mockReturnValue({
      avatarUrl: 'https://example.com/avatar.jpg',
      tier: 'free',
      loading: false,
      updateAvatar: vi.fn(),
      updateTier: vi.fn(),
    })
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    )
    const img = screen.getByRole('img', { name: /your avatar/i })
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg')
  })
})
