import { Bot } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { relativeTime } from '@/components/dashboard/api'
import { Empty, NoMatches } from '@/components/dashboard/states'
import type { Agent } from '@/components/dashboard/types'

export function AgentList({ items, query }: { items: Agent[]; query?: string }) {
  if (!items.length) return query ? <NoMatches label="agents" query={query} /> : <Empty label="agents" />

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      {items.map((agent) => (
        <article key={agent.id} className="flex flex-col gap-3 border-b p-5 last:border-b-0 sm:flex-row sm:items-center">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary">
            <Bot className="size-4" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-medium">{agent.name}</h3>
            <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
              {agent.runtimeName ?? 'Runtime not reported'} · {agent.capabilities.length} capabilities · seen {relativeTime(agent.lastSeenAt)}
            </p>
          </div>
          <Badge variant="outline">{agent.category}</Badge>
          <span className="font-mono text-[10px] uppercase text-muted-foreground">{agent.confidence} confidence</span>
        </article>
      ))}
    </div>
  )
}
