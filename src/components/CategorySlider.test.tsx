import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CategorySlider } from './CategorySlider'

// Mock the shadcn Slider component to make it testable in jsdom.
// The real Radix Slider uses pointer events which don't fully work in jsdom.
vi.mock('@/components/ui/slider', () => ({
  Slider: ({
    value,
    onValueChange,
    onValueCommit,
    'aria-label': ariaLabel,
  }: {
    value: number[]
    onValueChange: (v: number[]) => void
    onValueCommit: (v: number[]) => void
    'aria-label'?: string
  }) => (
    <input
      type="range"
      aria-label={ariaLabel}
      value={value[0]}
      min={1}
      max={10}
      step={1}
      onChange={(e) => onValueChange([Number(e.target.value)])}
      onMouseUp={(e) => onValueCommit([Number((e.target as HTMLInputElement).value)])}
    />
  ),
}))

describe('CategorySlider', () => {
  const defaultProps = {
    categoryName: 'Health',
    asisValue: 5,
    tobeValue: 7,
    onAsisChange: vi.fn(),
    onAsisCommit: vi.fn(),
    onTobeChange: vi.fn(),
    onTobeCommit: vi.fn(),
  }

  it('renders the categoryName label', () => {
    render(<CategorySlider {...defaultProps} />)
    expect(screen.getByText('Health')).toBeInTheDocument()
  })

  it('displays asisValue as the current as-is score number', () => {
    render(<CategorySlider {...defaultProps} />)
    const scoreSpans = screen.getAllByText('5')
    expect(scoreSpans.length).toBeGreaterThan(0)
  })

  it('displays tobeValue as the current to-be score number', () => {
    render(<CategorySlider {...defaultProps} />)
    const scoreSpans = screen.getAllByText('7')
    expect(scoreSpans.length).toBeGreaterThan(0)
  })

  describe('as-is slider (SCORE-01)', () => {
    it('calls onAsisChange when as-is slider value changes', () => {
      const onAsisChange = vi.fn()
      render(<CategorySlider {...defaultProps} onAsisChange={onAsisChange} />)
      const asisSlider = screen.getByLabelText('As-Is score for Health')
      fireEvent.change(asisSlider, { target: { value: '6' } })
      expect(onAsisChange).toHaveBeenCalledWith(6)
    })

    it('calls onAsisCommit when as-is slider commits (pointer up)', async () => {
      const onAsisCommit = vi.fn()
      render(<CategorySlider {...defaultProps} onAsisCommit={onAsisCommit} />)
      const asisSlider = screen.getByLabelText('As-Is score for Health')
      await userEvent.pointer([
        { target: asisSlider, keys: '[MouseLeft>]' },
        { keys: '[/MouseLeft]' },
      ])
      expect(onAsisCommit).toHaveBeenCalled()
    })
  })

  describe('to-be slider (SCORE-02)', () => {
    it('calls onTobeChange when to-be slider value changes', () => {
      const onTobeChange = vi.fn()
      render(<CategorySlider {...defaultProps} onTobeChange={onTobeChange} />)
      const tobeSlider = screen.getByLabelText('To-Be score for Health')
      fireEvent.change(tobeSlider, { target: { value: '8' } })
      expect(onTobeChange).toHaveBeenCalledWith(8)
    })

    it('calls onTobeCommit when to-be slider commits', async () => {
      const onTobeCommit = vi.fn()
      render(<CategorySlider {...defaultProps} onTobeCommit={onTobeCommit} />)
      const tobeSlider = screen.getByLabelText('To-Be score for Health')
      await userEvent.pointer([
        { target: tobeSlider, keys: '[MouseLeft>]' },
        { keys: '[/MouseLeft]' },
      ])
      expect(onTobeCommit).toHaveBeenCalled()
    })
  })
})
