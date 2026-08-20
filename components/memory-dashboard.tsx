'use client'

import { useMemo, useState } from 'react'
import {
  Archive,
  ArrowUpRight,
  Bot,
  Braces,
  Check,
  ChevronDown,
  CircleDot,
  Clock3,
  Command,
  Copy,
  Database,
  FileText,
  Folder,
  KeyRound,
  Layers3,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings2,
  Sparkles,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { memories, projects, sessions, type MemoryKind } from '@/lib/demo-data'
import { authClient } from '@/lib/auth-client'

const navigation = [
  { label: 'Overview', icon: Layers3 },
  { label: 'Memories', icon: FileText, count: 29 },
  { label: 'Sessions', icon: Clock3, count: 3 },
  { label: 'Handoffs', icon: ArrowUpRight, count: 2 },
]

function Brand() {
  return (
    <div className="flex items-center gap-3 px-3">
      <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Braces className="size-4" aria-hidden="true" />
      </div>
      <div className="flex flex-col">
        <span className="font-sans text-sm font-semibold tracking-tight">Threadbase</span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">private memory</span>
      </div>
    </div>
  )
}

function SidebarContent({ user }: { user: { name: string; email: string } }) {
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center"><Brand /></div>
      <div className="px-3"><Separator /></div>
      <nav aria-label="Primary" className="flex flex-col gap-1 p-3">
        {navigation.map((item, index) => (
          <button
            key={item.label}
            type="button"
            className={`flex h-9 w-full items-center gap-3 rounded-md px-3 text-sm transition-colors ${index === 0 ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`}
          >
            <item.icon className="size-4" aria-hidden="true" />
            <span>{item.label}</span>
            {item.count ? <span className="ml-auto font-mono text-xs">{item.count}</span> : null}
          </button>
        ))}
      </nav>
      <div className="px-6 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Projects</div>
      <div className="flex flex-col gap-1 px-3">
        {projects.map((project) => (
          <button key={project.name} type="button" className="flex h-9 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <Folder className="size-4" aria-hidden="true" />
            <span className="truncate">{project.name}</span>
            <span className="ml-auto font-mono text-xs">{project.count}</span>
          </button>
        ))}
      </div>
      <div className="mt-auto flex flex-col gap-1 p-3">
        <button type="button" className="flex h-9 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"><KeyRound className="size-4" />API keys</button>
        <button type="button" className="flex h-9 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"><Settings2 className="size-4" />Settings</button>
        <div className="mt-2 flex items-center gap-3 rounded-md border border-sidebar-border p-2">
          <div className="flex size-8 items-center justify-center rounded-md bg-secondary font-mono text-xs font-semibold">{user.name.slice(0, 2).toUpperCase()}</div>
          <div className="min-w-0 flex-1"><div className="truncate text-xs font-medium">{user.name}</div><div className="truncate text-[11px] text-muted-foreground">{user.email}</div></div>
          <button type="button" aria-label="Sign out" onClick={() => authClient.signOut({ fetchOptions: { onSuccess: () => { window.location.href = '/' } } })} className="rounded p-1 text-muted-foreground hover:text-foreground"><LogOut className="size-4" /></button>
        </div>
      </div>
    </div>
  )
}

function NewMemoryDialog() {
  const [saved, setSaved] = useState(false)
  return (
    <Dialog onOpenChange={() => setSaved(false)}>
      <DialogTrigger render={<Button size="sm" />}><Plus data-icon="inline-start" />New memory</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add memory</DialogTitle>
          <DialogDescription>Capture durable context for you and your agents.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <label className="flex flex-col gap-2 text-sm font-medium">Title<Input placeholder="What should be remembered?" /></label>
          <label className="flex flex-col gap-2 text-sm font-medium">Context<Textarea className="min-h-32" placeholder="Write the decision, preference, constraint, or handoff..." /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-2 text-sm font-medium">Project<Input defaultValue="Threadbase" /></label>
            <label className="flex flex-col gap-2 text-sm font-medium">Tags<Input placeholder="agents, api" /></label>
          </div>
        </div>
        <DialogFooter><Button onClick={() => setSaved(true)}>{saved ? <Check data-icon="inline-start" /> : <Plus data-icon="inline-start" />}{saved ? 'Captured' : 'Capture memory'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function MemoryRow({ memory }: { memory: (typeof memories)[number] }) {
  const kindLabels: Record<MemoryKind, string> = { decision: 'Decision', context: 'Context', preference: 'Preference', handoff: 'Handoff' }
  return (
    <article className="group flex flex-col gap-3 border-b border-border px-5 py-4 transition-colors last:border-b-0 hover:bg-muted/40 sm:flex-row sm:items-start">
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground">
        {memory.kind === 'handoff' ? <ArrowUpRight className="size-4" /> : memory.kind === 'decision' ? <CircleDot className="size-4" /> : <FileText className="size-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-medium">{memory.title}</h3><Badge variant="outline">{kindLabels[memory.kind]}</Badge></div>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">{memory.content}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-[11px] text-muted-foreground">
          <span>{memory.project}</span><span>·</span>{memory.tags.map((tag) => <span key={tag}>#{tag}</span>)}<span>·</span><span>{memory.source}</span>
        </div>
      </div>
      <span className="shrink-0 font-mono text-[11px] text-muted-foreground">{memory.updatedAt}</span>
    </article>
  )
}

export function MemoryDashboard({ user }: { user: { name: string; email: string } }) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => memories.filter((memory) => `${memory.title} ${memory.content} ${memory.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase())), [query])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-sidebar-border lg:block"><SidebarContent user={user} /></aside>
      <main className="min-h-screen lg:pl-60">
        <header className="sticky top-0 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur md:px-6">
          <Sheet><SheetTrigger render={<Button variant="outline" size="icon" className="lg:hidden" />}><Menu /><span className="sr-only">Open navigation</span></SheetTrigger><SheetContent side="left" className="w-60 p-0"><SheetHeader className="sr-only"><SheetTitle>Navigation</SheetTitle><SheetDescription>Workspace navigation</SheetDescription></SheetHeader><SidebarContent user={user} /></SheetContent></Sheet>
          <div className="relative max-w-xl flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} className="h-9 pl-9 font-mono text-xs" placeholder="Search memory..." aria-label="Search memories" /></div>
          <Button variant="outline" size="sm" className="hidden sm:inline-flex"><Command data-icon="inline-start" />Command</Button>
          <NewMemoryDialog />
        </header>

        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 md:px-8 md:py-10">
          <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-2"><p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Workspace / Overview</p><h1 className="text-balance font-sans text-3xl font-semibold tracking-tight md:text-4xl">Memory your agents can use.</h1><p className="max-w-2xl text-pretty text-sm leading-6 text-muted-foreground">Capture context by hand, continue work across sessions, and expose only the right memory through a single Next.js API and MCP surface.</p></div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="size-2 rounded-full bg-primary" /><span>Private workspace</span><span>·</span><span>Neon connected</span></div>
          </section>

          <section aria-label="Workspace summary" className="grid border-y sm:grid-cols-2 lg:grid-cols-4">
            {[['29', 'Memories', FileText], ['3', 'Active sessions', Bot], ['4', 'Projects', Folder], ['2', 'Open handoffs', ArrowUpRight]].map(([value, label, Icon], index) => (
              <div key={String(label)} className={`flex items-center gap-4 px-4 py-5 ${index < 3 ? 'lg:border-r' : ''} ${index % 2 === 0 ? 'sm:border-r lg:border-r' : ''}`}><div className="flex size-9 items-center justify-center rounded-md bg-secondary text-muted-foreground"><Icon className="size-4" /></div><div><div className="font-mono text-xl font-medium">{value as string}</div><div className="text-xs text-muted-foreground">{label as string}</div></div></div>
            ))}
          </section>

          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_300px]">
            <section className="min-w-0 overflow-hidden rounded-lg border bg-card">
              <div className="flex items-center justify-between border-b px-5 py-4"><div><h2 className="text-sm font-semibold">Recent memory</h2><p className="mt-1 text-xs text-muted-foreground">High-signal context across your workspace</p></div><Button variant="ghost" size="sm">View all<ArrowUpRight data-icon="inline-end" /></Button></div>
              <div>{filtered.length ? filtered.map((memory) => <MemoryRow key={memory.id} memory={memory} />) : <div className="flex min-h-48 flex-col items-center justify-center gap-2 p-8 text-center"><Archive className="size-5 text-muted-foreground" /><p className="text-sm font-medium">No matching memory</p><p className="text-xs text-muted-foreground">Try another word or capture a new memory.</p></div>}</div>
            </section>

            <aside className="flex flex-col gap-6">
              <section className="rounded-lg border bg-card"><div className="border-b px-4 py-3"><h2 className="text-sm font-semibold">Live sessions</h2></div><div className="flex flex-col">{sessions.map((session) => <div key={session.title} className="flex gap-3 border-b p-4 last:border-b-0"><div className="mt-1"><span className={`block size-2 rounded-full ${session.status === 'active' ? 'bg-primary' : 'bg-muted-foreground/40'}`} /></div><div className="min-w-0 flex-1"><div className="truncate text-xs font-medium">{session.title}</div><div className="mt-1 font-mono text-[10px] text-muted-foreground">{session.agent} · {session.memories} memories</div></div><span className="font-mono text-[10px] text-muted-foreground">{session.time}</span></div>)}</div></section>
              <section className="rounded-lg border bg-card p-4"><div className="flex items-center gap-2"><div className="flex size-8 items-center justify-center rounded-md bg-secondary"><Database className="size-4" /></div><div><h2 className="text-sm font-semibold">Persistence active</h2><p className="text-xs text-muted-foreground">Neon + Drizzle + Better Auth</p></div></div><p className="mt-4 text-xs leading-5 text-muted-foreground">Your private workspace is backed by Postgres with owner-scoped reads, writes, API keys, and MCP access.</p><div className="mt-4 flex items-center gap-2 text-xs text-primary"><Check className="size-4" />Migration applied</div></section>
              <section className="rounded-lg border bg-card p-4"><div className="flex items-center justify-between"><span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">MCP endpoint</span><Badge variant="secondary">Next.js</Badge></div><code className="mt-3 block truncate rounded-md bg-secondary p-3 font-mono text-[11px]">/api/mcp</code><Button variant="ghost" size="sm" className="mt-2 w-full"><Copy data-icon="inline-start" />Copy endpoint</Button></section>
            </aside>
          </div>
        </div>
      </main>
    </div>
  )
}
