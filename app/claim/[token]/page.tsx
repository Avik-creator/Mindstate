import Link from 'next/link'
import { Clock3, ShieldX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WorkspaceClaimForm } from '@/components/workspace-claim-form'
import { getWorkspaceClaim } from '@/lib/application/workspace-claim-service'

export const dynamic = 'force-dynamic'

export default async function ClaimPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const claim = await getWorkspaceClaim(token)

  if (!claim?.valid) {
    const expired = claim && claim.expiresAt <= new Date()
    return (
      <main className="flex min-h-screen items-center justify-center px-5 py-12">
        <section className="w-full max-w-lg rounded-2xl border bg-card p-8 text-center shadow-xl sm:p-12">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">{expired ? <Clock3 aria-hidden="true" /> : <ShieldX aria-hidden="true" />}</div>
          <p className="mt-8 font-mono text-xs uppercase tracking-widest text-primary">Claim unavailable</p>
          <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight">This link can no longer be used.</h1>
          <p className="mt-3 text-pretty text-sm leading-6 text-muted-foreground">It may have expired, already been claimed, or been replaced by a newer request. Ask your agent to create a new workspace claim.</p>
          <Button className="mt-8" variant="outline" asChild><Link href="/">Return home</Link></Button>
        </section>
      </main>
    )
  }

  return <WorkspaceClaimForm token={token} name={claim.name} email={claim.email} agentName={claim.agentName} />
}
