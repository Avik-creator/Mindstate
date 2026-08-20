import Link from 'next/link'
import { ArrowRight, Braces, Check, CircleDot, Database, FileText, Search, ShieldCheck, Terminal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const steps = [
  ['Capture', 'Write decisions, constraints, preferences, and handoffs yourself—or let an agent save them.'],
  ['Retrieve', 'Search by project, session, tags, or meaning to bring only relevant context into the next run.'],
  ['Hand off', 'Publish a clean checkpoint so another agent can continue without reconstructing the work.'],
]

export function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="border-b border-border/70">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8" aria-label="Main navigation">
          <Link href="/" className="flex items-center gap-3" aria-label="Threadbase home">
            <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground"><Braces className="size-4" /></span>
            <span className="text-sm font-semibold tracking-tight">Threadbase</span>
          </Link>
          <div className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#workflow" className="transition-colors hover:text-foreground">Workflow</a>
            <a href="#integrate" className="transition-colors hover:text-foreground">Integrate</a>
            <a href="#privacy" className="transition-colors hover:text-foreground">Privacy</a>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" render={<Link href="/sign-in" />}>Sign in</Button>
            <Button render={<Link href="/sign-up" />}>Start private workspace<ArrowRight data-icon="inline-end" /></Button>
          </div>
        </nav>
      </header>

      <section className="mx-auto grid max-w-7xl gap-14 px-5 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8 lg:py-28">
        <div className="flex flex-col items-start gap-7">
          <Badge variant="outline" className="font-mono uppercase tracking-widest">Private agent memory</Badge>
          <h1 className="max-w-2xl text-balance text-5xl font-semibold tracking-[-0.05em] sm:text-6xl lg:text-7xl">Your agents should remember what matters.</h1>
          <p className="max-w-xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">Capture context by hand, carry decisions across sessions, and give every agent a precise place to read and write durable memory.</p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" render={<Link href="/sign-up" />}>Create your workspace<ArrowRight data-icon="inline-end" /></Button>
            <Button size="lg" variant="outline" render={<Link href="/dashboard" />}>View dashboard</Button>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs text-muted-foreground">
            <span className="flex items-center gap-2"><Check className="size-3 text-primary" />Manual + agent input</span>
            <span className="flex items-center gap-2"><Check className="size-3 text-primary" />REST + MCP</span>
            <span className="flex items-center gap-2"><Check className="size-3 text-primary" />Your database</span>
          </div>
        </div>

        <div className="relative rounded-xl border bg-card p-2 shadow-2xl shadow-background">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2"><CircleDot className="size-4 text-primary" /><span className="text-sm font-medium">Session handoff</span></div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">ready to continue</span>
          </div>
          <div className="flex flex-col gap-0 p-3">
            {[
              ['09:42', 'Decision recorded', 'Use a repository boundary so storage can change without touching tools.'],
              ['09:48', 'Constraint attached', 'Every query must remain scoped to the authenticated owner.'],
              ['10:03', 'Handoff published', 'Dashboard shell complete. Continue with API key management.'],
            ].map(([time, title, text], index) => (
              <div key={title} className="grid grid-cols-[52px_18px_1fr] gap-3">
                <span className="pt-4 font-mono text-[10px] text-muted-foreground">{time}</span>
                <div className="flex flex-col items-center"><span className="mt-5 size-2 rounded-full bg-primary" />{index < 2 && <span className="w-px flex-1 bg-border" />}</div>
                <div className="border-b py-4 last:border-0"><p className="text-sm font-medium">{title}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p></div>
              </div>
            ))}
          </div>
          <div className="grid gap-2 border-t p-3 sm:grid-cols-3">
            {['Project: Threadbase', 'Agent: coding', '7 memories'].map((item) => <div key={item} className="rounded-md bg-secondary px-3 py-2 font-mono text-[10px] text-muted-foreground">{item}</div>)}
          </div>
        </div>
      </section>

      <section id="workflow" className="border-y bg-card/40">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <div className="max-w-2xl"><p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">A continuous thread</p><h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">Stop rebuilding context at the start of every session.</h2></div>
          <div className="mt-12 grid border-y md:grid-cols-3">{steps.map(([title, text], index) => <article key={title} className="flex flex-col gap-4 border-b p-6 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"><span className="font-mono text-xs text-primary">0{index + 1}</span><h3 className="text-lg font-semibold">{title}</h3><p className="text-sm leading-6 text-muted-foreground">{text}</p></article>)}</div>
        </div>
      </section>

      <section id="integrate" className="mx-auto grid max-w-7xl gap-12 px-5 py-24 lg:grid-cols-2 lg:items-center lg:px-8">
        <div className="flex flex-col gap-5"><Terminal className="size-7 text-primary" /><h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">One memory layer. Every interface.</h2><p className="max-w-xl text-base leading-7 text-muted-foreground">Use the dashboard when you want control. Use REST for scripts. Use the Next.js MCP endpoint when an agent needs native tools. Every path reaches the same validated application layer.</p><div className="grid gap-3 sm:grid-cols-2"><span className="flex items-center gap-3 text-sm"><FileText className="size-4 text-primary" />Manual capture</span><span className="flex items-center gap-3 text-sm"><Search className="size-4 text-primary" />Scoped retrieval</span><span className="flex items-center gap-3 text-sm"><Database className="size-4 text-primary" />Portable Postgres</span><span className="flex items-center gap-3 text-sm"><ShieldCheck className="size-4 text-primary" />Hashed API keys</span></div></div>
        <pre className="overflow-x-auto rounded-xl border bg-card p-6 font-mono text-xs leading-7 text-muted-foreground"><code>{`POST /api/mcp\nAuthorization: Bearer tb_live_••••\n\ntools: [\n  search_memories,\n  save_memory,\n  get_context,\n  publish_handoff\n]`}</code></pre>
      </section>

      <section id="privacy" className="border-y bg-primary text-primary-foreground"><div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-16 md:flex-row md:items-center md:justify-between lg:px-8"><div><p className="font-mono text-xs uppercase tracking-widest opacity-70">Built for personal ownership</p><h2 className="mt-3 max-w-2xl text-balance text-3xl font-semibold tracking-tight">Private context, stored in your database, exposed on your terms.</h2></div><Button variant="secondary" size="lg" render={<Link href="/sign-up" />}>Start building memory<ArrowRight data-icon="inline-end" /></Button></div></section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-8"><span>Threadbase — durable context for agents.</span><span className="font-mono">Next.js · Drizzle · Postgres · MCP</span></footer>
    </main>
  )
}
