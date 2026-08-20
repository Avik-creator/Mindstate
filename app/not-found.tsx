import Link from 'next/link'
import { ArrowLeft, Braces, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b px-5 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground"><Braces aria-hidden="true" /></span>
          Mindstate
        </Link>
        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Lost context / 404</span>
      </header>

      <section className="flex flex-1 items-center px-5 py-12 sm:px-8 lg:px-16" aria-labelledby="not-found-title">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[1fr_0.9fr] lg:gap-20">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-widest text-primary">Memory lookup failed</p>
            <h1 id="not-found-title" className="mt-5 text-balance text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">This thread ends here.</h1>
            <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">The page you requested is not in this workspace. It may have moved, expired, or never been committed to memory.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" nativeButton={false} render={<Link href="/" />}><ArrowLeft data-icon="inline-start" />Return home</Button>
              <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/dashboard" />}><LayoutDashboard data-icon="inline-start" />Open dashboard</Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border bg-card shadow-xl" aria-label="Failed memory lookup">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <span className="font-mono text-xs text-muted-foreground">memory.lookup</span>
              <span className="font-mono text-xs text-destructive">NOT_FOUND</span>
            </div>
            <div className="flex flex-col gap-6 p-5 sm:p-8">
              <div className="font-mono text-sm leading-7">
                <p><span className="text-muted-foreground">01</span> <span className="text-primary">query</span> requested_path</p>
                <p><span className="text-muted-foreground">02</span> <span className="text-primary">scan</span> durable_memory</p>
                <p><span className="text-muted-foreground">03</span> <span className="text-destructive">return</span> no matching context</p>
              </div>
              <div className="flex items-center gap-4" aria-hidden="true">
                <span className="size-3 rounded-full bg-primary" />
                <span className="h-px flex-1 border-t border-dashed" />
                <span className="size-3 rounded-full border bg-background" />
                <span className="h-px flex-1 border-t border-dashed opacity-40" />
                <span className="size-3 rounded-full border bg-background opacity-40" />
              </div>
              <p className="text-sm leading-6 text-muted-foreground">Known context stops at the first node. Choose a safe route to begin a new thread.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
