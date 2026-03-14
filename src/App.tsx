import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AppShell } from './components/AppShell'
import { AuthPage } from './pages/AuthPage'
import { WheelPage } from './pages/WheelPage'
import { SnapshotsPage } from './pages/SnapshotsPage'
import { TrendPage } from './pages/TrendPage'
import { SettingsPage } from './pages/SettingsPage'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
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
