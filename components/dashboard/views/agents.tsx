import { Bot } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { relativeTime } from '@/components/dashboard/api'
import { ConfirmAction } from '@/components/dashboard/confirm-action'
import { Empty, NoMatches } from '@/components/dashboard/states'
import type { Agent } from '@/components/dashboard/types'

export function AgentList({ items, query, refresh }: { items: Agent[]; query?: string; refresh: () => Promise<void> }) {
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
          <span className="font-mono text-[10px] uppercase text-muted-foreground" title="Derived from what the agent reported about itself">
            {agent.confidence} confidence · self-reported
          </span>
          {agent.revokedAt ? (
            <Badge variant="outline">Revoked {relativeTime(agent.revokedAt)}</Badge>
          ) : (
            <ConfirmAction
              trigger="Revoke"
              title={`Revoke ${agent.name}?`}
              description="The agent is disabled and every key issued to it stops working immediately. Its memories and sessions are kept."
              confirmLabel="Revoke agent"
              pendingLabel="Revoking…"
              url={`/api/v1/agents/${agent.id}`}
              refresh={refresh}
            />
          )}
        </article>
      ))}
    </div>
  )
}
