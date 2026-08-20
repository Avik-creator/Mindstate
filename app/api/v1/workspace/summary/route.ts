import { NextResponse } from 'next/server'
import { actorFromRequest, can } from '@/lib/dal/request-actor'
import { workspaceService } from '@/lib/application/workspace-service'

export async function GET(request: Request) {
  const actor = await actorFromRequest(request)
  if (!actor) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 })
  if (!can(actor, 'memory:read')) return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'memory:read scope required' } }, { status: 403 })
  return NextResponse.json({ data: await workspaceService.summary(actor) })
}
