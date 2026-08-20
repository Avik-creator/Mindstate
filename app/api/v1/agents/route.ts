import { NextResponse } from 'next/server'
import { actorFromRequest } from '@/lib/dal/request-actor'
import { workspaceService } from '@/lib/application/workspace-service'

export async function GET(request: Request) {
  const actor = await actorFromRequest(request)
  if (!actor || actor.credentialId) return NextResponse.json({ error: { code: 'SESSION_REQUIRED', message: 'Owner session authentication required' } }, { status: 401 })
  return NextResponse.json({ data: await workspaceService.listAgents(actor) })
}
