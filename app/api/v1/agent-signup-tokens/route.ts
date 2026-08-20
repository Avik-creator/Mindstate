import { NextResponse } from 'next/server'
import { issueAgentSignupToken } from '@/lib/application/agent-service'
import { signupTokenCreateSchema, validationError } from '@/lib/application/contracts'
import { actorFromRequest } from '@/lib/dal/request-actor'

export async function POST(request: Request) {
  const actor = await actorFromRequest(request)
  if (!actor || actor.credentialId) return NextResponse.json({ error: { code: 'SESSION_REQUIRED', message: 'Owner session authentication required' } }, { status: 401 })
  const parsed = signupTokenCreateSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 })
  const data = await issueAgentSignupToken(actor.userId, parsed.data)
  return NextResponse.json({ data, warning: 'Copy this token now. It expires and can be used only once.' }, { status: 201 })
}
