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
  onCreate: (mode: 'template' | 'blank') => Promise<void>
}

export function CreateWheelModal({
  open,
  showUpgradePrompt,
  onOpenChange,
  onCreate,
}: CreateWheelModalProps) {
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
            <Button onClick={() => onOpenChange(false)}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create your wheel</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2">
          <Button
            onClick={async () => {
              await onCreate('template')
              onOpenChange(false)
            }}
          >
            Start from template (8 categories)
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              await onCreate('blank')
              onOpenChange(false)
            }}
          >
            Start from blank (0 categories)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
