import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { Sidebar } from './Sidebar'

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

import { useAuth } from '@/hooks/useAuth'
const mockUseAuth = vi.mocked(useAuth)

describe('Sidebar', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ session: {} as any, signOut: vi.fn() })
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
})
