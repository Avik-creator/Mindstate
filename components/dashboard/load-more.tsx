import { Button } from '@/components/ui/button'

// Shown only when the server reports more rows than are loaded, so the count is never a guess.
export function LoadMore({ shown, total, busy, onClick }: { shown: number; total: number; busy: boolean; onClick: () => void }) {
  return (
    <div className="mt-4 flex items-center justify-center gap-3">
      <Button variant="outline" size="sm" disabled={busy} onClick={onClick}>
        {busy ? 'Loading…' : 'Load more'}
      </Button>
      <span className="text-[11px] text-muted-foreground">{shown} of {total}</span>
    </div>
  )
}
