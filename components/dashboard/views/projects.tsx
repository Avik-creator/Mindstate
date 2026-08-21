import { ConfirmAction } from '@/components/dashboard/confirm-action'
import { Empty, NoMatches } from '@/components/dashboard/states'
import type { Project } from '@/components/dashboard/types'

export function ProjectList({ items, query, refresh }: { items: Project[]; query?: string; refresh: () => Promise<void> }) {
  if (!items.length) return query ? <NoMatches label="projects" query={query} /> : <Empty label="projects" />

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((project) => (
        <article key={project.id} className="border-2 border-foreground bg-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-semibold">{project.name}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{project.description}</p>
            </div>
            <ConfirmAction
              trigger="Delete"
              title={`Delete ${project.name}?`}
              description="This project can only be deleted when it has no linked memories, sessions, or handoffs."
              confirmLabel="Delete project"
              pendingLabel="Deleting…"
              url={`/api/v1/projects/${project.id}`}
              refresh={refresh}
            />
          </div>
          <div className="mt-5 flex gap-4 font-mono text-xs text-muted-foreground">
            <span>{project.memoryCount} memories</span>
            <span>{project.sessionCount} sessions</span>
            <span>{project.handoffCount} handoffs</span>
          </div>
        </article>
      ))}
    </div>
  )
}
