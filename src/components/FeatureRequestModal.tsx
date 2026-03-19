import { useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface FeatureRequestModalProps {
  open: boolean
  userId: string
  onClose: () => void
}

export function FeatureRequestModal({ open, userId, onClose }: FeatureRequestModalProps) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  if (!open) return null

  function handleClose() {
    setText('')
    setLoading(false)
    setSuccess(false)
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (text.trim().length < 10 || loading) return
    setLoading(true)
    await supabase.from('feature_requests').insert({ user_id: userId, text: text.trim() })
    setLoading(false)
    setSuccess(true)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm text-stone-400 hover:text-stone-600"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="mb-4 text-lg font-semibold text-stone-900">Share feedback</h2>

        {success ? (
          <p className="text-sm text-stone-600">Thanks! We'll review it.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="What would make this app better for you?"
                rows={4}
                maxLength={1000}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 resize-none"
              />
              <p className="mt-1 text-xs text-stone-400">
                {text.length}/1000
                {text.trim().length < 10 && text.length > 0 && (
                  <span className="ml-2 text-stone-400">Minimum 10 characters</span>
                )}
              </p>
            </div>
            <button
              type="submit"
              disabled={text.trim().length < 10 || loading}
              className="w-full rounded-md bg-brand-400 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send feedback'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
