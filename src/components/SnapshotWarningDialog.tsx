import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface SnapshotWarningDialogProps {
  open: boolean
  action: 'rename' | 'remove'
  categoryName: string
  onConfirm: () => void
  onCancel: () => void
}

export function SnapshotWarningDialog({
  open,
  action,
  categoryName,
  onConfirm,
  onCancel,
}: SnapshotWarningDialogProps) {
  const verb = action === 'rename' ? 'Rename' : 'Remove'
  return (
    <AlertDialog open={open} onOpenChange={open => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {verb} &quot;{categoryName}&quot;?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This wheel has saved snapshots.{' '}
            {action === 'rename' ? 'Renaming' : 'Removing'} this category will
            affect how historical snapshots appear in comparisons. This cannot
            be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>{verb} anyway</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
