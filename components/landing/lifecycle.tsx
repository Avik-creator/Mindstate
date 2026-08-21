import { Reveal } from '@/components/landing/reveal'
import { SectionHeading } from '@/components/landing/section-heading'
import { cn } from '@/lib/utils'

const states = [
  { name: 'active', presence: 'live', note: 'heartbeat every 30–60s' },
  { name: 'active', presence: 'stale', note: 'no heartbeat for 90s' },
  { name: 'completed', presence: 'completed', note: 'work finished, context kept' },
] as const

export function Lifecycle() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
      <Reveal>
        <SectionHeading
          eyebrow="04 — Presence"
          title="You can tell a working agent from a dead one."
          description="Sessions report a heartbeat instead of holding a connection open. Miss the window and the session reads as stale — a stopped or disconnected agent, not an error you have to go hunting for."
        />
      </Reveal>

      <Reveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {states.map((state, index) => (
            <StateCard key={state.presence} {...state} index={index} />
          ))}
        </div>
      </Reveal>

      <Reveal>
        <div className="mt-8 grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-3">
          <Stat value={60} suffix="s" label="Heartbeat interval, at the outside" />
          <Stat value={90} suffix="s" label="Before a session is marked stale" />
          <Stat value={1} suffix="" label="Owner scope on every single query" />
        </div>
      </Reveal>
    </section>
  )
}

function StateCard({
  name,
  presence,
  note,
  index,
}: (typeof states)[number] & { index: number }) {
  const isLive = presence === 'live'
  const isStale = presence === 'stale'

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center gap-2">
        <span className="relative flex size-2">
          {isLive ? (
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-chart-3 opacity-60 motion-reduce:hidden" />
          ) : null}
          <span
            className={cn(
              'relative inline-flex size-2 rounded-full',
              isLive && 'bg-chart-3',
              isStale && 'bg-muted-foreground/50',
              presence === 'completed' && 'bg-foreground',
            )}
          />
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.14em]">{presence}</span>
      </div>
      <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        status · {name}
      </p>
      <p className="mt-1.5 text-sm text-muted-foreground">{note}</p>
      <p className="mt-4 font-mono text-[10px] text-muted-foreground">0{index + 1}</p>
    </div>
  )
}

function Stat({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  return (
    <div className="bg-background p-6">
      <p className="font-sans text-3xl font-semibold tracking-[-0.03em]">
        {value}
        {suffix}
      </p>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{label}</p>
    </div>
  )
}
