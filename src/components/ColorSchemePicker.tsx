import { useState } from 'react'
import { Check, Lock } from 'lucide-react'
import { PALETTES } from '@/contexts/PaletteContext'

export interface ColorSchemePickerProps {
  currentPalette: string
  isPremium: boolean
  onSelect: (paletteName: string) => void
}

export function ColorSchemePicker({ currentPalette, isPremium, onSelect }: ColorSchemePickerProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  function handleSwatchClick(name: string) {
    if (!isPremium && name !== 'amber') {
      setShowUpgradeModal(true)
      return
    }
    onSelect(name)
  }

  return (
    <>
      <div className="flex gap-4 flex-wrap">
        {Object.entries(PALETTES).map(([name, vars]) => {
          const isSelected = name === currentPalette
          const isLocked = !isPremium && name !== 'amber'

          return (
            <div key={name} className="flex flex-col items-center gap-1">
              <button
                role="button"
                aria-label={name}
                aria-pressed={isSelected}
                onClick={() => handleSwatchClick(name)}
                className={[
                  'relative w-10 h-10 rounded-full focus:outline-none',
                  isSelected ? 'ring-2 ring-offset-2 ring-stone-700' : '',
                ].join(' ')}
                style={{ backgroundColor: vars['--palette-primary'] }}
              >
                {/* Selected checkmark */}
                {isSelected && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <Check className="h-4 w-4 text-white drop-shadow" />
                  </span>
                )}

                {/* Lock overlay for non-free palettes when free user */}
                {isLocked && (
                  <span
                    data-testid={`lock-overlay-${name}`}
                    className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center"
                  >
                    <Lock className="h-4 w-4 text-white" />
                  </span>
                )}
              </button>

              <span className="text-xs text-stone-600 capitalize">{name}</span>
            </div>
          )
        })}
      </div>

      {/* Upgrade prompt modal */}
      {showUpgradeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowUpgradeModal(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-lg bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm text-stone-700 mb-4">
              Color palettes are a premium feature. Upgrade to unlock all color schemes.
            </p>
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="w-full rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
              aria-label="Close"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}
