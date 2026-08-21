import Link from 'next/link'
import {
  ArrowRight,
  Bot,
  Braces,
  Check,
  Circle,
  Code2,
  Database,
  FileText,
  GitBranch,
  Search,
  Sparkles,
  Terminal,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

const agents = [
  { name: 'OpenCode', role: 'Builds the feature', icon: Terminal, status: 'writing' },
  { name: 'Codex', role: 'Continues the work', icon: Code2, status: 'ready' },
  { name: 'Claude Code', role: 'Reviews the decision', icon: Bot, status: 'synced' },
]

const memoryRows = [
  { type: 'Decision', title: 'Keep session presence heartbeat-based', detail: 'OpenCode saved why this architecture fits serverless.', tag: 'architecture' },
  { type: 'Context', title: 'Owner-scope every database query', detail: 'Codex retrieved the rule before touching the data layer.', tag: 'security' },
  { type: 'Handoff', title: 'Dashboard lifecycle is ready', detail: 'Claude Code can continue from the exact durable checkpoint.', tag: 'release' },
]

function AgentMemoryMap({ compact = false }: { compact?: boolean }) {
  return (
    <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center gap-5">
      <div className="grid w-full gap-3 sm:grid-cols-3">
        {agents.map(({ name, role, icon: Icon, status }) => (
          <Card key={name} size="sm" className="bg-card/90 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-secondary"><Icon className="size-4" /></span>
                <Badge variant="outline" className="font-mono text-[9px] uppercase">{status}</Badge>
              </div>
              <CardTitle className="mt-3 text-sm">{name}</CardTitle>
              <CardDescription className="text-xs">{role}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
      <div className="flex h-8 items-center justify-center" aria-hidden="true">
        <div className="h-8 w-px bg-border" />
        <div className="absolute h-px w-2/3 bg-border" />
      </div>
      <Card className="w-full max-w-md border-primary/30 bg-card shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Database className="size-5" /></div>
          <CardTitle className="mt-3">One shared mindstate</CardTitle>
          <CardDescription>Private memory, decisions, sessions, and handoffs. Every connected agent starts from the same truth.</CardDescription>
        </CardHeader>
        {!compact ? <CardContent><div className="flex items-center justify-center gap-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground"><span>REST</span><Separator orientation="vertical" className="h-3" /><span>MCP</span><Separator orientation="vertical" className="h-3" /><span>Live</span></div></CardContent> : null}
      </Card>
    </div>
  )
}

export function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6" aria-label="Main navigation">
          <Link href="/" className="flex items-center gap-2" aria-label="Mindstate home">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Braces className="size-4" aria-hidden="true" /></span>
            <span className="text-sm font-semibold tracking-tight">Mindstate</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/sign-in" />}>Sign in</Button>
            <Button size="sm" nativeButton={false} render={<Link href="/sign-up" />}>Start remembering<ArrowRight data-icon="inline-end" /></Button>
          </div>
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl gap-14 px-4 pb-24 pt-20 sm:px-6 sm:pt-28 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-[0.18em]"><Sparkles className="mr-1 size-3" />Memory that survives the handoff</Badge>
          <h1 className="mt-6 max-w-3xl text-balance font-sans text-5xl font-semibold tracking-[-0.055em] sm:text-6xl">Your agents change. The work should remember.</h1>
          <p className="mt-6 max-w-xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">Start a feature in OpenCode. Continue it in Codex. Ask Claude Code to review it tomorrow. Mindstate carries the decisions, context, and next step between them.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" nativeButton={false} render={<Link href="/sign-up" />}>Create your shared mind<ArrowRight data-icon="inline-end" /></Button>
            <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/dashboard" />}>See the workspace</Button>
          </div>
          <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
            {['One source of truth', 'Separate agent keys', 'Private by default'].map(item => <span key={item} className="flex items-center gap-2"><Check className="size-3 text-primary" />{item}</span>)}
          </div>
        </div>
        <AgentMemoryMap />
      </section>

      <section className="border-y bg-muted/30">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-24 sm:px-6 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">The continuity problem</p>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">Every new chat starts by asking you to repeat the past.</h2>
            <p className="mt-5 text-pretty leading-7 text-muted-foreground">The plan was in one conversation. The tradeoff lived in another. Your next agent sees files, but not the reasoning that shaped them. Mindstate turns that scattered trail into a workspace agents can actively use.</p>
          </div>
          <div className="flex flex-col gap-4">
            {[
              ['01', 'OpenCode makes the call', 'It chooses heartbeat-based presence and stores the reason—not just the resulting code.'],
              ['02', 'Mindstate keeps the thread', 'The decision joins its project, session, tags, and handoff in one owner-scoped source.'],
              ['03', 'Codex picks up without a reset', 'It searches memory, reads the latest handoff, and continues with the constraints already understood.'],
            ].map(([number, title, description]) => <Card key={number}><CardHeader className="sm:flex-row sm:items-start sm:gap-6"><span className="font-mono text-xs text-primary">{number}</span><div><CardTitle>{title}</CardTitle><CardDescription className="mt-2 max-w-xl leading-6">{description}</CardDescription></div></CardHeader></Card>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <div className="mb-10 max-w-2xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">What the next agent sees</p>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">Not a transcript. A working memory.</h2>
          <p className="mt-4 leading-7 text-muted-foreground">Important context arrives organized and actionable, while live sessions make ownership visible.</p>
        </div>
        <div className="overflow-hidden rounded-2xl border bg-card shadow-xl">
          <div className="flex h-12 items-center justify-between border-b px-4">
            <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground"><Circle className="size-2 fill-primary text-primary" />mindstate / shared-workspace</div>
            <Badge variant="secondary" className="font-mono text-[9px] uppercase">3 agents synced</Badge>
          </div>
          <div className="grid min-h-96 lg:grid-cols-[220px_minmax(0,1fr)_270px]">
            <aside className="hidden border-r p-4 lg:block">
              <p className="px-2 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Story</p>
              {['Project context', 'Decisions', 'Sessions', 'Handoffs'].map((item, index) => <div key={item} className={`flex items-center justify-between rounded-md px-2 py-2.5 text-xs ${index === 1 ? 'bg-secondary text-foreground' : 'text-muted-foreground'}`}><span>{item}</span>{item === 'Sessions' ? <span className="font-mono text-[9px] text-primary">1 live</span> : null}</div>)}
              <Separator className="my-4" />
              <p className="px-2 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Connected</p>
              {agents.map(({ name, icon: Icon }) => <div key={name} className="flex items-center gap-2 px-2 py-2 text-xs"><Icon className="size-3 text-muted-foreground" /><span>{name}</span></div>)}
            </aside>
            <div className="min-w-0 p-5 sm:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="font-mono text-[10px] uppercase tracking-widest text-primary">Memory stream</p><h3 className="mt-1 text-lg font-semibold">The decisions behind the build</h3></div>
                <div className="relative sm:w-56"><Search className="absolute left-3 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" /><Input readOnly className="h-8 pl-8 font-mono text-[11px]" placeholder="Search shared memory..." /></div>
              </div>
              <div className="mt-5 overflow-hidden rounded-xl border">
                {memoryRows.map(memory => <article key={memory.title} className="flex gap-3 border-b p-4 last:border-b-0"><span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary"><FileText className="size-3 text-muted-foreground" /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h4 className="text-sm font-medium">{memory.title}</h4><Badge variant="outline" className="text-[9px]">{memory.type}</Badge></div><p className="mt-1 text-xs leading-5 text-muted-foreground">{memory.detail}</p><span className="mt-2 block font-mono text-[10px] text-primary">#{memory.tag}</span></div></article>)}
              </div>
            </div>
            <aside className="border-t p-5 lg:border-l lg:border-t-0">
              <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Current chapter</h3><span className="font-mono text-[9px] uppercase text-primary">live</span></div>
              <Card size="sm" className="mt-4"><CardHeader><div className="flex items-center gap-2"><Circle className="size-2 fill-primary text-primary" /><CardTitle className="text-xs">Implement agent handoff</CardTitle></div><CardDescription className="font-mono text-[10px]">OpenCode · seen now</CardDescription></CardHeader></Card>
              <div className="mt-5 rounded-xl bg-secondary p-4"><p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Next in the story</p><div className="mt-3 flex items-center gap-3"><GitBranch className="size-4 text-primary" /><p className="text-xs leading-5">Codex retrieves the handoff and continues from this checkpoint.</p></div></div>
            </aside>
          </div>
        </div>
      </section>

      <section className="border-t">
        <div className="mx-auto flex max-w-4xl flex-col items-center px-4 py-24 text-center sm:px-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Stop starting over</p>
          <h2 className="mt-4 text-balance text-4xl font-semibold tracking-tight">Give every agent the chapter before.</h2>
          <p className="mt-4 max-w-xl text-pretty leading-7 text-muted-foreground">Create one private source of truth, connect each tool with its own key, and let the work move without losing its mind.</p>
          <Button className="mt-8" size="lg" nativeButton={false} render={<Link href="/sign-up" />}>Start your workspace<ArrowRight data-icon="inline-end" /></Button>
        </div>
      </section>
    </main>
  )
}
