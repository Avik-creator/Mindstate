import { SiteHeader } from '@/components/landing/site-header'
import { Hero } from '@/components/landing/hero'
import { FeatureGrid } from '@/components/landing/feature-grid'
import { Protocol } from '@/components/landing/protocol'
import { Compatibility } from '@/components/landing/compatibility'
import { Closing } from '@/components/landing/closing'

export function LandingPage() {
  return (
    <div className="dot-grid-bg min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <Hero />
        <FeatureGrid />
        <Protocol />
        <Compatibility />
      </main>
      <Closing />
    </div>
  )
}
