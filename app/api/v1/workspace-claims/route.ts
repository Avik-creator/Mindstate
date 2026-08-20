import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { ClaimRateLimitError, createWorkspaceClaim, workspaceClaimInputSchema } from '@/lib/application/workspace-claim-service'

export const dynamic = 'force-dynamic'

function noStore(body: unknown, status = 200, extraHeaders?: HeadersInit) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store', ...extraHeaders } })
}

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get('content-length') ?? 0)
    if (contentLength > 8_192) return noStore({ error: { code: 'payload_too_large', message: 'Request body is too large.' } }, 413)

    const input = workspaceClaimInputSchema.parse(await request.json())
    const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    const requester = forwarded || request.headers.get('x-real-ip') || 'unknown'
    const origin = new URL(request.url).origin
    const data = await createWorkspaceClaim(input, requester, origin)
    return noStore({ data }, 201)
  } catch (error) {
    if (error instanceof ZodError) return noStore({ error: { code: 'invalid_request', message: 'Provide a valid name, email, and optional agent metadata.' } }, 400)
    if (error instanceof ClaimRateLimitError) return noStore({ error: { code: 'rate_limited', message: 'Too many claim requests. Try again later.' } }, 429, { 'Retry-After': '3600' })
    return noStore({ error: { code: 'request_failed', message: 'The workspace claim could not be created.' } }, 500)
  }
}
