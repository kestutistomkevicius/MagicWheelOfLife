import { createContext, useContext, useEffect, useState } from 'react'
import React from 'react'

// ── Palette definitions ───────────────────────────────────────────────────────
// Amber values match existing WheelChart hardcoded hex strings exactly (no visual regression).
export const PALETTES: Record<string, Record<string, string>> = {
  amber: {
    '--palette-primary':   '#e8a23a',  // current WheelChart As-Is fill
    '--palette-secondary': '#60a5fa',  // current WheelChart To-Be fill
    '--palette-accent':    '#292524',  // current sidebar bg (surface-sidebar)
    '--palette-important': '#b45309',  // current important radar fill
    '--palette-highlight': '#fbbf24',  // current highlight fill
  },
  ocean: {
    '--palette-primary':   '#0ea5e9',
    '--palette-secondary': '#6366f1',
    '--palette-accent':    '#0c4a6e',
    '--palette-important': '#0369a1',
    '--palette-highlight': '#38bdf8',
  },
  forest: {
    '--palette-primary':   '#22c55e',
    '--palette-secondary': '#a3e635',
    '--palette-accent':    '#14532d',
    '--palette-important': '#15803d',
    '--palette-highlight': '#4ade80',
  },
  rose: {
    '--palette-primary':   '#f43f5e',
    '--palette-secondary': '#fb923c',
    '--palette-accent':    '#4c0519',
    '--palette-important': '#be123c',
    '--palette-highlight': '#fb7185',
  },
}

// ── Apply palette to :root ────────────────────────────────────────────────────
// Falls back to amber for unknown palette names.
export function applyPalette(name: string): void {
  const vars = PALETTES[name] ?? PALETTES.amber
  const root = document.documentElement
  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })
}

// ── FOUC guard — apply palette synchronously before React renders ─────────────
// Called at module load time so the first paint uses the correct palette.
export function applyPaletteEagerly(): void {
  const stored = localStorage.getItem('palette')
  if (stored) {
    applyPalette(stored)
  }
}

// ── Context ───────────────────────────────────────────────────────────────────
interface PaletteContextValue {
  currentPalette: string
  applyPalette: (name: string) => void
}

const PaletteContext = createContext<PaletteContextValue | null>(null)

// ── Provider ──────────────────────────────────────────────────────────────────
interface PaletteProviderProps {
  colorScheme: string  // from useProfile (async, may lag behind localStorage)
  children: React.ReactNode
}

export function PaletteProvider({ colorScheme, children }: PaletteProviderProps) {
  // Initialise from localStorage (fast path) or fall back to colorScheme prop.
  const [currentPalette, setCurrentPalette] = useState<string>(() => {
    const stored = localStorage.getItem('palette')
    if (stored) {
      applyPalette(stored)
      return stored
    }
    applyPalette(colorScheme)
    return colorScheme
  })

  // When the profile colorScheme prop arrives / changes, apply it (unless
  // localStorage already has a different user choice for this session).
  useEffect(() => {
    const stored = localStorage.getItem('palette')
    if (!stored) {
      // No local override — follow profile preference.
      setCurrentPalette(colorScheme)
      applyPalette(colorScheme)
    }
  }, [colorScheme])

  function handleApplyPalette(name: string): void {
    setCurrentPalette(name)
    applyPalette(name)
    localStorage.setItem('palette', name)
  }

  return (
    <PaletteContext.Provider value={{ currentPalette, applyPalette: handleApplyPalette }}>
      {children}
    </PaletteContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function usePalette(): PaletteContextValue {
  const ctx = useContext(PaletteContext)
  if (!ctx) {
    throw new Error('usePalette must be used within a PaletteProvider')
  }
  return ctx
}
