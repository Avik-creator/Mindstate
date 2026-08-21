import { Badge } from '@/components/ui/badge'
import { relativeTime } from '@/components/dashboard/api'
import { Empty, NoMatches } from '@/components/dashboard/states'
import type { Session } from '@/components/dashboard/types'
import { cn } from '@/lib/utils'

// Presence is distinguished by fill rather than hue, so it survives a monochrome palette.
function PresenceDot({ presence }: { presence: Session['presence'] }) {
  if (presence === 'live') {
    return (
      <span className="relative flex size-2.5 shrink-0" aria-hidden="true">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-chart-3 opacity-60 motion-reduce:hidden" />
        <span className="relative inline-flex size-2.5 rounded-full bg-chart-3" />
      </span>
    )
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        'size-2.5 shrink-0 rounded-full',
        presence === 'stale' ? 'border-2 border-muted-foreground bg-transparent' : 'bg-muted-foreground/40',
      )}
    />
  )
}

export function SessionList({ items, query }: { items: Session[]; query?: string }) {
  if (!items.length) return query ? <NoMatches label="sessions" query={query} /> : <Empty label="sessions" />

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      {items.map((session) => (
        <article key={session.id} className="flex items-center gap-4 border-b p-4 last:border-b-0">
          <PresenceDot presence={session.presence} />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-medium">{session.title}</h3>
            <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
              {session.agent} · {session.memoryCount} memories · heartbeat {relativeTime(session.lastHeartbeatAt)}
            </p>
          </div>
          <Badge variant="outline" className="capitalize">{session.presence}</Badge>
        </article>
      ))}
    </div>
  )
}
