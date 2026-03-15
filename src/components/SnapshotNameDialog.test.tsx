import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SnapshotNameDialog } from './SnapshotNameDialog'

// shadcn Dialog uses Radix UI portals and focus management which don't work well in jsdom.
// We mock the dialog primitives to render children inline.
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-header">{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h2 data-testid="dialog-title">{children}</h2>
  ),
  DialogFooter: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-footer">{children}</div>
  ),
}))

function renderDialog(props: Partial<Parameters<typeof SnapshotNameDialog>[0]> = {}) {
  const defaults = {
    open: true,
    onOpenChange: vi.fn(),
    onSave: vi.fn().mockResolvedValue(undefined),
    isSaving: false,
  }
  return render(<SnapshotNameDialog {...defaults} {...props} />)
}

describe('SnapshotNameDialog', () => {
  it('renders the name input and a date preview showing today (SNAP-01)', () => {
    renderDialog()
    expect(screen.getByLabelText(/snapshot name/i)).toBeInTheDocument()
    // Preview line should include today's year at minimum
    expect(screen.getByText(/will be saved as/i)).toBeInTheDocument()
    const year = new Date().getFullYear().toString()
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument()
  })

  it('calls onSave with the trimmed name when Save is clicked', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    renderDialog({ onSave })
    const input = screen.getByLabelText(/snapshot name/i)
    await userEvent.type(input, '  Q1 Review  ')
    const saveBtn = screen.getByRole('button', { name: /save snapshot/i })
    fireEvent.click(saveBtn)
    expect(onSave).toHaveBeenCalledWith('Q1 Review')
  })

  it('does not call onSave when name is empty or only whitespace', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    renderDialog({ onSave })
    const saveBtn = screen.getByRole('button', { name: /save snapshot/i })
    // Button should be disabled (empty)
    expect(saveBtn).toBeDisabled()
    fireEvent.click(saveBtn)
    expect(onSave).not.toHaveBeenCalled()
  })

  it('Save button is disabled when name is empty', () => {
    renderDialog()
    const saveBtn = screen.getByRole('button', { name: /save snapshot/i })
    expect(saveBtn).toBeDisabled()
  })

  it('Save button is disabled while isSaving is true', async () => {
    renderDialog({ isSaving: true })
    // Type something so the only disability reason is isSaving
    const input = screen.getByLabelText(/snapshot name/i)
    await userEvent.type(input, 'Q1')
    const saveBtn = screen.getByRole('button', { name: /saving/i })
    expect(saveBtn).toBeDisabled()
  })

  it('calls onOpenChange(false) when Cancel is clicked', () => {
    const onOpenChange = vi.fn()
    renderDialog({ onOpenChange })
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('preview text updates with typed name', async () => {
    renderDialog()
    const input = screen.getByLabelText(/snapshot name/i)
    await userEvent.type(input, 'Q1 Review')
    expect(screen.getByText(/Q1 Review/)).toBeInTheDocument()
  })
})
