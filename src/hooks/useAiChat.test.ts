// src/hooks/useAiChat.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'

// ── Supabase mock (vi.hoisted so variables are available in vi.mock factory) ──
const { mockFrom, mockGetSession } = vi.hoisted(() => {
  const mockFrom = vi.fn()
  const mockGetSession = vi.fn()
  return { mockFrom, mockGetSession }
})

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    auth: {
      getSession: mockGetSession,
    },
  },
}))

// ── fetch mock ────────────────────────────────────────────────────────────────
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// ── Helpers ───────────────────────────────────────────────────────────────────
/**
 * Build a fluent Supabase chain that supports any combination of
 * select/insert/eq/order and resolves to `result` when awaited.
 */
function buildChain(result: { data: unknown; error: unknown | null }) {
  const chain: Record<string, unknown> = {}
  chain.select = vi.fn().mockReturnValue(chain)
  chain.insert = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.order = vi.fn().mockReturnValue(chain)
  chain.then = (resolve: (v: unknown) => void, reject?: (e: unknown) => void) =>
    Promise.resolve(result).then(resolve, reject)
  return chain
}

/**
 * Build a mock ReadableStream that emits the given chunks then closes.
 */
function buildStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  let idx = 0
  return new ReadableStream({
    pull(controller) {
      if (idx < chunks.length) {
        controller.enqueue(encoder.encode(chunks[idx++]))
      } else {
        controller.close()
      }
    },
  })
}

/**
 * Build a successful fetch response with a streaming body.
 */
function buildFetchResponse(chunks: string[], ok = true, status = 200) {
  return {
    ok,
    status,
    body: buildStream(chunks),
  }
}

const DEFAULT_PARAMS = {
  categoryId: 'cat-1',
  categoryName: 'Health',
  asisScore: 6,
  tobeScore: 9,
}

const SESSION_TOKEN = 'test-access-token'

// Import after mocks are set up
import { useAiChat } from './useAiChat'

beforeEach(() => {
  vi.clearAllMocks()
  // Default: session exists
  mockGetSession.mockResolvedValue({
    data: { session: { access_token: SESSION_TOKEN } },
  })
})

describe('useAiChat', () => {
  it('initializes with empty messages array and no proposal', () => {
    // loadHistory not called yet → just inspect initial state
    const { result } = renderHook(() => useAiChat(DEFAULT_PARAMS))
    expect(result.current.messages).toEqual([])
    expect(result.current.proposal).toBeNull()
    expect(result.current.streaming).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('sendMessage appends user message to messages immediately', async () => {
    // Mock DB inserts to succeed
    mockFrom.mockReturnValue(buildChain({ data: null, error: null }))
    // Mock fetch with an empty stream
    mockFetch.mockResolvedValue(buildFetchResponse(['Hello from AI'], true))

    const { result } = renderHook(() => useAiChat(DEFAULT_PARAMS))

    await act(async () => {
      await result.current.sendMessage('How are things going?')
    })

    expect(result.current.messages[0]).toEqual({
      role: 'user',
      content: 'How are things going?',
    })
  })

  it('sendMessage sets streaming=true during fetch and false after', async () => {
    mockFrom.mockReturnValue(buildChain({ data: null, error: null }))

    let resolveStream!: () => void
    const streamPromise = new Promise<void>((resolve) => { resolveStream = resolve })

    // Create a slow stream that we control
    let streamController!: ReadableStreamDefaultController<Uint8Array>
    const slowStream = new ReadableStream<Uint8Array>({
      start(controller) {
        streamController = controller
      },
    })

    mockFetch.mockResolvedValue({ ok: true, status: 200, body: slowStream })

    const { result } = renderHook(() => useAiChat(DEFAULT_PARAMS))

    // Start sendMessage but don't await yet
    let sendDone = false
    act(() => {
      result.current.sendMessage('Test').then(() => { sendDone = true })
    })

    // Flush the fetch microtask so streaming starts
    await act(async () => { await Promise.resolve() })
    await act(async () => { await Promise.resolve() })
    await act(async () => { await Promise.resolve() })

    // streaming should be true while stream is open
    expect(result.current.streaming).toBe(true)

    // Close the stream
    await act(async () => {
      streamController.close()
      await streamPromise.catch(() => {})
      resolveStream()
    })

    await waitFor(() => expect(result.current.streaming).toBe(false))
    expect(sendDone).toBe(true)
  })

  it('sendMessage appends assistant placeholder then fills tokens incrementally', async () => {
    mockFrom.mockReturnValue(buildChain({ data: null, error: null }))
    mockFetch.mockResolvedValue(buildFetchResponse(['Hello ', 'there!'], true))

    const { result } = renderHook(() => useAiChat(DEFAULT_PARAMS))

    await act(async () => {
      await result.current.sendMessage('Hi')
    })

    const assistant = result.current.messages.find((m) => m.role === 'assistant')
    expect(assistant).toBeDefined()
    expect(assistant!.content).toBe('Hello there!')
  })

  it('detectAndSetProposal extracts asis and tobe from sentinel JSON in stream', async () => {
    mockFrom.mockReturnValue(buildChain({ data: null, error: null }))
    const sentinel = '{"type":"score_proposal","asis":5,"tobe":8}'
    mockFetch.mockResolvedValue(
      buildFetchResponse([`Here is your assessment. ${sentinel}`], true)
    )

    const { result } = renderHook(() => useAiChat(DEFAULT_PARAMS))

    await act(async () => {
      await result.current.sendMessage('Give me a proposal')
    })

    expect(result.current.proposal).toEqual({ asis: 5, tobe: 8 })
  })

  it('detectAndSetProposal strips sentinel JSON from displayed assistant message', async () => {
    mockFrom.mockReturnValue(buildChain({ data: null, error: null }))
    const sentinel = '{"type":"score_proposal","asis":5,"tobe":8}'
    mockFetch.mockResolvedValue(
      buildFetchResponse([`Here is your assessment. ${sentinel}`], true)
    )

    const { result } = renderHook(() => useAiChat(DEFAULT_PARAMS))

    await act(async () => {
      await result.current.sendMessage('Give me a proposal')
    })

    const assistant = result.current.messages.find((m) => m.role === 'assistant')
    expect(assistant!.content).not.toContain('"type":"score_proposal"')
    expect(assistant!.content).toContain('Here is your assessment.')
  })

  it('sendMessage persists user message and assistant message to DB after stream completes', async () => {
    const userInsertChain = buildChain({ data: null, error: null })
    const assistantInsertChain = buildChain({ data: null, error: null })
    mockFrom
      .mockReturnValueOnce(userInsertChain)
      .mockReturnValueOnce(assistantInsertChain)

    mockFetch.mockResolvedValue(buildFetchResponse(['Great work!'], true))

    const { result } = renderHook(() => useAiChat(DEFAULT_PARAMS))

    await act(async () => {
      await result.current.sendMessage('I need help')
    })

    // Both DB inserts happened
    expect(mockFrom).toHaveBeenCalledWith('ai_chat_messages')
    expect(userInsertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'user', content: 'I need help' })
    )
    expect(assistantInsertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'assistant', content: 'Great work!' })
    )
  })

  it('sets error when fetch response is not ok', async () => {
    mockFrom.mockReturnValue(buildChain({ data: null, error: null }))
    mockFetch.mockResolvedValue({ ok: false, status: 500, body: buildStream([]) })

    const { result } = renderHook(() => useAiChat(DEFAULT_PARAMS))

    await act(async () => {
      await result.current.sendMessage('Hello')
    })

    expect(result.current.error).toBe('AI response failed')
    expect(result.current.streaming).toBe(false)
  })

  it('retry resends the last user message', async () => {
    // First call fails
    mockFrom.mockReturnValue(buildChain({ data: null, error: null }))
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500, body: buildStream([]) })

    const { result } = renderHook(() => useAiChat(DEFAULT_PARAMS))

    await act(async () => {
      await result.current.sendMessage('Last message')
    })

    expect(result.current.error).toBe('AI response failed')

    // Second call succeeds
    mockFetch.mockResolvedValueOnce(buildFetchResponse(['Retry response'], true))

    await act(async () => {
      await result.current.retry()
    })

    expect(result.current.error).toBeNull()
    const assistant = result.current.messages.find((m) => m.role === 'assistant')
    expect(assistant!.content).toBe('Retry response')
  })

  it('loadHistory fetches messages for a category and populates messages array', async () => {
    const historyRows = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' },
    ]
    const chain = buildChain({ data: historyRows, error: null })
    mockFrom.mockReturnValue(chain)

    const { result } = renderHook(() => useAiChat(DEFAULT_PARAMS))

    await act(async () => {
      await result.current.loadHistory('cat-1')
    })

    expect(mockFrom).toHaveBeenCalledWith('ai_chat_messages')
    expect(chain.eq).toHaveBeenCalledWith('category_id', 'cat-1')
    expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: true })
    expect(result.current.messages).toEqual([
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' },
    ])
  })

  it('auto-sends opening message when loadHistory returns empty messages', async () => {
    // loadHistory returns empty
    const historyChain = buildChain({ data: [], error: null })
    mockFrom.mockReturnValue(historyChain)

    // fetch for auto-send opening greeting
    mockFetch.mockResolvedValue(buildFetchResponse(['Welcome! I see your Health is at 6.'], true))

    const { result } = renderHook(() => useAiChat(DEFAULT_PARAMS))

    await act(async () => {
      await result.current.loadHistory('cat-1')
    })

    // After loadHistory returns empty, useEffect triggers sendMessage('')
    // This results in fetch being called
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1))

    // An assistant message should appear
    await waitFor(() => {
      const assistant = result.current.messages.find((m) => m.role === 'assistant')
      expect(assistant).toBeDefined()
      expect(assistant!.content).toBe('Welcome! I see your Health is at 6.')
    })

    // No user bubble was prepended since userText was ''
    const userMessages = result.current.messages.filter((m) => m.role === 'user')
    expect(userMessages).toHaveLength(0)
  })
})
