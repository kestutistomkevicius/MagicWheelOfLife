import { NavLink } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import {
  Circle,
  Camera,
  TrendingUp,
  Settings,
  LogOut,
} from 'lucide-react'

const navItems = [
  { to: '/wheel', label: 'My Wheel', icon: Circle },
  { to: '/snapshots', label: 'Snapshots', icon: Camera },
  { to: '/trend', label: 'Trend', icon: TrendingUp },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const { signOut, session } = useAuth()
  const email = session?.user?.email ?? ''
  const initial = email.charAt(0).toUpperCase()

  return (
    <aside className="flex h-screen w-56 flex-col bg-[#292524] text-stone-300">
      {/* Brand */}
      <div className="px-4 py-6">
        <span className="text-base font-bold text-white">JustAWheelOfLife</span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 space-y-1 px-2" aria-label="Main navigation">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-brand-400/20 text-white border-l-2 border-brand-400'
                  : 'text-stone-400 hover:bg-stone-700 hover:text-stone-100'
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User + Sign out */}
      <div className="border-t border-stone-700 p-3 space-y-2">
        <div className="flex items-center gap-3 px-1">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-400 text-xs font-bold text-white">
            {initial}
          </div>
          <span className="truncate text-xs text-stone-300">{email}</span>
        </div>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-stone-400 transition-colors hover:bg-stone-700 hover:text-stone-100"
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
