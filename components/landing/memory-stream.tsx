'use client'

import { FileText, GitBranch, Settings2, Sparkles } from 'lucide-react'
import { AnimatedList } from '@/components/ui/animated-list'
import { Reveal } from '@/components/landing/reveal'
import { SectionHeading } from '@/components/landing/section-heading'
import { Badge } from '@/components/ui/badge'

const icons = {
  decision: FileText,
  context: Sparkles,
  preference: Settings2,
  handoff: GitBranch,
} as const

const memories = [
  { type: 'decision', title: 'Presence stays heartbeat-based', detail: 'No long-lived connections on serverless.', tag: 'architecture', agent: 'coding-agent' },
  { type: 'context', title: 'Every query is owner-scoped', detail: 'REST, dashboard, and MCP share one boundary.', tag: 'security', agent: 'review-agent' },
  { type: 'preference', title: 'Migrations need human approval', detail: 'Never apply against production unattended.', tag: 'deployment', agent: 'coding-agent' },
  { type: 'handoff', title: 'Session lifecycle is ready', detail: 'Pick up from the last durable checkpoint.', tag: 'release', agent: 'research-agent' },
] as const

export function MemoryStream() {
  return (
    <section id="memory" className="scroll-mt-24 border-y bg-card">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          <Reveal className="lg:order-2">
            <SectionHeading
              eyebrow="02 — Remember"
              title="Context lands as it happens, not at the end."
              description="Agents write decisions, context, preferences, and handoffs while they work. Everything is typed, tagged, and linked to the project and session it came from — so the next run can find it."
            />
            <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              decision · context · preference · handoff
            </p>
          </Reveal>

          <Reveal className="lg:order-1">
            <div className="relative h-96 overflow-hidden rounded-xl border bg-background p-4">
              <AnimatedList delay={1600} className="gap-3">
                {memories.map((memory) => (
                  <MemoryCard key={memory.title} {...memory} />
                ))}
              </AnimatedList>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

type MemoryCardProps = (typeof memories)[number]

function MemoryCard({ type, title, detail, tag, agent }: MemoryCardProps) {
  const Icon = icons[type]

  return (
    <article className="flex gap-3 rounded-lg border bg-card p-4 shadow-xs">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-secondary">
        <Icon className="size-3.5 text-muted-foreground" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-medium">{title}</h3>
          <Badge variant="outline" className="text-[9px] capitalize">{type}</Badge>
        </div>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
        <p className="mt-2 font-mono text-[10px] text-muted-foreground">
          #{tag} · {agent}
        </p>
      </div>
    </article>
  )
}
