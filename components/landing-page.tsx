import Link from 'next/link'
import { ArrowRight, Braces, Check, Circle, FileText, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

const memoryRows = [
  { type: 'Decision', title: 'Keep session presence heartbeat-based', detail: 'Avoid long-lived connections on serverless infrastructure.', tag: 'architecture' },
  { type: 'Context', title: 'Owner scope every database query', detail: 'REST, dashboard, and MCP share the same application boundary.', tag: 'security' },
  { type: 'Handoff', title: 'Homepage and session lifecycle are ready', detail: 'Continue from the latest durable checkpoint.', tag: 'release' },
]

export function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-background/90 backdrop-blur">
        <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6" aria-label="Main navigation">
          <Link href="/" className="flex items-center gap-2" aria-label="Mindstate home">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground"><Braces className="size-4" aria-hidden="true" /></span>
            <span className="text-sm font-semibold tracking-tight">Mindstate</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/sign-in" />}>Sign in</Button>
            <Button size="sm" nativeButton={false} render={<Link href="/sign-up" />}>Get started<ArrowRight data-icon="inline-end" /></Button>
          </div>
        </nav>
      </header>

      <section className="mx-auto flex max-w-4xl flex-col items-center px-4 pb-14 pt-20 text-center sm:px-6 sm:pt-28">
        <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-[0.18em]">Live memory for AI agents</Badge>
        <h1 className="mt-6 max-w-3xl text-balance font-sans text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">One place for agents to remember, work, and hand off.</h1>
        <p className="mt-5 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">Mindstate gives every session durable context and real presence—through a private dashboard, REST API, and native MCP tools.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button size="lg" nativeButton={false} render={<Link href="/sign-up" />}>Create a workspace<ArrowRight data-icon="inline-end" /></Button>
          <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/dashboard" />}>Open dashboard</Button>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-2"><Check className="size-3 text-chart-3" />Live sessions</span>
          <span className="flex items-center gap-2"><Check className="size-3 text-chart-3" />Durable memory</span>
          <span className="flex items-center gap-2"><Check className="size-3 text-chart-3" />Owner-scoped access</span>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="overflow-hidden rounded-xl border bg-card shadow-xl">
          <div className="flex h-11 items-center justify-between border-b px-4">
            <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground"><Circle className="size-2 fill-chart-3 text-chart-3" />mindstate / workspace</div>
            <div className="flex items-center gap-3 font-mono text-[10px] text-muted-foreground"><span>REST</span><span>MCP</span><span>LIVE</span></div>
          </div>
          <div className="grid min-h-96 lg:grid-cols-[210px_minmax(0,1fr)_250px]">
            <aside className="hidden border-r p-3 lg:block">
              <div className="px-2 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Workspace</div>
              {['Overview', 'Memories', 'Sessions', 'Handoffs'].map((item, index) => <div key={item} className={`flex items-center justify-between rounded-md px-2 py-2 text-xs ${index === 0 ? 'bg-secondary text-foreground' : 'text-muted-foreground'}`}><span>{item}</span>{item === 'Sessions' ? <span className="font-mono text-[10px] text-chart-3">2 live</span> : null}</div>)}
              <div className="mt-6 px-2 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Agents</div>
              <div className="flex items-center gap-2 px-2 py-2 text-xs"><Circle className="size-2 fill-chart-3 text-chart-3" />Coding agent</div>
              <div className="flex items-center gap-2 px-2 py-2 text-xs text-muted-foreground"><Circle className="size-2 fill-muted text-muted" />Research agent</div>
            </aside>

            <div className="min-w-0 p-4 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="font-mono text-[10px] uppercase tracking-widest text-primary">Memory stream</p><h2 className="mt-1 font-sans text-lg font-semibold">Recent workspace context</h2></div>
                <div className="relative sm:w-56"><Search className="absolute left-3 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" /><Input readOnly className="h-8 pl-8 font-mono text-[11px]" placeholder="Search memory..." /></div>
              </div>
              <div className="mt-5 overflow-hidden rounded-lg border">
                {memoryRows.map((memory) => <article key={memory.title} className="flex gap-3 border-b p-4 last:border-b-0"><span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-secondary"><FileText className="size-3 text-muted-foreground" /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-sans text-sm font-medium">{memory.title}</h3><Badge variant="outline" className="text-[9px]">{memory.type}</Badge></div><p className="mt-1 text-xs leading-5 text-muted-foreground">{memory.detail}</p><span className="mt-2 block font-mono text-[10px] text-primary">#{memory.tag}</span></div></article>)}
              </div>
            </div>

            <aside className="border-t p-4 lg:border-l lg:border-t-0">
              <div className="flex items-center justify-between"><h2 className="font-sans text-sm font-semibold">Live sessions</h2><span className="font-mono text-[10px] text-chart-3">heartbeat on</span></div>
              <div className="mt-4 flex flex-col gap-3">
                <div className="rounded-lg border bg-background p-3"><div className="flex items-center gap-2"><Circle className="size-2 fill-chart-3 text-chart-3" /><span className="truncate text-xs font-medium">Implement session APIs</span></div><p className="mt-2 font-mono text-[10px] text-muted-foreground">coding · seen now</p></div>
                <div className="rounded-lg border bg-background p-3"><div className="flex items-center gap-2"><Circle className="size-2 fill-chart-3 text-chart-3" /><span className="truncate text-xs font-medium">Audit memory retrieval</span></div><p className="mt-2 font-mono text-[10px] text-muted-foreground">research · 34s ago</p></div>
              </div>
              <div className="mt-5 rounded-lg bg-secondary p-3"><p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Agent flow</p><code className="mt-3 block text-[11px] leading-6 text-foreground">start_session<br />heartbeat_session<br />save_memory<br />complete_session</code></div>
            </aside>
          </div>
        </div>
        <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Next.js · Neon · Drizzle · Better Auth · MCP</p>
      </section>
    </main>
  )
}
