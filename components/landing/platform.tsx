import { FolderGit2, GitBranch, KeyRound, Radio, Search, Terminal } from 'lucide-react'
import { Marquee } from '@/components/ui/marquee'
import { Reveal } from '@/components/landing/reveal'
import { SectionHeading } from '@/components/landing/section-heading'

const capabilities = [
  { icon: Search, title: 'Searchable memory', detail: 'Typed and tagged, linked to the project and session it came from.' },
  { icon: Radio, title: 'Live sessions', detail: 'Heartbeat presence with stale detection, no open connections.' },
  { icon: GitBranch, title: 'Structured handoffs', detail: 'One agent stops, the next one picks up the thread.' },
  { icon: FolderGit2, title: 'Projects', detail: 'Group memories, sessions, and handoffs that belong together.' },
  { icon: KeyRound, title: 'Scoped keys', detail: 'One-time enrollment, explicit scopes, revoke any key alone.' },
  { icon: Terminal, title: 'REST and MCP', detail: 'The same owner-scoped boundary behind both interfaces.' },
]

const agents = [
  'claude code', 'cursor', 'codex', 'browser agents', 'research agents',
  'ci runners', 'automation workers', 'custom mcp clients',
]

export function Platform() {
  return (
    <section id="platform" className="scroll-mt-24 border-y bg-card">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <Reveal>
          <SectionHeading
            align="center"
            eyebrow="05 — Platform"
            title="Everything an agent needs, nothing it should not have."
          />
        </Reveal>

        <Reveal>
          <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((capability) => (
              <div key={capability.title} className="h-full bg-card p-6">
                <capability.icon className="size-4 text-muted-foreground" aria-hidden="true" />
                <h3 className="mt-4 text-sm font-medium">{capability.title}</h3>
                <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{capability.detail}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal>
          <div className="relative mt-14 overflow-hidden">
            <Marquee pauseOnHover className="[--duration:40s] [--gap:2.5rem]">
              {agents.map((agent) => (
                <span
                  key={agent}
                  className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
                >
                  {agent}
                </span>
              ))}
            </Marquee>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-card to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-card to-transparent" />
          </div>
        </Reveal>
      </div>
    </section>
  )
}
