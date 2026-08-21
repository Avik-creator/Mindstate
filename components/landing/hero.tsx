import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// CSS-only entrance so the headline is painted before hydration and survives a JS failure.
const enter = 'animate-in fade-in slide-in-from-bottom-3 blur-in-4 fill-mode-both duration-700 motion-reduce:animate-none'

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <GridBackdrop />

      <div className="relative mx-auto flex max-w-4xl flex-col items-center px-4 pb-20 pt-20 text-center sm:px-6 sm:pb-28 sm:pt-32">
        <span className={cn(enter, 'inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground')}>
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-chart-3 opacity-60 motion-reduce:hidden" />
            <span className="relative inline-flex size-1.5 rounded-full bg-chart-3" />
          </span>
          Private memory for AI agents
        </span>

        <h1 className="mt-7 max-w-3xl text-balance font-sans text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">
          <span className={cn(enter, 'block delay-100')}>Agents forget.</span>
          <span className={cn(enter, 'block text-muted-foreground delay-200')}>Mindstate remembers.</span>
        </h1>

        <p className={cn(enter, 'mt-6 max-w-xl text-pretty text-base leading-7 text-muted-foreground delay-300 sm:text-lg')}>
          One private workspace where every coding, research, and browser agent keeps its
          context — durable memories, live sessions, and clean handoffs between runs.
        </p>

        <div className={cn(enter, 'mt-9 flex flex-wrap items-center justify-center gap-3 delay-500')}>
          <Button size="lg" nativeButton={false} render={<Link href="/sign-up" />}>
            Create a workspace
            <ArrowRight data-icon="inline-end" />
          </Button>
          <Button size="lg" variant="outline" nativeButton={false} render={<Link href="#enroll" />}>
            See how it works
          </Button>
        </div>

        <p className={cn(enter, 'mt-7 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground delay-700')}>
          REST · MCP · owner-scoped by default
        </p>
      </div>
    </section>
  )
}

// Faint dot grid that fades out toward the edges.
function GridBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,black,transparent)]"
      style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, var(--border) 1px, transparent 0)',
        backgroundSize: '28px 28px',
      }}
    />
  )
}
