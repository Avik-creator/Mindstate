'use client'

import { Activity, ArrowUpRight, Bot, Braces, FileText, Folder, Layers3, LogOut, ScrollText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { authClient } from '@/lib/auth-client'
import type { Project, Summary, View } from '@/components/dashboard/types'

const nav: Array<{ label: View; icon: typeof Layers3 }> = [
  { label: 'Overview', icon: Layers3 },
  { label: 'Memories', icon: FileText },
  { label: 'Projects', icon: Folder },
  { label: 'Sessions', icon: Activity },
  { label: 'Handoffs', icon: ArrowUpRight },
  { label: 'Agents', icon: Bot },
  { label: 'Activity', icon: ScrollText },
]

function Brand() {
  return (
    <div className="flex items-center gap-3 px-3">
      <div className="flex size-8 items-center justify-center bg-primary text-primary-foreground">
        <Braces className="size-4" aria-hidden="true" />
      </div>
      <div>
        <div className="text-sm font-semibold">Mindstate</div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">private memory</div>
      </div>
    </div>
  )
}

type SidebarProps = {
  user: { name: string; email: string }
  view: View
  setView: (view: View) => void
  summary?: Summary
  projects: Project[]
}

export function Sidebar({ user, view, setView, summary, projects }: SidebarProps) {
  const counts: Partial<Record<View, number>> = {
    Memories: summary?.memories,
    Projects: summary?.projects,
    Sessions: summary?.sessions.live,
    Handoffs: summary?.openHandoffs,
    Agents: summary?.agents,
  }

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center">
        <Brand />
      </div>
      <div className="px-3">
        <Separator />
      </div>

      <nav className="flex flex-col gap-1 p-3" aria-label="Primary">
        {nav.map(({ label, icon: Icon }) => (
          <Button
            key={label}
            type="button"
            variant={view === label ? 'secondary' : 'ghost'}
            aria-current={view === label ? 'page' : undefined}
            onClick={() => setView(label)}
            className="w-full justify-start"
          >
            <Icon data-icon="inline-start" />
            <span className="text-xs uppercase tracking-[0.12em]">{label}</span>
            {counts[label] !== undefined ? (
              <span className="ml-auto font-mono text-xs text-muted-foreground">{counts[label]}</span>
            ) : null}
          </Button>
        ))}
      </nav>

      <div className="px-6 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Projects</div>
      <div className="flex flex-col gap-1 px-3">
        {projects.slice(0, 6).map((project) => (
          <Button
            key={project.id}
            type="button"
            variant="ghost"
            onClick={() => setView('Projects')}
            className="w-full justify-start text-muted-foreground"
          >
            <Folder data-icon="inline-start" />
            <span className="truncate">{project.name}</span>
            <span className="ml-auto font-mono text-xs">{project.memoryCount}</span>
          </Button>
        ))}
        {!projects.length ? <p className="px-3 py-2 text-xs text-muted-foreground">No projects yet</p> : null}
      </div>

      <div className="mt-auto p-3">
        <div className="flex items-center gap-3 border-2 border-foreground p-2">
          <div className="flex size-8 items-center justify-center bg-secondary font-mono text-xs">
            {user.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium">{user.name}</div>
            <div className="truncate text-[11px] text-muted-foreground">{user.email}</div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Sign out"
            onClick={() => authClient.signOut({ fetchOptions: { onSuccess: () => { window.location.href = '/' } } })}
          >
            <LogOut />
          </Button>
        </div>
      </div>
    </div>
  )
}
