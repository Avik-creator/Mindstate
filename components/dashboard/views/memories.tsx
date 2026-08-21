import { Badge } from '@/components/ui/badge'
import { relativeTime } from '@/components/dashboard/api'
import { ConfirmAction } from '@/components/dashboard/confirm-action'
import { EditMemoryDialog } from '@/components/dashboard/edit-memory-dialog'
import { Empty, NoMatches } from '@/components/dashboard/states'
import type { Memory, Project } from '@/components/dashboard/types'

// Standing is shown rather than acted on: a superseded memory stays visible and readable, it
// just stops looking current.
function Standing({ standing }: { standing: Memory['standing'] }) {
  const stale = standing.supersededBy.length > 0
  const disputed = standing.contradicts.length > 0
  if (!stale && !disputed) return null

  return (
    <div className="mt-3 flex flex-col gap-1.5 border-l-2 border-brand pl-3">
      {stale ? (
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-brand">
          Superseded by {standing.supersededBy.map((ref) => ref.title).join(', ')}
        </p>
      ) : null}
      {disputed ? (
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
          Contradicts {standing.contradicts.map((ref) => ref.title).join(', ')}
        </p>
      ) : null}
    </div>
  )
}

export function MemoryList({ items, projects, query, refresh }: { items: Memory[]; projects: Project[]; query?: string; refresh: () => Promise<void> }) {
  if (!items.length) return query ? <NoMatches label="memories" query={query} /> : <Empty label="memories" />

  return (
    <section className="overflow-hidden border-2 border-foreground bg-card">
      {items.map((memory) => (
        <article key={memory.id} className={`border-b p-5 last:border-b-0 ${memory.standing.supersededBy.length ? 'opacity-60' : ''}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h3 className="text-sm font-medium">{memory.title}</h3>
              <Badge variant="outline" className="capitalize">{memory.type}</Badge>
            </div>
            <div className="flex shrink-0 items-center gap-1">
            <EditMemoryDialog memory={memory} projects={projects} refresh={refresh} />
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
          </div>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{memory.content}</p>
          <Standing standing={memory.standing} />
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
