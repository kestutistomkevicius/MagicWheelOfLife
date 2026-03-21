// src/hooks/useAiChat.ts
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export interface AiChatMessage {
  role: 'user' | 'assistant'
  content: string // displayed text (sentinel stripped from assistant messages)
}

export interface ScoreProposal {
  asis: number
  tobe: number
}

export interface UseAiChatResult {
  messages: AiChatMessage[]
  streaming: boolean
  proposal: ScoreProposal | null
  error: string | null
  sendMessage: (text: string) => Promise<void>
  retry: () => Promise<void>
  loadHistory: (categoryId: string) => Promise<void>
}

export function useAiChat(params: {
  categoryId: string
  categoryName: string
  asisScore: number
  tobeScore: number
}): UseAiChatResult {
  const { categoryId, categoryName, asisScore, tobeScore } = params

  const [messages, setMessages] = useState<AiChatMessage[]>([])
  const [streaming, setStreaming] = useState(false)
  const [proposal, setProposal] = useState<ScoreProposal | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [historyLoaded, setHistoryLoaded] = useState(false)

  // Refs for values that don't need to trigger re-renders
  const lastUserTextRef = useRef<string>('')
  const autoSendFiredRef = useRef(false)
  // Keep a stable ref to sendMessage to avoid stale closure in useEffect
  const sendMessageRef = useRef<((text: string) => Promise<void>) | undefined>(undefined)
  // Mirror messages state in a ref so sendMessage can read current value synchronously
  const messagesRef = useRef<AiChatMessage[]>([])
  // Generation counter — incremented on each loadHistory call so stale completions are ignored
  const loadGenRef = useRef(0)

  /**
   * Strip the score_proposal sentinel JSON from a text string.
   * Returns clean text for display.
   */
  function stripSentinel(text: string): string {
    return text
      .replace(/\{"type":"score_proposal","asis":\d+,"tobe":\d+\}/g, '')
      .trim()
  }

  /**
   * Detect and parse the score_proposal sentinel in accumulated text.
   * If found, sets proposal state with extracted asis/tobe values.
   */
  function detectAndSetProposal(text: string): void {
    const match = text.match(
      /\{"type":"score_proposal","asis":(\d+),"tobe":(\d+)\}/
    )
    if (match) {
      setProposal({ asis: parseInt(match[1], 10), tobe: parseInt(match[2], 10) })
    }
  }

  async function sendMessage(userText: string): Promise<void> {
    // Get current session token
    const sessionResult = await supabase.auth.getSession()
    const token = sessionResult.data?.session?.access_token ?? ''
    const userId = sessionResult.data?.session?.user?.id ?? ''

    // Build conversation history using the ref (synchronously available)
    const conversationHistory: AiChatMessage[] = [...messagesRef.current]

    // 1. If non-empty user text: append user bubble and persist to DB
    if (userText !== '') {
      const userMessage: AiChatMessage = { role: 'user', content: userText }
      conversationHistory.push(userMessage)
      messagesRef.current = conversationHistory
      setMessages([...conversationHistory])

      // Persist user message to DB
      await supabase.from('ai_chat_messages').insert({
        user_id: userId,
        category_id: categoryId,
        role: 'user',
        content: userText,
      })
    }

    // 2. Track last user text for retry
    lastUserTextRef.current = userText

    // 3. Set streaming state and clear error
    setStreaming(true)
    setError(null)

    // 4. Append empty assistant placeholder
    const withPlaceholder = [...messagesRef.current, { role: 'assistant' as const, content: '' }]
    messagesRef.current = withPlaceholder
    setMessages(withPlaceholder)

    // 5. Fetch from Edge Function
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string

    let res: Response
    try {
      res = await fetch(`${supabaseUrl}/functions/v1/ai-coach`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categoryName,
          asisScore,
          tobeScore,
          messages: conversationHistory,
        }),
      })
    } catch {
      setError('AI response failed')
      setStreaming(false)
      return
    }

    // 6. Handle non-ok response
    if (!res.ok) {
      // Remove the empty assistant placeholder we appended before the fetch
      const withoutPlaceholder = [...messagesRef.current]
      const lastErrIdx = withoutPlaceholder.length - 1
      if (lastErrIdx >= 0 && withoutPlaceholder[lastErrIdx].role === 'assistant' && withoutPlaceholder[lastErrIdx].content === '') {
        withoutPlaceholder.splice(lastErrIdx, 1)
      }
      messagesRef.current = withoutPlaceholder
      setMessages(withoutPlaceholder)
      setError('AI response failed')
      setStreaming(false)
      return
    }

    // 7. Stream the response body
    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let rawAccumulated = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      rawAccumulated += chunk

      const displayText = stripSentinel(rawAccumulated)

      // Update the last assistant message with the accumulated text
      const updatedStream = [...messagesRef.current]
      const lastStreamIdx = updatedStream.length - 1
      if (lastStreamIdx >= 0 && updatedStream[lastStreamIdx].role === 'assistant') {
        updatedStream[lastStreamIdx] = { role: 'assistant', content: displayText }
      }
      messagesRef.current = updatedStream
      setMessages(updatedStream)
    }

    // 8. After stream ends: detect proposal and persist final assistant message
    detectAndSetProposal(rawAccumulated)

    const finalContent = stripSentinel(rawAccumulated)

    // Only persist if content is not an error message
    if (!finalContent.includes('[Error:')) {
      await supabase.from('ai_chat_messages').insert({
        user_id: userId,
        category_id: categoryId,
        role: 'assistant',
        content: finalContent,
      })
    }

    // 9. Done streaming
    setStreaming(false)
  }

  // Keep sendMessageRef current so the useEffect doesn't capture stale closure
  sendMessageRef.current = sendMessage

  // Auto-send opening message when history was loaded and is empty
  useEffect(() => {
    if (historyLoaded && messages.length === 0 && !autoSendFiredRef.current) {
      autoSendFiredRef.current = true
      sendMessageRef.current?.('')
    }
  }, [historyLoaded, messages.length])

  async function retry(): Promise<void> {
    if (lastUserTextRef.current !== '') {
      await sendMessage(lastUserTextRef.current)
    }
  }

  async function loadHistory(catId: string): Promise<void> {
    // Increment generation — any in-flight call with an older generation is discarded.
    // This prevents React Strict Mode's double-invocation from resetting autoSendFiredRef
    // and triggering a second auto-send after the first already fired.
    const gen = ++loadGenRef.current

    const { data } = await supabase
      .from('ai_chat_messages')
      .select('role, content')
      .eq('category_id', catId)
      .order('created_at', { ascending: true })

    // Discard stale call (e.g. from Strict Mode double-invoke)
    if (gen !== loadGenRef.current) return

    const rows = (data ?? []) as AiChatMessage[]
    messagesRef.current = rows
    setMessages(rows)

    // Setting historyLoaded=true AFTER setMessages so the effect sees the correct messages.length
    setHistoryLoaded(true)
  }

  return {
    messages,
    streaming,
    proposal,
    error,
    sendMessage,
    retry,
    loadHistory,
  }
}
