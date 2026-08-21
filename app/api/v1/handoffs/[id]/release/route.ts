import { NextResponse } from 'next/server'
import { z } from 'zod'
import { workspaceService } from '@/lib/application/workspace-service'
import { validationError } from '@/lib/application/contracts'
import { apiGuard } from '@/lib/dal/api-guard'

const bodySchema = z.object({ sessionId: z.string().uuid() }).strict()

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { actor, response } = await apiGuard(request, 'handoff:write')
  if (!actor) return response

  const { id } = await context.params
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid handoff ID' } }, { status: 400 })
  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 })

  const released = await workspaceService.releaseHandoff(actor, id, parsed.data.sessionId)
  return released
    ? NextResponse.json({ data: released })
    : NextResponse.json({ error: { code: 'NOT_HELD', message: 'That session does not hold this handoff.' } }, { status: 409 })
}
