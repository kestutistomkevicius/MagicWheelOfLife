import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
// import userEvent from '@testing-library/user-event'
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

    it('calls onAsisCommit when as-is slider commits (pointer up)', () => {
      const onAsisCommit = vi.fn()
      render(<CategorySlider {...defaultProps} onAsisCommit={onAsisCommit} />)
      const asisSlider = screen.getByLabelText('As-Is score for Health')
      fireEvent.mouseUp(asisSlider)
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

    it('calls onTobeCommit when to-be slider commits', () => {
      const onTobeCommit = vi.fn()
      render(<CategorySlider {...defaultProps} onTobeCommit={onTobeCommit} />)
      const tobeSlider = screen.getByLabelText('To-Be score for Health')
      fireEvent.mouseUp(tobeSlider)
      expect(onTobeCommit).toHaveBeenCalled()
    })
  })

  describe('expand toggle', () => {
    it('does not render expand button when onExpandToggle is not provided', () => {
      render(<CategorySlider {...defaultProps} />)
      expect(screen.queryByLabelText(/expand action items/i)).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/collapse action items/i)).not.toBeInTheDocument()
    })

    it('renders expand button with correct aria-label when onExpandToggle is provided', () => {
      const onExpandToggle = vi.fn()
      render(<CategorySlider {...defaultProps} onExpandToggle={onExpandToggle} isExpanded={false} />)
      expect(screen.getByLabelText('Expand action items')).toBeInTheDocument()
    })

    it('renders collapse button with correct aria-label when isExpanded is true', () => {
      const onExpandToggle = vi.fn()
      render(<CategorySlider {...defaultProps} onExpandToggle={onExpandToggle} isExpanded={true} />)
      expect(screen.getByLabelText('Collapse action items')).toBeInTheDocument()
    })

    it('calls onExpandToggle when expand button is clicked', () => {
      const onExpandToggle = vi.fn()
      render(<CategorySlider {...defaultProps} onExpandToggle={onExpandToggle} isExpanded={false} />)
      fireEvent.click(screen.getByLabelText('Expand action items'))
      expect(onExpandToggle).toHaveBeenCalledTimes(1)
    })
  })

  describe('star icon for important toggle (POLISH-04)', () => {
    it('does not render star when onToggleImportant is undefined', () => {
      render(<CategorySlider {...defaultProps} />)
      expect(screen.queryByRole('button', { name: /important/i })).not.toBeInTheDocument()
    })

    it('renders star button when onToggleImportant is provided', () => {
      const onToggleImportant = vi.fn()
      render(
        <CategorySlider
          {...defaultProps}
          onToggleImportant={onToggleImportant}
          userTier="premium"
          isImportant={false}
          importantCount={0}
        />
      )
      expect(screen.getByRole('button', { name: /mark Health as important/i })).toBeInTheDocument()
    })

    it('clicking star (premium, not at limit) calls onToggleImportant', () => {
      const onToggleImportant = vi.fn()
      render(
        <CategorySlider
          {...defaultProps}
          onToggleImportant={onToggleImportant}
          userTier="premium"
          isImportant={false}
          importantCount={0}
        />
      )
      fireEvent.click(screen.getByRole('button', { name: /mark Health as important/i }))
      expect(onToggleImportant).toHaveBeenCalledTimes(1)
    })

    it('clicking star (free tier) does NOT call onToggleImportant', () => {
      const onToggleImportant = vi.fn()
      render(
        <CategorySlider
          {...defaultProps}
          onToggleImportant={onToggleImportant}
          userTier="free"
          isImportant={false}
          importantCount={0}
        />
      )
      fireEvent.click(screen.getByRole('button', { name: /mark Health as important/i }))
      expect(onToggleImportant).not.toHaveBeenCalled()
    })

    it('free user star has title "Premium feature — upgrade to mark priorities"', () => {
      const onToggleImportant = vi.fn()
      render(
        <CategorySlider
          {...defaultProps}
          onToggleImportant={onToggleImportant}
          userTier="free"
          isImportant={false}
          importantCount={0}
        />
      )
      const starBtn = screen.getByRole('button', { name: /mark Health as important/i })
      expect(starBtn).toHaveAttribute('title', 'Premium feature — upgrade to mark priorities')
    })

    it('premium user at limit (importantCount=3) star has title "3 priority categories already set"', () => {
      const onToggleImportant = vi.fn()
      render(
        <CategorySlider
          {...defaultProps}
          onToggleImportant={onToggleImportant}
          userTier="premium"
          isImportant={false}
          importantCount={3}
        />
      )
      const starBtn = screen.getByRole('button', { name: /mark Health as important/i })
      expect(starBtn).toHaveAttribute('title', '3 priority categories already set')
    })

    it('premium user at limit does NOT call onToggleImportant when clicked', () => {
      const onToggleImportant = vi.fn()
      render(
        <CategorySlider
          {...defaultProps}
          onToggleImportant={onToggleImportant}
          userTier="premium"
          isImportant={false}
          importantCount={3}
        />
      )
      fireEvent.click(screen.getByRole('button', { name: /mark Health as important/i }))
      expect(onToggleImportant).not.toHaveBeenCalled()
    })

    it('star aria-pressed=true when isImportant=true', () => {
      const onToggleImportant = vi.fn()
      render(
        <CategorySlider
          {...defaultProps}
          onToggleImportant={onToggleImportant}
          userTier="premium"
          isImportant={true}
          importantCount={1}
        />
      )
      const starBtn = screen.getByRole('button', { name: /unmark Health as important/i })
      expect(starBtn).toHaveAttribute('aria-pressed', 'true')
    })

    it('star aria-pressed=false when isImportant=false', () => {
      const onToggleImportant = vi.fn()
      render(
        <CategorySlider
          {...defaultProps}
          onToggleImportant={onToggleImportant}
          userTier="premium"
          isImportant={false}
          importantCount={0}
        />
      )
      const starBtn = screen.getByRole('button', { name: /mark Health as important/i })
      expect(starBtn).toHaveAttribute('aria-pressed', 'false')
    })
  })

  describe('AI Coach button (AI-01)', () => {
    it('does not render AI Coach button when onAiCoach is not provided', () => {
      render(<CategorySlider {...defaultProps} />)
      expect(screen.queryByRole('button', { name: /ai coach/i })).not.toBeInTheDocument()
    })

    it('renders AI Coach button when onAiCoach is provided', () => {
      const onAiCoach = vi.fn()
      render(<CategorySlider {...defaultProps} onAiCoach={onAiCoach} isPremiumForAi={true} />)
      expect(screen.getByRole('button', { name: /ai coach/i })).toBeInTheDocument()
    })

    it('clicking AI Coach calls onAiCoach when isPremiumForAi=true', () => {
      const onAiCoach = vi.fn()
      render(<CategorySlider {...defaultProps} onAiCoach={onAiCoach} isPremiumForAi={true} />)
      fireEvent.click(screen.getByRole('button', { name: /ai coach/i }))
      expect(onAiCoach).toHaveBeenCalledTimes(1)
    })

    it('clicking AI Coach does NOT call onAiCoach when isPremiumForAi=false', () => {
      const onAiCoach = vi.fn()
      render(<CategorySlider {...defaultProps} onAiCoach={onAiCoach} isPremiumForAi={false} />)
      fireEvent.click(screen.getByRole('button', { name: /ai coach/i }))
      expect(onAiCoach).not.toHaveBeenCalled()
    })

    it('clicking AI Coach when isPremiumForAi=false shows upgrade modal', () => {
      const onAiCoach = vi.fn()
      render(<CategorySlider {...defaultProps} onAiCoach={onAiCoach} isPremiumForAi={false} />)
      fireEvent.click(screen.getByRole('button', { name: /ai coach/i }))
      expect(screen.getByText(/upgrade/i)).toBeInTheDocument()
    })

    it('upgrade modal has a close/dismiss button', () => {
      const onAiCoach = vi.fn()
      render(<CategorySlider {...defaultProps} onAiCoach={onAiCoach} isPremiumForAi={false} />)
      fireEvent.click(screen.getByRole('button', { name: /ai coach/i }))
      const closeBtn = screen.getByRole('button', { name: /close/i })
      expect(closeBtn).toBeInTheDocument()
      fireEvent.click(closeBtn)
      expect(screen.queryByText(/upgrade/i)).not.toBeInTheDocument()
    })
  })

  describe('rename button UX (fix for UX debt)', () => {
    it('clicking Rename button shows inline input without immediately calling onRename', () => {
      const onRename = vi.fn()
      render(<CategorySlider {...defaultProps} onRename={onRename} />)
      fireEvent.click(screen.getByText('Rename'))
      // Input should appear
      expect(screen.getByDisplayValue('Health')).toBeInTheDocument()
      // onRename should NOT have been called yet
      expect(onRename).not.toHaveBeenCalled()
    })

    it('calls onRename with new name when user submits via Enter key', () => {
      const onRename = vi.fn()
      render(<CategorySlider {...defaultProps} onRename={onRename} />)
      fireEvent.click(screen.getByText('Rename'))
      const input = screen.getByDisplayValue('Health')
      fireEvent.change(input, { target: { value: 'Wellness' } })
      fireEvent.keyDown(input, { key: 'Enter' })
      expect(onRename).toHaveBeenCalledWith('Wellness')
    })
  })
})
