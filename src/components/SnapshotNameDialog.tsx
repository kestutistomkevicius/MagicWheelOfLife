import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface SnapshotNameDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (name: string) => Promise<void>
  isSaving: boolean
}

export function SnapshotNameDialog({ open, onOpenChange, onSave, isSaving }: SnapshotNameDialogProps) {
  const [name, setName] = useState('')

  const today = new Date().toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  })

  async function handleSave() {
    if (!name.trim()) return
    await onSave(name.trim())
    setName('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Snapshot</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="snap-name">Snapshot name</Label>
            <Input
              id="snap-name"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') void handleSave() }}
              placeholder="e.g. Q1 Review"
              autoFocus
            />
          </div>
          <p className="text-xs text-stone-400">
            Will be saved as: <strong>{name.trim() || 'My snapshot'} — {today}</strong>
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => void handleSave()}
            disabled={!name.trim() || isSaving}
          >
            {isSaving ? 'Saving…' : 'Save snapshot'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
