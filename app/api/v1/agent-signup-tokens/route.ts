import { NextResponse } from 'next/server'
import { issueAgentSignupToken } from '@/lib/application/agent-service'
import { signupTokenCreateSchema, validationError } from '@/lib/application/contracts'
import { apiGuard } from '@/lib/dal/api-guard'

export async function POST(request: Request) {
  const { actor, response } = await apiGuard(request, undefined, { sessionOnly: true })
  if (!actor) return response
  const parsed = signupTokenCreateSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 })
  const data = await issueAgentSignupToken(actor.userId, parsed.data)
  return NextResponse.json({ data, warning: 'Copy this token now. It expires and can be used only once.' }, { status: 201 })
}
