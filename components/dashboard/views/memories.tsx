import { Badge } from '@/components/ui/badge'
import { relativeTime } from '@/components/dashboard/api'
import { ConfirmAction } from '@/components/dashboard/confirm-action'
import { Empty, NoMatches } from '@/components/dashboard/states'
import type { Memory } from '@/components/dashboard/types'

export function MemoryList({ items, query, refresh }: { items: Memory[]; query?: string; refresh: () => Promise<void> }) {
  if (!items.length) return query ? <NoMatches label="memories" query={query} /> : <Empty label="memories" />

  return (
    <section className="overflow-hidden border-2 border-foreground bg-card">
      {items.map((memory) => (
        <article key={memory.id} className="border-b p-5 last:border-b-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h3 className="text-sm font-medium">{memory.title}</h3>
              <Badge variant="outline" className="capitalize">{memory.type}</Badge>
            </div>
            <ConfirmAction
              trigger="Delete"
              title={`Delete “${memory.title}”?`}
              description="This memory is removed permanently. Agents will no longer recall it."
              confirmLabel="Delete memory"
              pendingLabel="Deleting…"
              url={`/api/v1/memories/${memory.id}`}
              refresh={refresh}
            />
          </div>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{memory.content}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] text-muted-foreground">
            <span>{memory.source}</span>
            <span aria-hidden="true">·</span>
            <span>{relativeTime(memory.updatedAt)}</span>
            {memory.tags.length ? (
              <>
                <span aria-hidden="true">·</span>
                <span className="truncate">{memory.tags.map((tag) => `#${tag}`).join(' ')}</span>
              </>
            ) : null}
          </div>
        </article>
      ))}
    </section>
  )
}
