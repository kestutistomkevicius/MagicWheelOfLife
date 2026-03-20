import { Outlet } from 'react-router'
import { Sidebar } from './Sidebar'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { PaletteProvider } from '@/contexts/PaletteContext'

export function AppShell() {
  const { session } = useAuth()
  const userId = session?.user?.id ?? ''
  const { colorScheme } = useProfile(userId)

  return (
    <PaletteProvider colorScheme={colorScheme}>
      <div className="flex h-screen overflow-hidden bg-surface">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </PaletteProvider>
  )
}
