import { NextResponse } from 'next/server'
import { actorFromRequest, can } from '@/lib/dal/request-actor'
import { agentTelemetrySchema, workspaceService } from '@/lib/application/workspace-service'
import { validationError } from '@/lib/application/contracts'

export async function POST(request: Request) {
  const actor = await actorFromRequest(request)
  if (!actor) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 })
  if (!actor.agentId) return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Agent credential required' } }, { status: 403 })
  if (!can(actor, 'agent:write')) return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'agent:write scope required' } }, { status: 403 })
  const parsed = agentTelemetrySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 })
  const data = await workspaceService.recordAgentTelemetry(actor, parsed.data)
  return NextResponse.json({ data })
}
