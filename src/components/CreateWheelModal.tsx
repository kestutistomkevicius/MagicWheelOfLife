import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface CreateWheelModalProps {
  open: boolean
  showUpgradePrompt: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (mode: 'template' | 'blank', name: string) => Promise<void>
}

export function CreateWheelModal({
  open,
  showUpgradePrompt,
  onOpenChange,
  onCreate,
}: CreateWheelModalProps) {
  const [name, setName] = useState('')

  function handleClose() {
    setName('')
    onOpenChange(false)
  }

  async function handleCreate(mode: 'template' | 'blank') {
    await onCreate(mode, name)
    setName('')
    onOpenChange(false)
  }

  if (showUpgradePrompt) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade to Premium</DialogTitle>
            <DialogDescription>
              Free accounts are limited to 1 wheel. Upgrade to Premium for
              unlimited wheels.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleClose}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create your wheel</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <input
            type="text"
            placeholder="Wheel name (e.g. Work-Life Balance)"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-stone-500"
            autoFocus
          />
          <div className="flex flex-col gap-2">
            <Button onClick={() => handleCreate('template')}>
              Start from template (8 categories)
            </Button>
            <Button variant="outline" onClick={() => handleCreate('blank')}>
              Start from blank (3 placeholder categories)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
