import { NextResponse } from 'next/server'
import { z } from 'zod'
import { workspaceService } from '@/lib/application/workspace-service'
import { validationError } from '@/lib/application/contracts'
import { apiGuard } from '@/lib/dal/api-guard'

const bodySchema = z.object({ sessionId: z.string().uuid() }).strict()

// Claiming requires a live session, which is what makes the claim self-expiring.
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { actor, response } = await apiGuard(request, 'handoff:write')
  if (!actor) return response

  const { id } = await context.params
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid handoff ID' } }, { status: 400 })
  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 })

  const result = await workspaceService.claimHandoff(actor, id, parsed.data.sessionId)
  if (result.error === 'SESSION_NOT_LIVE') {
    return NextResponse.json({ error: { code: 'SESSION_NOT_LIVE', message: 'Start a session and heartbeat it before claiming work.' } }, { status: 409 })
  }
  if (result.error === 'UNAVAILABLE') {
    return NextResponse.json({ error: { code: 'UNAVAILABLE', message: 'This handoff is closed or already held by a live agent.' } }, { status: 409 })
  }
  return NextResponse.json({ data: result.handoff })
}
