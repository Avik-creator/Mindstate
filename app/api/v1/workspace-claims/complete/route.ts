import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { completeClaimSchema, completeWorkspaceClaim, releaseWorkspaceClaim, reserveWorkspaceClaim } from '@/lib/application/workspace-claim-service'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  let claimId: string | undefined
  try {
    const input = completeClaimSchema.parse(await request.json())
    const claim = await reserveWorkspaceClaim(input.token)
    if (!claim) return NextResponse.json({ error: { code: 'invalid_claim', message: 'This claim link is invalid or no longer available.' } }, { status: 410, headers: { 'Cache-Control': 'no-store' } })
    claimId = claim.id

    await auth.api.signUpEmail({
      body: { email: claim.email, name: claim.name, password: input.password },
      headers: request.headers,
    })
    await completeWorkspaceClaim(claim.id)
    return NextResponse.json({ data: { redirectTo: '/dashboard' } }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    if (claimId) await releaseWorkspaceClaim(claimId)
    return NextResponse.json({ error: { code: 'claim_failed', message: 'We could not claim this workspace. Sign in if this email already has an account.' } }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
  }
}
