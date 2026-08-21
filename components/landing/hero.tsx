import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { MemoryFlow } from '@/components/landing/memory-flow'
import { cn } from '@/lib/utils'

// CSS entrance, not a motion `initial`. The headline must be painted server-side and survive a JS failure.
const enter = 'animate-in fade-in slide-in-from-bottom-4 blur-in-4 fill-mode-both duration-700 motion-reduce:animate-none'

export function Hero() {
  return (
    <section className="relative w-full px-6 pb-12 pt-6 lg:px-24 lg:pb-16 lg:pt-10">
      <div className="flex flex-col items-center text-center">
        <h1 className={cn(enter, 'mb-2 select-none font-pixel text-4xl tracking-tight sm:text-6xl lg:text-7xl xl:text-8xl')}>
          AGENTS FORGET.
        </h1>

        <div className={cn(enter, 'my-4 w-full max-w-2xl delay-150 lg:my-6')}>
          <MemoryFlow />
        </div>

        <p className={cn(enter, 'mb-4 select-none font-pixel text-4xl tracking-tight delay-200 sm:text-6xl lg:text-7xl xl:text-8xl')}>
          THIS REMEMBERS.
        </p>

        <p className={cn(enter, 'mb-6 max-w-md text-xs leading-relaxed text-muted-foreground delay-300 lg:text-sm')}>
          Mindstate is the durable memory layer between your agents and the work they do.
          Owner-scoped storage. Live session presence. Clean handoffs between runs.
        </p>

        <div className={cn(enter, 'flex flex-wrap items-center justify-center gap-3 delay-500')}>
          <Link
            href="/sign-up"
            className="group flex items-center bg-foreground text-sm uppercase tracking-wider text-background transition-transform duration-150 hover:-translate-y-px"
          >
            <span className="flex size-10 items-center justify-center bg-brand text-brand-foreground">
              <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
            </span>
            <span className="px-5 py-2.5">Create a workspace</span>
          </Link>
          <Link
            href="#protocol"
            className="border border-foreground px-5 py-2.5 text-sm uppercase tracking-wider transition-colors duration-150 hover:bg-foreground hover:text-background"
          >
            Connect an agent
          </Link>
        </div>
      </div>
    </section>
  )
}
