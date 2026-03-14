import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../hooks/useAuth'

export function ProtectedRoute() {
  const { session } = useAuth()
  const location = useLocation()

  if (session === undefined) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-400 border-t-transparent" />
      </div>
    )
  }

  if (session === null) {
    return <Navigate to="/auth" replace state={{ from: location }} />
  }

  return <Outlet />
}
