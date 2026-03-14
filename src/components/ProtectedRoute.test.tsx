import { describe, it } from 'vitest'

// Stub: ProtectedRoute does not exist yet. These tests will pass once Plan 02 implements it.
// AUTH-04: session persists across refresh (undefined/null/session states)

describe('ProtectedRoute', () => {
  it.todo('renders loading spinner when session is undefined (still loading)')
  it.todo('redirects to /auth when session is null (unauthenticated)')
  it.todo('renders children when session is a valid Session object')
})
