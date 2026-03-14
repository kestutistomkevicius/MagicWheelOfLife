import { describe, it } from 'vitest'

// Stub: AuthPage does not exist yet. These tests will pass once Plan 04 implements it.
// AUTH-01: email/password sign-up
// AUTH-02: Google OAuth sign-in

describe('AuthPage', () => {
  it.todo('renders sign-in form with email and password fields')
  it.todo('calls supabase.auth.signUp on create account submit')
  it.todo('calls supabase.auth.signInWithPassword on sign-in submit')
  it.todo('shows inline error when credentials are invalid')
  it.todo('renders "Continue with Google" button')
  it.todo('calls supabase.auth.signInWithOAuth with provider google on Google button click')
})
