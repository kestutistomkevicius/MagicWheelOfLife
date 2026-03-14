import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router'
import { ProtectedRoute } from './components/ProtectedRoute'
import { WheelPage } from './pages/WheelPage'
import { SnapshotsPage } from './pages/SnapshotsPage'
import { TrendPage } from './pages/TrendPage'
import { SettingsPage } from './pages/SettingsPage'

// AuthPage placeholder — replaced by real component in Plan 04
function AuthPagePlaceholder() {
  return <div className="flex h-screen items-center justify-center">Auth</div>
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPagePlaceholder />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Outlet />}>
            <Route path="/wheel" element={<WheelPage />} />
            <Route path="/snapshots" element={<SnapshotsPage />} />
            <Route path="/trend" element={<TrendPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/" element={<Navigate to="/wheel" replace />} />
            <Route path="*" element={<Navigate to="/wheel" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
