import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FeatureRequestModal } from './FeatureRequestModal'

const { mockFrom } = vi.hoisted(() => {
  const mockFrom = vi.fn()
  return { mockFrom }
})

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
}))

function buildInsertChain(result: { data: unknown; error: unknown | null }) {
  const chain: Record<string, unknown> = {}
  chain.insert = vi.fn().mockReturnValue(chain)
  chain.then = (resolve: (v: unknown) => void, reject?: (e: unknown) => void) =>
    Promise.resolve(result).then(resolve, reject)
  return chain
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('FeatureRequestModal', () => {
  it('renders a textarea for feature request text', () => {
    render(
      <FeatureRequestModal open={true} userId="user-1" onClose={vi.fn()} />
    )
    expect(
      screen.getByPlaceholderText(/what would make this app better/i)
    ).toBeInTheDocument()
  })

  it('disables submit button when text is fewer than 10 characters', async () => {
    const user = userEvent.setup()
    render(
      <FeatureRequestModal open={true} userId="user-1" onClose={vi.fn()} />
    )
    const textarea = screen.getByPlaceholderText(/what would make this app better/i)
    await user.type(textarea, '123456789') // 9 chars
    expect(screen.getByRole('button', { name: /send feedback/i })).toBeDisabled()
  })

  it('enables submit when text is 10+ characters', async () => {
    const user = userEvent.setup()
    render(
      <FeatureRequestModal open={true} userId="user-1" onClose={vi.fn()} />
    )
    const textarea = screen.getByPlaceholderText(/what would make this app better/i)
    await user.type(textarea, '1234567890') // 10 chars
    expect(screen.getByRole('button', { name: /send feedback/i })).not.toBeDisabled()
  })

  it('calls supabase insert with user_id and text on submit', async () => {
    const chain = buildInsertChain({ data: null, error: null })
    mockFrom.mockReturnValue(chain)
    const user = userEvent.setup()
    render(
      <FeatureRequestModal open={true} userId="user-1" onClose={vi.fn()} />
    )
    const textarea = screen.getByPlaceholderText(/what would make this app better/i)
    await user.type(textarea, 'This is my feature request')
    await user.click(screen.getByRole('button', { name: /send feedback/i }))
    expect(mockFrom).toHaveBeenCalledWith('feature_requests')
    expect(chain.insert).toHaveBeenCalledWith({
      user_id: 'user-1',
      text: 'This is my feature request',
    })
  })

  it('shows success state after successful submit', async () => {
    const chain = buildInsertChain({ data: null, error: null })
    mockFrom.mockReturnValue(chain)
    const user = userEvent.setup()
    render(
      <FeatureRequestModal open={true} userId="user-1" onClose={vi.fn()} />
    )
    const textarea = screen.getByPlaceholderText(/what would make this app better/i)
    await user.type(textarea, 'This is my feature request')
    await user.click(screen.getByRole('button', { name: /send feedback/i }))
    await waitFor(() => {
      expect(screen.getByText(/thanks/i)).toBeInTheDocument()
    })
  })
})
