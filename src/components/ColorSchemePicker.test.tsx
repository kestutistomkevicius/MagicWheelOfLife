import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PALETTES } from '@/contexts/PaletteContext'
import { ColorSchemePicker } from './ColorSchemePicker'

const paletteNames = Object.keys(PALETTES) // ['amber', 'ocean', 'forest', 'rose']

describe('ColorSchemePicker', () => {
  const onSelect = vi.fn()

  beforeEach(() => {
    onSelect.mockClear()
  })

  it('renders a swatch button for each palette', () => {
    render(
      <ColorSchemePicker currentPalette="amber" isPremium={true} onSelect={onSelect} />
    )
    // One button per palette key
    for (const name of paletteNames) {
      expect(screen.getByRole('button', { name: new RegExp(name, 'i') })).toBeInTheDocument()
    }
  })

  it('selected swatch has aria-pressed true or a ring indicator', () => {
    render(
      <ColorSchemePicker currentPalette="amber" isPremium={true} onSelect={onSelect} />
    )
    const amberBtn = screen.getByRole('button', { name: /amber/i })
    expect(amberBtn).toHaveAttribute('aria-pressed', 'true')
  })

  it('clicking a swatch calls onSelect with the palette name (premium user)', () => {
    render(
      <ColorSchemePicker currentPalette="amber" isPremium={true} onSelect={onSelect} />
    )
    const oceanBtn = screen.getByRole('button', { name: /ocean/i })
    fireEvent.click(oceanBtn)
    expect(onSelect).toHaveBeenCalledWith('ocean')
  })

  it('premium user can click any swatch without upgrade prompt', () => {
    render(
      <ColorSchemePicker currentPalette="amber" isPremium={true} onSelect={onSelect} />
    )
    for (const name of paletteNames) {
      const btn = screen.getByRole('button', { name: new RegExp(name, 'i') })
      fireEvent.click(btn)
      expect(onSelect).toHaveBeenCalledWith(name)
      onSelect.mockClear()
    }
    expect(screen.queryByText(/premium feature/i)).not.toBeInTheDocument()
  })

  it('free user sees lock overlay on non-amber swatches', () => {
    render(
      <ColorSchemePicker currentPalette="amber" isPremium={false} onSelect={onSelect} />
    )
    // Non-amber swatches should have a lock indicator (aria-label includes "locked" or similar)
    const nonAmberNames = paletteNames.filter(n => n !== 'amber')
    for (const name of nonAmberNames) {
      const lockEl = screen.getByTestId(`lock-overlay-${name}`)
      expect(lockEl).toBeInTheDocument()
    }
    // Amber should NOT have lock overlay
    expect(screen.queryByTestId('lock-overlay-amber')).not.toBeInTheDocument()
  })

  it('free user clicking a locked swatch triggers upgrade prompt, onSelect not called', () => {
    render(
      <ColorSchemePicker currentPalette="amber" isPremium={false} onSelect={onSelect} />
    )
    const oceanBtn = screen.getByRole('button', { name: /ocean/i })
    fireEvent.click(oceanBtn)
    expect(onSelect).not.toHaveBeenCalled()
    expect(screen.getByText(/color palettes are a premium feature/i)).toBeInTheDocument()
  })

  it('free user amber swatch is clickable without upgrade prompt', () => {
    render(
      <ColorSchemePicker currentPalette="ocean" isPremium={false} onSelect={onSelect} />
    )
    const amberBtn = screen.getByRole('button', { name: /amber/i })
    fireEvent.click(amberBtn)
    expect(onSelect).toHaveBeenCalledWith('amber')
    expect(screen.queryByText(/premium feature/i)).not.toBeInTheDocument()
  })

  it('upgrade prompt modal has a close/dismiss button', () => {
    render(
      <ColorSchemePicker currentPalette="amber" isPremium={false} onSelect={onSelect} />
    )
    const oceanBtn = screen.getByRole('button', { name: /ocean/i })
    fireEvent.click(oceanBtn)
    expect(screen.getByText(/color palettes are a premium feature/i)).toBeInTheDocument()

    const closeBtn = screen.getByRole('button', { name: /close/i })
    fireEvent.click(closeBtn)
    expect(screen.queryByText(/color palettes are a premium feature/i)).not.toBeInTheDocument()
  })
})
