import { useState } from 'react'
import { NavLink } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { useWheel } from '@/hooks/useWheel'
import { cn } from '@/lib/utils'
import {
  Circle,
  Camera,
  TrendingUp,
  Settings,
  LogOut,
  MessageSquare,
} from 'lucide-react'
import { FeatureRequestModal } from '@/components/FeatureRequestModal'

const staticNavItems = [
  { to: '/snapshots', label: 'Snapshots', icon: Camera },
  { to: '/trend', label: 'Trend', icon: TrendingUp },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const { signOut, session } = useAuth()
  const userId = session?.user?.id ?? ''
  const email = session?.user?.email ?? ''
  const initial = email.charAt(0).toUpperCase()
  const { avatarUrl } = useProfile(userId)
  const { wheels } = useWheel(userId)
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  const wheelLabel = wheels.length > 1 ? 'My Wheels' : 'My Wheel'
  const navItems = [
    { to: '/wheel', label: wheelLabel, icon: Circle },
    ...staticNavItems,
  ]

  return (
    <aside className="flex h-screen w-56 flex-col bg-palette-accent text-stone-300">
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

      {/* Feedback button */}
      <div className="px-2 pb-2">
        <button
          onClick={() => setFeedbackOpen(true)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-stone-400 transition-colors hover:bg-stone-700 hover:text-stone-100"
        >
          <MessageSquare className="h-4 w-4 shrink-0" aria-hidden="true" />
          Share feedback
        </button>
      </div>

      {/* User + Sign out */}
      <div className="border-t border-stone-700 p-3 space-y-2">
        <div className="flex items-center gap-3 px-1">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Your avatar"
              className="h-7 w-7 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-400 text-xs font-bold text-white">
              {initial}
            </div>
          )}
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
      {/* Legal footer */}
      <div className="px-4 pb-3 flex gap-4">
        <NavLink
          to="/terms"
          className="text-xs text-stone-500 hover:text-stone-300 transition-colors"
        >
          Terms
        </NavLink>
        <NavLink
          to="/privacy"
          className="text-xs text-stone-500 hover:text-stone-300 transition-colors"
        >
          Privacy
        </NavLink>
      </div>
      <FeatureRequestModal open={feedbackOpen} userId={userId} onClose={() => setFeedbackOpen(false)} />
    </aside>
  )
}
