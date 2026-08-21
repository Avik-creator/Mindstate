import { CircleDot, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Empty as EmptyState,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { cn } from '@/lib/utils'

export function Empty({ label, hint }: { label: string; hint?: string }) {
  return (
    <EmptyState className="min-h-48">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CircleDot />
        </EmptyMedia>
        <EmptyTitle>No {label} yet</EmptyTitle>
        <EmptyDescription>{hint ?? 'Create one to begin building your live workspace.'}</EmptyDescription>
      </EmptyHeader>
    </EmptyState>
  )
}

export function NoMatches({ label, query }: { label: string; query: string }) {
  return (
    <EmptyState className="min-h-48">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CircleDot />
        </EmptyMedia>
        <EmptyTitle>No {label} match “{query}”</EmptyTitle>
        <EmptyDescription>Try a different term, or clear the search to see everything.</EmptyDescription>
      </EmptyHeader>
    </EmptyState>
  )
}

// Per-section failure so one dead request cannot blank the whole dashboard.
export function LoadError({ message, retry }: { message?: string; retry: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3 border-2 border-destructive bg-destructive/5 p-5">
      <div>
        <p className="text-sm font-medium text-destructive">Could not load this section</p>
        <p className="mt-1 text-xs text-muted-foreground">{message ?? 'The request failed.'}</p>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={retry}>
        <RefreshCw data-icon="inline-start" />
        Try again
      </Button>
    </div>
  )
}

export function RowsSkeleton({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('overflow-hidden border-2 border-foreground bg-card', className)} aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="space-y-3 border-b p-5 last:border-b-0">
          <div className="h-3.5 w-1/3 animate-pulse rounded bg-muted" />
          <div className="h-3 w-full animate-pulse rounded bg-muted" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}

export function CardsSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2" aria-hidden="true">
      {Array.from({ length: cards }).map((_, index) => (
        <div key={index} className="space-y-3 border-2 border-foreground bg-card p-5">
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
          <div className="h-3 w-full animate-pulse rounded bg-muted" />
          <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}
