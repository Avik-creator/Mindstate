'use client'

import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import useSWRInfinite from 'swr/infinite'
import { Menu, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { CreateDialog, type CreateKind } from '@/components/dashboard/create-dialog'
import { Sidebar } from '@/components/dashboard/sidebar'
import { fetcher } from '@/components/dashboard/api'
import { CardsSkeleton, LoadError, RowsSkeleton } from '@/components/dashboard/states'
import { AgentList } from '@/components/dashboard/views/agents'
import { CredentialList } from '@/components/dashboard/views/credentials'
import { HandoffList } from '@/components/dashboard/views/handoffs'
import { MemoryList } from '@/components/dashboard/views/memories'
import { Overview } from '@/components/dashboard/views/overview'
import { ProjectList } from '@/components/dashboard/views/projects'
import { SessionList } from '@/components/dashboard/views/sessions'
import type { Agent, ApiKey, Handoff, MemoryPage, Project, Session, Summary, View } from '@/components/dashboard/types'

// Views the search box filters on the server; the rest filter what is already loaded.
const SERVER_SEARCH: View[] = ['Overview', 'Memories']

const PAGE_SIZE = 50

const SEARCH_PLACEHOLDER: Record<View, string> = {
  Overview: 'Search memories',
  Memories: 'Search memories',
  Projects: 'Filter projects',
  Sessions: 'Filter sessions',
  Handoffs: 'Filter handoffs',
  Agents: 'Filter agents',
}

// Sessions and agents are created by enrolled agents, never by hand.
const CREATE_KIND: Partial<Record<View, CreateKind>> = {
  Overview: 'memory',
  Memories: 'memory',
  Projects: 'project',
  Handoffs: 'handoff',
}

function useDebounced(value: string, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timeout)
  }, [value, delay])
  return debounced
}

function matches(query: string, ...fields: Array<string | null | undefined>) {
  if (!query) return true
  const needle = query.toLowerCase()
  return fields.some((field) => (field ?? '').toLowerCase().includes(needle))
}

export function MemoryDashboard({
  user,
  initialView = 'Overview',
}: {
  user: { name: string; email: string }
  initialView?: View
}) {
  const [view, setView] = useState<View>(initialView)
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounced(query)
  const serverQuery = SERVER_SEARCH.includes(view) ? debouncedQuery.trim() : ''

  function changeView(next: View) {
    setView(next)
    setQuery('')
    const url = new URL(window.location.href)
    if (next === 'Overview') url.searchParams.delete('view')
    else url.searchParams.set('view', next.toLowerCase())
    window.history.replaceState(null, '', url)
  }

  const summary = useSWR<{ data: Summary }>('/api/v1/workspace/summary', fetcher, { refreshInterval: 15000 })
  const memories = useSWRInfinite<MemoryPage>(
    (index, previous) => {
      if (previous && previous.data.length < PAGE_SIZE) return null
      const search = serverQuery ? `&q=${encodeURIComponent(serverQuery)}` : ''
      return `/api/v1/memories?limit=${PAGE_SIZE}&offset=${index * PAGE_SIZE}${search}`
    },
    fetcher,
    { refreshInterval: 30000, keepPreviousData: true },
  )
  const projects = useSWR<{ data: Project[] }>('/api/v1/projects', fetcher, { refreshInterval: 30000 })
  const sessions = useSWR<{ data: Session[] }>('/api/v1/sessions?limit=100', fetcher, { refreshInterval: 15000 })
  const handoffs = useSWR<{ data: Handoff[] }>('/api/v1/handoffs', fetcher, { refreshInterval: 30000 })
  const agents = useSWR<{ data: Agent[] }>('/api/v1/agents', fetcher, { refreshInterval: 30000 })
  const apiKeys = useSWR<{ data: ApiKey[] }>('/api/v1/api-keys', fetcher, { refreshInterval: 60000 })

  const allProjects = projects.data?.data ?? []
  const allMemories = memories.data?.flatMap((page) => page.data) ?? []
  const totalMemories = memories.data?.[0]?.page.total ?? 0
  const moreMemories = allMemories.length < totalMemories
  const allSessions = sessions.data?.data ?? []
  const allHandoffs = handoffs.data?.data ?? []
  const allAgents = agents.data?.data ?? []
  const allApiKeys = apiKeys.data?.data ?? []

  const localQuery = SERVER_SEARCH.includes(view) ? '' : debouncedQuery.trim()
  const shownProjects = useMemo(
    () => allProjects.filter((p) => matches(localQuery, p.name, p.description)),
    [allProjects, localQuery],
  )
  const shownSessions = useMemo(
    () => allSessions.filter((s) => matches(localQuery, s.title, s.agent, s.presence)),
    [allSessions, localQuery],
  )
  const shownHandoffs = useMemo(
    () => allHandoffs.filter((h) => matches(localQuery, h.title, h.summary, h.status)),
    [allHandoffs, localQuery],
  )
  const shownAgents = useMemo(
    () => allAgents.filter((a) => matches(localQuery, a.name, a.category, a.runtimeName)),
    [allAgents, localQuery],
  )

  async function refresh() {
    await Promise.all([summary.mutate(), memories.mutate(), projects.mutate(), sessions.mutate(), handoffs.mutate(), agents.mutate(), apiKeys.mutate()])
  }

  const liveSummary = summary.data ? { ...summary.data.data, projects: allProjects.length } : undefined
  const createKind = CREATE_KIND[view]
  const activeQuery = debouncedQuery.trim()

  return (
    <div className="dot-grid-bg min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r-2 border-foreground bg-sidebar lg:block">
        <Sidebar user={user} view={view} setView={changeView} summary={liveSummary} projects={allProjects} />
      </aside>

      <main className="min-h-screen lg:pl-60">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b-2 border-foreground bg-background/95 px-4 backdrop-blur md:px-6">
          <Sheet>
            <SheetTrigger render={<Button variant="outline" size="icon" className="lg:hidden" />}>
              <Menu />
              <span className="sr-only">Open navigation</span>
            </SheetTrigger>
            <SheetContent side="left" className="w-60 p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation</SheetTitle>
                <SheetDescription>Workspace navigation</SheetDescription>
              </SheetHeader>
              <Sidebar user={user} view={view} setView={changeView} summary={liveSummary} projects={allProjects} />
            </SheetContent>
          </Sheet>

          <div className="relative min-w-0 max-w-xl flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-9 pl-9"
              placeholder={SEARCH_PLACEHOLDER[view]}
              aria-label={SEARCH_PLACEHOLDER[view]}
            />
          </div>

          {createKind ? <CreateDialog kind={createKind} projects={allProjects} done={refresh} /> : null}
        </header>

        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 md:px-8">
          <div className="flex items-center gap-4">
            <h1 className="font-pixel text-3xl uppercase tracking-tight sm:text-4xl">{view}</h1>
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {`// WORKSPACE`}
            </span>
          </div>

          {view === 'Overview' ? (
            <Section error={summary.error} loading={summary.isLoading && !summary.data} retry={() => { void summary.mutate() }} skeleton={<RowsSkeleton rows={3} />}>
              {liveSummary ? <Overview summary={liveSummary} memories={allMemories} projects={allProjects} refresh={refresh} /> : null}
            </Section>
          ) : null}

          {view === 'Memories' ? (
            <Section error={memories.error} loading={memories.isLoading && !memories.data} retry={() => { void memories.mutate() }} skeleton={<RowsSkeleton />}>
              <MemoryList items={allMemories} projects={allProjects} query={activeQuery} refresh={refresh} />
              {moreMemories ? (
                <div className="mt-4 flex items-center justify-center gap-3">
                  <Button variant="outline" size="sm" disabled={memories.isValidating} onClick={() => { void memories.setSize(memories.size + 1) }}>
                    {memories.isValidating ? 'Loading…' : 'Load more'}
                  </Button>
                  <span className="font-mono text-[11px] text-muted-foreground">{allMemories.length} of {totalMemories}</span>
                </div>
              ) : null}
            </Section>
          ) : null}

          {view === 'Projects' ? (
            <Section error={projects.error} loading={projects.isLoading && !projects.data} retry={() => { void projects.mutate() }} skeleton={<CardsSkeleton />}>
              <ProjectList items={shownProjects} query={activeQuery} refresh={refresh} />
            </Section>
          ) : null}

          {view === 'Sessions' ? (
            <Section error={sessions.error} loading={sessions.isLoading && !sessions.data} retry={() => { void sessions.mutate() }} skeleton={<RowsSkeleton />}>
              <SessionList items={shownSessions} query={activeQuery} />
            </Section>
          ) : null}

          {view === 'Handoffs' ? (
            <Section error={handoffs.error} loading={handoffs.isLoading && !handoffs.data} retry={() => { void handoffs.mutate() }} skeleton={<CardsSkeleton />}>
              <HandoffList items={shownHandoffs} query={activeQuery} refresh={refresh} />
            </Section>
          ) : null}

          {view === 'Agents' ? (
            <>
              <Section error={agents.error} loading={agents.isLoading && !agents.data} retry={() => { void agents.mutate() }} skeleton={<RowsSkeleton />}>
                <AgentList items={shownAgents} query={activeQuery} refresh={refresh} />
              </Section>
              <section className="flex flex-col gap-4">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">API keys</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Revoke a key to cut off a compromised agent immediately.</p>
                </div>
                <Section error={apiKeys.error} loading={apiKeys.isLoading && !apiKeys.data} retry={() => { void apiKeys.mutate() }} skeleton={<RowsSkeleton rows={2} />}>
                  <CredentialList items={allApiKeys} refresh={refresh} />
                </Section>
              </section>
            </>
          ) : null}
        </div>
      </main>
    </div>
  )
}

// Each section owns its own loading and failure state so one dead request cannot blank the page.
function Section({
  error,
  loading,
  retry,
  skeleton,
  children,
}: {
  error?: Error
  loading: boolean
  retry: () => void
  skeleton: React.ReactNode
  children: React.ReactNode
}) {
  if (error) return <LoadError message={error.message} retry={retry} />
  if (loading) return <>{skeleton}</>
  return <>{children}</>
}
