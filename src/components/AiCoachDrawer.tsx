import { useEffect, useRef, useState } from 'react'
import { X, Send } from 'lucide-react'
import { useAiChat } from '@/hooks/useAiChat'

export interface AiCoachDrawerProps {
  categoryId: string
  categoryName: string
  asisScore: number
  tobeScore: number
  onApplyAsis: (value: number) => void
  onApplyTobe: (value: number) => void
  onClose: () => void
}

export function AiCoachDrawer({
  categoryId,
  categoryName,
  asisScore,
  tobeScore,
  onApplyAsis,
  onApplyTobe,
  onClose,
}: AiCoachDrawerProps) {
  const { messages, streaming, proposal, error, sendMessage, retry, loadHistory } =
    useAiChat({ categoryId, categoryName, asisScore, tobeScore })

  const [inputText, setInputText] = useState('')
  const [asisApplied, setAsisApplied] = useState(false)
  const [tobeApplied, setTobeApplied] = useState(false)
  const threadRef = useRef<HTMLDivElement>(null)

  // Reset applied state whenever a new proposal arrives
  useEffect(() => {
    setAsisApplied(false)
    setTobeApplied(false)
  }, [proposal])

  // Load conversation history on mount
  useEffect(() => {
    void loadHistory(categoryId)
  }, [categoryId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight
    }
  }, [messages])

  async function handleSend() {
    const text = inputText.trim()
    if (!text || streaming) return
    setInputText('')
    await sendMessage(text)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div className="fixed top-0 right-0 h-full w-96 bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-base font-semibold text-stone-900">{categoryName}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-sm text-stone-400 hover:text-stone-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Chat thread */}
        <div
          ref={threadRef}
          className="flex-1 overflow-y-auto p-4 space-y-3"
        >
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  msg.role === 'user'
                    ? 'bg-amber-100 text-stone-900'
                    : 'bg-stone-100 text-stone-800'
                }`}
              >
                {msg.content}
                {/* Streaming cursor on the last assistant message */}
                {streaming && idx === messages.length - 1 && msg.role === 'assistant' && (
                  <span className="inline-block w-1 h-3 ml-0.5 bg-stone-400 animate-pulse" aria-hidden="true" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Proposal card — pinned above the input; hidden once both scores applied */}
        {proposal !== null && !(asisApplied && tobeApplied) && (
          <div className="border-t p-4 bg-stone-50">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
              <p className="text-sm font-medium text-stone-900">Suggested scores</p>
              <p className="text-sm text-stone-700">
                As-Is: {proposal.asis} &nbsp;&middot;&nbsp; To-Be: {proposal.tobe}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => { onApplyAsis(proposal.asis); setAsisApplied(true) }}
                  disabled={asisApplied || proposal.asis === asisScore}
                  className="flex-1 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-amber-50 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Apply to As-Is
                </button>
                <button
                  onClick={() => { onApplyTobe(proposal.tobe); setTobeApplied(true) }}
                  disabled={tobeApplied || proposal.tobe === tobeScore}
                  className="flex-1 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-amber-50 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Apply to To-Be
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error !== null && (
          <div className="border-t px-4 py-3 bg-red-50 flex items-center justify-between gap-2">
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={() => void retry()}
              className="text-sm font-medium text-red-700 underline hover:no-underline whitespace-nowrap"
            >
              Retry
            </button>
          </div>
        )}

        {/* Send form */}
        <div className="border-t p-4 flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={streaming}
            className="flex-1 rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 disabled:opacity-50"
          />
          <button
            onClick={() => void handleSend()}
            disabled={streaming || !inputText.trim()}
            aria-label="Send"
            className="rounded-md bg-amber-400 px-3 py-2 text-white hover:bg-amber-500 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  )
}
