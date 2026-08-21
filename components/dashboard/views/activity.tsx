import { relativeTime } from '@/components/dashboard/api'
import { Empty } from '@/components/dashboard/states'
import type { AuditEvent } from '@/components/dashboard/types'

const LABELS: Record<string, string> = {
  'memory.delete': 'Deleted memory',
  'project.delete': 'Deleted project',
  'agent.revoke': 'Revoked agent',
  'api_key.revoke': 'Revoked API key',
}

export function ActivityList({ items }: { items: AuditEvent[] }) {
  if (!items.length) {
    return <Empty label="recorded actions" hint="Deletions and revocations are recorded here permanently." />
  }

  return (
    <div className="overflow-hidden border-2 border-foreground bg-card">
      {items.map((event) => (
        <article key={event.id} className="flex flex-col gap-1 border-b p-5 last:border-b-0 sm:flex-row sm:items-baseline sm:gap-4">
          <span className="w-40 shrink-0 text-[10px] uppercase tracking-[0.2em] text-brand">
            {LABELS[event.action] ?? event.action}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm">{event.summary || event.targetId}</span>
          <span className="shrink-0 text-[10px] text-muted-foreground">
            {event.actorType === 'agent' ? 'by an agent' : 'by you'} · {relativeTime(event.createdAt)}
          </span>
        </article>
      ))}
    </div>
  )
}
