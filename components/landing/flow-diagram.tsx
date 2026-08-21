'use client'

import { forwardRef, useRef, type ReactNode, type RefObject } from 'react'
import { Braces, Cloud, Code2, Database, GitBranch, Play, Search, Terminal } from 'lucide-react'
import { AnimatedBeam } from '@/components/ui/animated-beam'
import { Reveal } from '@/components/landing/reveal'
import { SectionHeading } from '@/components/landing/section-heading'
import { cn } from '@/lib/utils'

export function FlowDiagram() {
  return (
    <section id="flow" className="scroll-mt-24">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <Reveal>
          <SectionHeading
            align="center"
            eyebrow="03 — Capture and recall"
            title="Many agents write. Any agent resumes."
            description="Every run reports into the same owner-scoped workspace. What one agent learns at 2am is what the next one starts with."
          />
        </Reveal>

        <div className="mt-16 grid gap-10 lg:grid-cols-2 lg:gap-6">
          <Reveal>
            <CapturePanel />
          </Reveal>
          <Reveal>
            <RecallPanel />
          </Reveal>
        </div>
      </div>
    </section>
  )
}

const sources = [
  { icon: Code2, title: 'Coding', lines: ['session APIs', 'decision'] },
  { icon: Search, title: 'Research', lines: ['memory audit', 'context'] },
  { icon: Cloud, title: 'Browser', lines: ['release notes', 'context'] },
]

function CapturePanel() {
  const container = useRef<HTMLDivElement>(null)
  const hub = useRef<HTMLDivElement>(null)
  const a = useRef<HTMLDivElement>(null)
  const b = useRef<HTMLDivElement>(null)
  const c = useRef<HTMLDivElement>(null)
  const sink = useRef<HTMLDivElement>(null)
  const refs = [a, b, c]

  return (
    <Panel label="Capture" ref={container}>
      <div className="flex items-start justify-between gap-3 sm:gap-6">
        {sources.map((source, index) => (
          <SourceCard key={source.title} ref={refs[index]} {...source} />
        ))}
      </div>

      <div className="flex justify-center py-14 sm:py-16">
        <Hub ref={hub} />
      </div>

      <div className="flex justify-center">
        <RecordCard ref={sink} />
      </div>

      {refs.map((ref, index) => (
        <AnimatedBeam
          key={index}
          containerRef={container as RefObject<HTMLElement | null>}
          fromRef={ref as RefObject<HTMLElement | null>}
          toRef={hub as RefObject<HTMLElement | null>}
          duration={4}
          delay={index * 0.9}
          pathWidth={1.5}
          pathColor="var(--foreground)"
          pathOpacity={0.14}
        className="z-0"
        />
      ))}
      <AnimatedBeam
        containerRef={container as RefObject<HTMLElement | null>}
        fromRef={hub as RefObject<HTMLElement | null>}
        toRef={sink as RefObject<HTMLElement | null>}
        duration={4}
        delay={1.4}
        pathWidth={1.5}
        pathColor="var(--foreground)"
        pathOpacity={0.14}
        className="z-0"
      />
    </Panel>
  )
}

const consumers = [
  { icon: Play, label: 'start_session' },
  { icon: GitBranch, label: 'handoff' },
  { icon: Terminal, label: 'MCP tools' },
]

function RecallPanel() {
  const container = useRef<HTMLDivElement>(null)
  const hub = useRef<HTMLDivElement>(null)
  const origin = useRef<HTMLDivElement>(null)
  const a = useRef<HTMLDivElement>(null)
  const b = useRef<HTMLDivElement>(null)
  const c = useRef<HTMLDivElement>(null)
  const refs = [a, b, c]

  return (
    <Panel label="Recall" ref={container}>
      <div className="flex justify-center">
        <div
          ref={origin}
          className="relative z-10 flex items-center gap-3 rounded-xl border bg-background px-4 py-3"
        >
          <span className="flex size-9 items-center justify-center rounded-lg border bg-secondary">
            <Database className="size-4 text-muted-foreground" aria-hidden="true" />
          </span>
          <span className="text-left">
            <span className="block text-sm font-medium">Workspace memory</span>
            <span className="block font-mono text-[10px] text-muted-foreground">owner-scoped · Postgres</span>
          </span>
        </div>
      </div>

      <div className="flex justify-center py-14 sm:py-16">
        <Hub ref={hub} />
      </div>

      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {consumers.map((consumer, index) => (
          <ConsumerPill key={consumer.label} ref={refs[index]} {...consumer} />
        ))}
      </div>

      <AnimatedBeam
        containerRef={container as RefObject<HTMLElement | null>}
        fromRef={origin as RefObject<HTMLElement | null>}
        toRef={hub as RefObject<HTMLElement | null>}
        duration={4}
        pathWidth={1.5}
        pathColor="var(--foreground)"
        pathOpacity={0.14}
        className="z-0"
      />
      {refs.map((ref, index) => (
        <AnimatedBeam
          key={index}
          containerRef={container as RefObject<HTMLElement | null>}
          fromRef={hub as RefObject<HTMLElement | null>}
          toRef={ref as RefObject<HTMLElement | null>}
          duration={4}
          delay={0.6 + index * 0.7}
          pathWidth={1.5}
          pathColor="var(--foreground)"
          pathOpacity={0.14}
        className="z-0"
        />
      ))}
    </Panel>
  )
}

const Panel = forwardRef<HTMLDivElement, { label: string; children: ReactNode }>(
  function Panel({ label, children }, ref) {
    return (
      <div className="h-full rounded-2xl border bg-card p-5 sm:p-8">
        <p className="mb-8 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <div ref={ref} className="relative">
          {children}
        </div>
      </div>
    )
  },
)

const Hub = forwardRef<HTMLDivElement>(function Hub(_props, ref) {
  return (
    <div
      ref={ref}
      className="relative z-10 flex size-12 items-center justify-center rounded-full border bg-background shadow-xs"
    >
      <span className="absolute inset-0 rounded-full ring-1 ring-chart-3/25" />
      <Braces className="size-5" aria-hidden="true" />
    </div>
  )
})

type SourceCardProps = (typeof sources)[number]

const SourceCard = forwardRef<HTMLDivElement, SourceCardProps>(function SourceCard(
  { icon: Icon, title, lines },
  ref,
) {
  return (
    <div ref={ref} className="relative z-10 min-w-0 flex-1 rounded-xl border bg-background p-3 sm:p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium leading-tight sm:text-sm">{title}</span>
        <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="mt-3 space-y-1.5" aria-hidden="true">
        {lines.map((line) => (
          <span key={line} className="block truncate font-mono text-[9px] text-muted-foreground">
            {line}
          </span>
        ))}
      </div>
    </div>
  )
})

const RecordCard = forwardRef<HTMLDivElement>(function RecordCard(_props, ref) {
  return (
    <div ref={ref} className="relative z-10 w-full max-w-64 rounded-xl border bg-background p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Durable memory</p>
      <p className="mt-2 text-sm font-medium">Presence stays heartbeat-based</p>
      <div className="mt-3 space-y-1.5" aria-hidden="true">
        <span className="block h-1 w-full rounded-full bg-muted" />
        <span className="block h-1 w-4/5 rounded-full bg-muted" />
      </div>
      <span className="mt-3 inline-flex rounded-md border px-1.5 py-0.5 font-mono text-[9px] text-chart-3">
        persisted
      </span>
    </div>
  )
})

type ConsumerPillProps = (typeof consumers)[number]

const ConsumerPill = forwardRef<HTMLDivElement, ConsumerPillProps>(function ConsumerPill(
  { icon: Icon, label },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'relative z-10 flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border bg-background px-2 py-2.5 sm:px-3',
      )}
    >
      <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span className="truncate font-mono text-[10px] sm:text-[11px]">{label}</span>
    </div>
  )
})
