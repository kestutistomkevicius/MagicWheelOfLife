import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useProfile } from '@/hooks/useProfile'
import { AvatarUpload } from '@/components/AvatarUpload'
import { ColorSchemePicker } from '@/components/ColorSchemePicker'
import { usePalette } from '@/contexts/PaletteContext'

export function SettingsPage() {
  const { session } = useAuth()
  const userId = session?.user?.id ?? ''
  const { tier, avatarUrl, loading, updateAvatar, updateTier, colorScheme, updateColorScheme } = useProfile(userId)
  const { applyPalette } = usePalette()
  const [uploading, setUploading] = useState(false)

  async function handleUpload(file: File) {
    setUploading(true)
    try {
      await updateAvatar(file)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-semibold text-stone-800">Settings</h1>

      {/* Avatar */}
      <section className="space-y-3">
        <h2 className="text-base font-medium text-stone-700">Profile photo</h2>
        <AvatarUpload
          currentAvatarUrl={avatarUrl}
          onUpload={handleUpload}
          loading={uploading || loading}
        />
      </section>

      {/* Tier */}
      <section className="space-y-3">
        <h2 className="text-base font-medium text-stone-700">Plan</h2>
        <span
          className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${
            tier === 'premium'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-stone-100 text-stone-700'
          }`}
        >
          {tier === 'premium' ? 'Premium' : 'Free'}
        </span>
      </section>

      {/* Color scheme (PREMIUM-02) */}
      <section>
        <h2 className="text-sm font-medium text-stone-500 mb-3">Color scheme</h2>
        <ColorSchemePicker
          currentPalette={colorScheme}
          isPremium={tier === 'premium'}
          onSelect={(name) => {
            applyPalette(name)
            void updateColorScheme(name)
          }}
        />
      </section>

      {/* Dev-only tier toggle */}
      {(import.meta.env.DEV || import.meta.env.VITE_SHOW_TIER_TOGGLE === 'true') && (
        <section className="rounded border border-amber-300 bg-amber-50 p-4 space-y-2">
          <p className="text-xs font-medium text-amber-700">Dev only — not shown in production</p>
          <p className="text-xs text-amber-600">
            Current tier: <strong>{tier}</strong>
          </p>
          <button
            onClick={() => void updateTier(tier === 'free' ? 'premium' : 'free')}
            className="rounded bg-amber-500 px-3 py-1 text-xs font-medium text-white hover:bg-amber-600"
          >
            Switch to {tier === 'free' ? 'premium' : 'free'}
          </button>
        </section>
      )}
    </div>
  )
}
