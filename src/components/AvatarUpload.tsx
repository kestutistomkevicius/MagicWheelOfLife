import { useState } from 'react'
import { Camera } from 'lucide-react'

const MAX_SIZE = 2 * 1024 * 1024 // 2 MB

interface AvatarUploadProps {
  currentAvatarUrl: string | null
  onUpload: (file: File) => Promise<void>
  loading?: boolean
}

export function AvatarUpload({ currentAvatarUrl, onUpload, loading = false }: AvatarUploadProps) {
  const [error, setError] = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_SIZE) {
      setError('File must be under 2 MB')
      return
    }

    setError(null)
    void onUpload(file)
  }

  return (
    <div className="flex flex-col items-start gap-3">
      {/* Avatar preview */}
      <div className="h-20 w-20 rounded-full overflow-hidden bg-stone-100 flex items-center justify-center">
        {currentAvatarUrl ? (
          <img
            src={currentAvatarUrl}
            alt="Avatar"
            className="h-20 w-20 rounded-full object-cover"
          />
        ) : (
          <Camera className="h-8 w-8 text-stone-400" aria-hidden="true" />
        )}
      </div>

      {/* Upload label + hidden input */}
      <label aria-label="Change photo" className="cursor-pointer">
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleChange}
          disabled={loading}
        />
        <button
          type="button"
          disabled={loading}
          className="rounded bg-stone-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => {
            const input = document.querySelector<HTMLInputElement>('input[type="file"][accept="image/*"]')
            input?.click()
          }}
        >
          {loading ? 'Uploading...' : 'Change photo'}
        </button>
      </label>

      {/* Validation error */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
