import { SectionLabel } from '@/components/landing/section-label'
import { Reveal } from '@/components/landing/reveal'

// Clients that speak MCP or plain HTTP. A statement about the protocol, not a partnership claim.
const CLIENTS = [
  'CLAUDE CODE',
  'CURSOR',
  'CLAUDE DESKTOP',
  'ZED',
  'CLINE',
  'CONTINUE',
  'WINDSURF',
  'ANY MCP CLIENT',
  'ANY HTTP CLIENT',
]

export function Compatibility() {
  return (
    <section id="agents" className="w-full px-6 py-16 lg:px-12">
      <SectionLabel label="SECTION: SPEAKS_MCP" index="003" />
      <Reveal>
        <div className="overflow-hidden border-2 border-foreground">
          <div className="flex w-max animate-marquee">
            {[...CLIENTS, ...CLIENTS].map((name, index) => (
              <div
                key={`${name}-${index}`}
                className={`flex shrink-0 items-center justify-center border-r-2 border-foreground px-8 py-4 ${index % 9 === 2 || index % 9 === 6 ? 'animate-glitch' : ''}`}
              >
                <span className="whitespace-nowrap text-sm uppercase tracking-[0.15em]">{name}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-4 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Connect over MCP at /api/mcp or REST at /api/v1. No SDK required.
        </p>
      </Reveal>
    </section>
  )
}
