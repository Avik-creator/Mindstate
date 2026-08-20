import { NextResponse } from 'next/server'
import { redeemAgentSignupToken } from '@/lib/application/agent-service'
import { agentBootstrapSchema, validationError } from '@/lib/application/contracts'

export async function POST(request: Request) {
  const parsed = agentBootstrapSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 })
  const data = await redeemAgentSignupToken(parsed.data.token, parsed.data.agentName)
  if (!data) return NextResponse.json({ error: { code: 'TOKEN_INVALID', message: 'The signup token is invalid, expired, or already used' } }, { status: 410 })
  return NextResponse.json({ data, warning: 'Store the API key securely. It will not be shown again.' }, { status: 201 })
}
