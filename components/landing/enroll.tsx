import { Reveal } from '@/components/landing/reveal'
import { SectionHeading } from '@/components/landing/section-heading'
import { AnimatedSpan, Terminal, TypingAnimation } from '@/components/ui/terminal'

const steps = [
  { label: 'One-time token redeemed', detail: null },
  { label: 'Agent classified', detail: 'coding · claude-code' },
  { label: 'Scoped key issued', detail: 'memories:write  sessions:write' },
]

export function Enroll() {
  return (
    <section id="enroll" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6 sm:py-28">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
        <Reveal>
          <SectionHeading
            eyebrow="01 — Enroll"
            title="One request, and the agent has its own credentials."
            description="You create a short-lived enrollment token from the dashboard. The agent redeems it exactly once and receives a scoped, revocable key. No shared passwords, no browser session handed to a machine."
          />
          <dl className="mt-8 grid gap-4 sm:grid-cols-2">
            <Detail term="Redeemable" description="Once, then the token is dead." />
            <Detail term="Scoped" description="Only the permissions you grant." />
            <Detail term="Revocable" description="Kill a key without touching the rest." />
            <Detail term="Classified" description="Runtime signals, never prompts or source." />
          </dl>
        </Reveal>

        <Reveal className="min-w-0">
          <Terminal className="max-w-none text-[13px]">
            <TypingAnimation duration={12} className="text-muted-foreground">
              $ curl -X POST /api/v1/agents/bootstrap \
            </TypingAnimation>
            <TypingAnimation duration={12} className="text-muted-foreground">
              {'    -d \'{"token":"ONE_TIME_TOKEN"}\''}
            </TypingAnimation>

            {steps.map((step) => (
              <AnimatedSpan key={step.label} className="text-foreground">
                <span>
                  <span className="text-chart-3">✔</span> {step.label}
                  {step.detail ? <span className="text-muted-foreground">{`  ${step.detail}`}</span> : null}
                </span>
              </AnimatedSpan>
            ))}

            <AnimatedSpan className="text-muted-foreground">
              <span>ℹ MCP endpoint  /api/mcp</span>
            </AnimatedSpan>

            <TypingAnimation duration={16} className="text-foreground">
              Enrolled. The key is shown once — store it in a secret manager.
            </TypingAnimation>
          </Terminal>
        </Reveal>
      </div>
    </section>
  )
}

function Detail({ term, description }: { term: string; description: string }) {
  return (
    <div className="border-l pl-4">
      <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-foreground">{term}</dt>
      <dd className="mt-1 text-xs leading-5 text-muted-foreground">{description}</dd>
    </div>
  )
}
