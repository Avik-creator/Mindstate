import { NextResponse } from 'next/server'
import { apiGuard } from '@/lib/dal/api-guard'
import { agentTelemetrySchema, workspaceService } from '@/lib/application/workspace-service'
import { validationError } from '@/lib/application/contracts'

export async function POST(request: Request) {
  const { actor, response } = await apiGuard(request, 'agent:write', { agentOnly: true })
  if (!actor) return response
  const parsed = agentTelemetrySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 })
  const data = await workspaceService.recordAgentTelemetry(actor, parsed.data)
  return NextResponse.json({ data })
}
