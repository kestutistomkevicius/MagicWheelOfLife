import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { ProtectedRoute } from './ProtectedRoute'

// Mock useAuth
vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

import { useAuth } from '../hooks/useAuth'

const mockUseAuth = vi.mocked(useAuth)

describe('ProtectedRoute', () => {
  it('renders loading spinner when session is undefined (still loading)', () => {
    mockUseAuth.mockReturnValue({ session: undefined, signOut: vi.fn() })
    render(
      <MemoryRouter initialEntries={['/wheel']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/wheel" element={<div>Protected content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
    // Spinner div exists (has animate-spin class)
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('redirects to /auth when session is null (unauthenticated)', () => {
    mockUseAuth.mockReturnValue({ session: null, signOut: vi.fn() })
    render(
      <MemoryRouter initialEntries={['/wheel']}>
        <Routes>
          <Route path="/auth" element={<div>Auth page</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/wheel" element={<div>Protected content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('Auth page')).toBeInTheDocument()
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })

  it('renders children when session is a valid Session object', () => {
    const fakeSession = { access_token: 'tok', user: { id: '1' } } as any
    mockUseAuth.mockReturnValue({ session: fakeSession, signOut: vi.fn() })
    render(
      <MemoryRouter initialEntries={['/wheel']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/wheel" element={<div>Protected content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('Protected content')).toBeInTheDocument()
  })
})
