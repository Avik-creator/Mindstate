import { SectionLabel } from '@/components/landing/section-label'
import { Reveal } from '@/components/landing/reveal'

const steps = [
  { id: '01', title: 'Prepare', body: 'An agent requests a workspace for a human. It never sees or sets the password.' },
  { id: '02', title: 'Claim', body: 'The owner opens a 30-minute link, chooses a password, and the workspace becomes theirs.' },
  { id: '03', title: 'Enroll', body: 'The owner issues a one-time token. Redeeming it once returns a scoped, revocable key.' },
  { id: '04', title: 'Work', body: 'The agent opens a session, writes memories as it goes, and hands off when it stops.' },
]

const surfaces = [
  { name: 'REST', detail: '/api/v1 — memories, projects, sessions, handoffs' },
  { name: 'MCP', detail: '/api/mcp — twelve tools over bearer auth' },
]

export function Protocol() {
  return (
    <section id="protocol" className="w-full px-6 py-20 lg:px-12">
      <SectionLabel label="SECTION: HOW_IT_CONNECTS" index="002" />
      <Reveal>
        <div className="grid grid-cols-1 border-2 border-foreground lg:grid-cols-4">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`cell flex flex-col gap-3 p-6 ${index < steps.length - 1 ? 'border-b-2 border-foreground lg:border-b-0 lg:border-r-2' : ''}`}
            >
              <span className="font-pixel text-2xl text-brand">{step.id}</span>
              <h3 className="text-xs uppercase tracking-[0.2em]">{step.title}</h3>
              <p className="text-[11px] leading-5 text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {surfaces.map((surface) => (
            <div key={surface.name} className="cell border-2 border-foreground p-6">
              <h3 className="font-pixel text-3xl">{surface.name}</h3>
              <p className="mt-2 text-[11px] leading-5 text-muted-foreground">{surface.detail}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  )
}
