import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthPage } from './AuthPage'

// Mock the Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signInWithOAuth: vi.fn(),
    },
  },
}))

import { supabase } from '@/lib/supabase'
const mockSignIn = vi.mocked(supabase.auth.signInWithPassword)
const mockSignUp = vi.mocked(supabase.auth.signUp)
const mockOAuth = vi.mocked(supabase.auth.signInWithOAuth)

describe('AuthPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSignIn.mockResolvedValue({ data: { session: null, user: null }, error: null } as any)
    mockSignUp.mockResolvedValue({ data: { session: null, user: null }, error: null } as any)
    mockOAuth.mockResolvedValue({ data: { provider: 'google', url: 'https://google.com' }, error: null } as any)
  })

  it('renders sign-in form with email and password fields', () => {
    render(<AuthPage />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    // Default mode is sign-in — submit button says "Sign in"
    expect(screen.getByRole('button', { name: /^sign in$/i })).toBeInTheDocument()
  })

  it('calls supabase.auth.signInWithPassword on sign-in submit', async () => {
    const user = userEvent.setup()
    render(<AuthPage />)
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })
  })

  it('calls supabase.auth.signUp on create account submit', async () => {
    const user = userEvent.setup()
    render(<AuthPage />)
    // Switch to create-account mode by clicking the toggle
    await user.click(screen.getByRole('button', { name: /create account/i }))
    await user.type(screen.getByLabelText(/email/i), 'new@example.com')
    await user.type(screen.getByLabelText(/password/i), 'newpassword')
    // Submit button now says "Create account"
    await user.click(screen.getByRole('button', { name: /^create account$/i }))
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'newpassword',
      })
    })
  })

  it('shows inline error when sign-in returns an error', async () => {
    mockSignIn.mockResolvedValue({ data: { session: null, user: null }, error: { message: 'Invalid login credentials' } } as any)
    const user = userEvent.setup()
    render(<AuthPage />)
    await user.type(screen.getByLabelText(/email/i), 'bad@example.com')
    await user.type(screen.getByLabelText(/password/i), 'wrongpass')
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid login credentials')
    })
  })

  it('renders "Continue with Google" button', () => {
    render(<AuthPage />)
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument()
  })

  it('calls supabase.auth.signInWithOAuth with provider google on Google button click', async () => {
    const user = userEvent.setup()
    render(<AuthPage />)
    await user.click(screen.getByRole('button', { name: /continue with google/i }))
    await waitFor(() => {
      expect(mockOAuth).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'google' })
      )
    })
  })

  it('does NOT render an Apple sign-in button', () => {
    render(<AuthPage />)
    expect(screen.queryByRole('button', { name: /apple/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /continue with apple/i })).not.toBeInTheDocument()
  })
})
