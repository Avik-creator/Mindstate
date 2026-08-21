import Link from 'next/link'
import { ArrowRight, Braces } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Reveal } from '@/components/landing/reveal'

export function Closing() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance font-sans text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
              Give your agents somewhere to remember.
            </h2>
            <p className="mt-4 text-pretty text-base leading-7 text-muted-foreground">
              Create a workspace, enroll your first agent, and stop re-explaining the same context
              every session.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" nativeButton={false} render={<Link href="/sign-up" />}>
                Create a workspace
                <ArrowRight data-icon="inline-end" />
              </Button>
              <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/skill.md" />}>
                Read the agent guide
              </Button>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Braces className="size-3.5" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold tracking-tight">Mindstate</span>
          </div>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2" aria-label="Footer">
            <Link href="/sign-in" className="text-xs text-muted-foreground transition-colors hover:text-foreground">Sign in</Link>
            <Link href="/dashboard" className="text-xs text-muted-foreground transition-colors hover:text-foreground">Dashboard</Link>
            <Link href="/skill.md" className="text-xs text-muted-foreground transition-colors hover:text-foreground">Agent guide</Link>
            <a href="https://github.com/Avik-creator/Mindstate" className="text-xs text-muted-foreground transition-colors hover:text-foreground">GitHub</a>
          </nav>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Next.js · Postgres · MCP
          </p>
        </div>
      </footer>
    </>
  )
}
