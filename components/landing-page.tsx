import { SiteHeader } from '@/components/landing/site-header'
import { Hero } from '@/components/landing/hero'
import { Enroll } from '@/components/landing/enroll'
import { MemoryStream } from '@/components/landing/memory-stream'
import { FlowDiagram } from '@/components/landing/flow-diagram'
import { Lifecycle } from '@/components/landing/lifecycle'
import { Platform } from '@/components/landing/platform'
import { Closing } from '@/components/landing/closing'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <Hero />
        <Enroll />
        <MemoryStream />
        <FlowDiagram />
        <Lifecycle />
        <Platform />
        <Closing />
      </main>
    </div>
  )
}
