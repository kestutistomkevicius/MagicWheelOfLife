import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AiCoachDrawer } from './AiCoachDrawer'
import type { UseAiChatResult } from '@/hooks/useAiChat'

// Mock useAiChat hook
const { mockUseAiChat } = vi.hoisted(() => {
  const mockUseAiChat = vi.fn()
  return { mockUseAiChat }
})

vi.mock('@/hooks/useAiChat', () => ({
  useAiChat: mockUseAiChat,
}))

function makeHookResult(overrides: Partial<UseAiChatResult> = {}): UseAiChatResult {
  return {
    messages: [],
    streaming: false,
    proposal: null,
    error: null,
    sendMessage: vi.fn().mockResolvedValue(undefined),
    retry: vi.fn().mockResolvedValue(undefined),
    loadHistory: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

const defaultProps = {
  categoryId: 'cat-1',
  categoryName: 'Health',
  asisScore: 6,
  tobeScore: 9,
  onApplyAsis: vi.fn(),
  onApplyTobe: vi.fn(),
  onClose: vi.fn(),
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUseAiChat.mockReturnValue(makeHookResult())
})

describe('AiCoachDrawer', () => {
  it('renders category name in drawer header', () => {
    render(<AiCoachDrawer {...defaultProps} />)
    expect(screen.getByText('Health')).toBeInTheDocument()
  })

  it('renders existing chat messages in the thread', () => {
    mockUseAiChat.mockReturnValue(
      makeHookResult({
        messages: [
          { role: 'user', content: 'Hello there' },
          { role: 'assistant', content: 'Hi! How can I help?' },
        ],
      })
    )
    render(<AiCoachDrawer {...defaultProps} />)
    expect(screen.getByText('Hello there')).toBeInTheDocument()
    expect(screen.getByText('Hi! How can I help?')).toBeInTheDocument()
  })

  it('renders streaming assistant message as tokens arrive', () => {
    mockUseAiChat.mockReturnValue(
      makeHookResult({
        messages: [
          { role: 'assistant', content: 'Loading respon' },
        ],
        streaming: true,
      })
    )
    render(<AiCoachDrawer {...defaultProps} />)
    expect(screen.getByText(/Loading respon/)).toBeInTheDocument()
  })

  it('proposal card appears when hook exposes a proposal', () => {
    mockUseAiChat.mockReturnValue(
      makeHookResult({ proposal: { asis: 5, tobe: 8 } })
    )
    render(<AiCoachDrawer {...defaultProps} />)
    expect(screen.getByText(/Suggested scores/i)).toBeInTheDocument()
  })

  it('proposal card shows suggested asis and tobe values', () => {
    mockUseAiChat.mockReturnValue(
      makeHookResult({ proposal: { asis: 5, tobe: 8 } })
    )
    render(<AiCoachDrawer {...defaultProps} />)
    expect(screen.getByText(/As-Is: 5/)).toBeInTheDocument()
    expect(screen.getByText(/To-Be: 8/)).toBeInTheDocument()
  })

  it('Apply to As-Is button calls onApplyAsis with the suggested value', async () => {
    const onApplyAsis = vi.fn()
    mockUseAiChat.mockReturnValue(
      makeHookResult({ proposal: { asis: 5, tobe: 8 } })
    )
    render(<AiCoachDrawer {...defaultProps} onApplyAsis={onApplyAsis} />)
    await userEvent.click(screen.getByRole('button', { name: /apply to as-is/i }))
    expect(onApplyAsis).toHaveBeenCalledWith(5)
  })

  it('Apply to To-Be button calls onApplyTobe with the suggested value', async () => {
    const onApplyTobe = vi.fn()
    mockUseAiChat.mockReturnValue(
      makeHookResult({ proposal: { asis: 5, tobe: 8 } })
    )
    render(<AiCoachDrawer {...defaultProps} onApplyTobe={onApplyTobe} />)
    await userEvent.click(screen.getByRole('button', { name: /apply to to-be/i }))
    expect(onApplyTobe).toHaveBeenCalledWith(8)
  })

  it('send button is disabled while streaming', () => {
    mockUseAiChat.mockReturnValue(makeHookResult({ streaming: true }))
    render(<AiCoachDrawer {...defaultProps} />)
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled()
  })

  it('submitting the input form calls sendMessage with the typed text', async () => {
    const sendMessage = vi.fn().mockResolvedValue(undefined)
    mockUseAiChat.mockReturnValue(makeHookResult({ sendMessage }))
    const user = userEvent.setup()
    render(<AiCoachDrawer {...defaultProps} />)
    const input = screen.getByPlaceholderText(/type a message/i)
    await user.type(input, 'What should I focus on?')
    await user.click(screen.getByRole('button', { name: /send/i }))
    expect(sendMessage).toHaveBeenCalledWith('What should I focus on?')
  })

  it('input clears after send', async () => {
    const sendMessage = vi.fn().mockResolvedValue(undefined)
    mockUseAiChat.mockReturnValue(makeHookResult({ sendMessage }))
    const user = userEvent.setup()
    render(<AiCoachDrawer {...defaultProps} />)
    const input = screen.getByPlaceholderText(/type a message/i)
    await user.type(input, 'Hello')
    await user.click(screen.getByRole('button', { name: /send/i }))
    await waitFor(() => {
      expect(input).toHaveValue('')
    })
  })

  it('error message shown inline with Retry button when hook has error', () => {
    mockUseAiChat.mockReturnValue(makeHookResult({ error: 'AI response failed' }))
    render(<AiCoachDrawer {...defaultProps} />)
    expect(screen.getByText(/AI response failed/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('Retry button calls retry from the hook', async () => {
    const retry = vi.fn().mockResolvedValue(undefined)
    mockUseAiChat.mockReturnValue(makeHookResult({ error: 'AI response failed', retry }))
    render(<AiCoachDrawer {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: /retry/i }))
    expect(retry).toHaveBeenCalled()
  })

  it('close button calls onClose', async () => {
    const onClose = vi.fn()
    render(<AiCoachDrawer {...defaultProps} onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalled()
  })
})
