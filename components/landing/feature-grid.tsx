import { SectionLabel } from '@/components/landing/section-label'
import { LimitsCard } from '@/components/landing/bento/limits-card'
import { MemoryCard } from '@/components/landing/bento/memory-card'
import { StatusCard } from '@/components/landing/bento/status-card'
import { TerminalCard } from '@/components/landing/bento/terminal-card'
import { Reveal } from '@/components/landing/reveal'

export function FeatureGrid() {
  return (
    <section id="memory" className="w-full px-6 py-20 lg:px-12">
      <SectionLabel label="SECTION: WHAT_IT_STORES" index="001" />
      <Reveal>
        <div className="grid grid-cols-1 border-2 border-foreground md:grid-cols-2">
          <div className="cell min-h-[280px] border-b-2 border-foreground md:border-b-0 md:border-r-2">
            <TerminalCard />
          </div>
          <div className="cell min-h-[280px] border-b-2 border-foreground">
            <MemoryCard />
          </div>
          <div className="cell min-h-[280px] border-t-2 border-foreground md:border-r-2">
            <LimitsCard />
          </div>
          <div className="cell min-h-[280px] border-t-2 border-foreground">
            <StatusCard />
          </div>
        </div>
      </Reveal>
    </section>
  )
}
