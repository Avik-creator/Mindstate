import { AgentAccessPanel } from '@/components/agent-access-panel'
import { MemoryList } from '@/components/dashboard/views/memories'
import type { Memory, Summary } from '@/components/dashboard/types'

export function Overview({ summary, memories, refresh }: { summary: Summary; memories: Memory[]; refresh: () => Promise<void> }) {
  const tiles: Array<[number, string]> = [
    [summary.memories, 'Memories'],
    [summary.sessions.live, 'Live sessions'],
    [summary.projects, 'Projects'],
    [summary.openHandoffs, 'Open handoffs'],
    [summary.agents, 'Agents'],
  ]

  return (
    <>
      <section className="grid overflow-hidden rounded-lg border bg-card sm:grid-cols-2 lg:grid-cols-5">
        {tiles.map(([value, label]) => (
          <div key={label} className="border-b px-5 py-6 sm:border-b-0 sm:border-r sm:last:border-r-0">
            <div className="font-mono text-2xl">{value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{label}</div>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <h2 className="mb-3 text-sm font-semibold">Recent memories</h2>
          <MemoryList items={memories.slice(0, 5)} refresh={refresh} />
        </div>
        <div className="flex flex-col gap-6">
          <AgentAccessPanel />
          <section className="rounded-lg border bg-card p-4">
            <h2 className="text-sm font-semibold">Session presence</h2>
            <dl className="mt-3 flex flex-col gap-2 font-mono text-xs">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">live</dt>
                <dd>{summary.sessions.live}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">stale</dt>
                <dd>{summary.sessions.stale}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">completed</dt>
                <dd>{summary.sessions.completed}</dd>
              </div>
            </dl>
            <p className="mt-3 text-[11px] leading-4 text-muted-foreground">
              A session goes stale after 90 seconds without a heartbeat.
            </p>
          </section>
        </div>
      </div>
    </>
  )
}
