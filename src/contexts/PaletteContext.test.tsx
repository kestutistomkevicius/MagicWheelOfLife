import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import React from 'react'

// ── localStorage mock ─────────────────────────────────────────────────────────
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()
Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true })

import { applyPalette, PaletteProvider, usePalette, PALETTES } from './PaletteContext'

describe('applyPalette', () => {
  beforeEach(() => {
    vi.spyOn(document.documentElement.style, 'setProperty').mockImplementation(() => {})
    localStorageMock.clear()
  })

  it('applyPalette("amber") sets --palette-primary to #e8a23a on document.documentElement', () => {
    applyPalette('amber')
    expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--palette-primary', '#e8a23a')
  })

  it('applyPalette("amber") sets --palette-secondary to #60a5fa', () => {
    applyPalette('amber')
    expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--palette-secondary', '#60a5fa')
  })

  it('applyPalette("amber") sets --palette-accent to #292524', () => {
    applyPalette('amber')
    expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--palette-accent', '#292524')
  })

  it('applyPalette("amber") sets --palette-important to #b45309', () => {
    applyPalette('amber')
    expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--palette-important', '#b45309')
  })

  it('applyPalette("amber") sets --palette-highlight to #fbbf24', () => {
    applyPalette('amber')
    expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--palette-highlight', '#fbbf24')
  })

  it('applyPalette("ocean") sets --palette-primary to #0ea5e9', () => {
    applyPalette('ocean')
    expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--palette-primary', '#0ea5e9')
  })

  it('applyPalette with unknown name falls back to amber palette values', () => {
    applyPalette('nonexistent-palette')
    expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--palette-primary', '#e8a23a')
  })
})

describe('PaletteProvider + usePalette', () => {
  beforeEach(() => {
    vi.spyOn(document.documentElement.style, 'setProperty').mockImplementation(() => {})
    localStorageMock.clear()
  })

  it('usePalette() returns current palette name and applyPalette function', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PaletteProvider colorScheme="amber">{children}</PaletteProvider>
    )
    const { result } = renderHook(() => usePalette(), { wrapper })
    expect(result.current.currentPalette).toBe('amber')
    expect(typeof result.current.applyPalette).toBe('function')
  })

  it('PaletteProvider reads localStorage "palette" key on mount and applies it', () => {
    localStorageMock.setItem('palette', 'ocean')
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PaletteProvider colorScheme="amber">{children}</PaletteProvider>
    )
    const { result } = renderHook(() => usePalette(), { wrapper })
    expect(result.current.currentPalette).toBe('ocean')
    expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--palette-primary', PALETTES.ocean['--palette-primary'])
  })

  it('PaletteProvider falls back to colorScheme prop when localStorage has no entry', () => {
    // localStorage is clear (no 'palette' key)
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PaletteProvider colorScheme="forest">{children}</PaletteProvider>
    )
    const { result } = renderHook(() => usePalette(), { wrapper })
    expect(result.current.currentPalette).toBe('forest')
    expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--palette-primary', PALETTES.forest['--palette-primary'])
  })

  it('PaletteProvider re-applies palette when colorScheme prop changes', () => {
    let scheme = 'amber'
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PaletteProvider colorScheme={scheme}>{children}</PaletteProvider>
    )
    const { result, rerender } = renderHook(() => usePalette(), { wrapper })
    expect(result.current.currentPalette).toBe('amber')

    act(() => {
      scheme = 'rose'
    })
    rerender()

    expect(result.current.currentPalette).toBe('rose')
    expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--palette-primary', PALETTES.rose['--palette-primary'])
  })
})
