import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AvatarUpload } from './AvatarUpload'

describe('AvatarUpload', () => {
  it('renders camera icon placeholder when no avatar URL is set', () => {
    render(<AvatarUpload currentAvatarUrl={null} onUpload={vi.fn()} />)
    expect(screen.queryByRole('img')).toBeNull()
    // Camera icon placeholder circle is present
    expect(screen.getByLabelText('Change photo')).toBeTruthy()
  })

  it('renders avatar image when currentAvatarUrl is provided', () => {
    render(
      <AvatarUpload
        currentAvatarUrl="https://example.com/avatar.jpg"
        onUpload={vi.fn()}
      />
    )
    const img = screen.getByRole('img')
    expect(img).toBeTruthy()
    expect((img as HTMLImageElement).src).toBe('https://example.com/avatar.jpg')
  })

  it('shows error and does not call onUpload when file exceeds 2 MB', () => {
    const onUpload = vi.fn()
    render(<AvatarUpload currentAvatarUrl={null} onUpload={onUpload} />)

    const input = screen.getByLabelText('Change photo').closest('label')!
      .querySelector('input[type="file"]')!

    const file = new File([], 'big.jpg', { type: 'image/jpeg' })
    Object.defineProperty(file, 'size', { value: 3 * 1024 * 1024 })

    fireEvent.change(input, { target: { files: [file] } })

    expect(onUpload).not.toHaveBeenCalled()
    expect(screen.getByText('File must be under 2 MB')).toBeTruthy()
  })

  it('calls onUpload with valid file', () => {
    const onUpload = vi.fn().mockResolvedValue(undefined)
    render(<AvatarUpload currentAvatarUrl={null} onUpload={onUpload} />)

    const input = screen.getByLabelText('Change photo').closest('label')!
      .querySelector('input[type="file"]')!

    const file = new File([], 'photo.jpg', { type: 'image/jpeg' })
    Object.defineProperty(file, 'size', { value: 1 * 1024 * 1024 })

    fireEvent.change(input, { target: { files: [file] } })

    expect(onUpload).toHaveBeenCalledWith(file)
  })

  it('shows Uploading... and disables button when loading is true', () => {
    render(
      <AvatarUpload currentAvatarUrl={null} onUpload={vi.fn()} loading={true} />
    )
    const button = screen.getByRole('button', { name: 'Uploading...' })
    expect(button).toBeTruthy()
    expect((button as HTMLButtonElement).disabled).toBe(true)
  })
})
