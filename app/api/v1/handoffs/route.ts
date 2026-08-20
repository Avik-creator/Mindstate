import { NextResponse } from 'next/server'
import { actorFromRequest, can } from '@/lib/dal/request-actor'
import { handoffInputSchema, workspaceService } from '@/lib/application/workspace-service'
import { validationError } from '@/lib/application/contracts'

export async function GET(request: Request) {
  const actor = await actorFromRequest(request); if (!actor) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 })
  if (!can(actor, 'memory:read')) return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'memory:read scope required' } }, { status: 403 })
  return NextResponse.json({ data: await workspaceService.listHandoffs(actor) })
}
export async function POST(request: Request) {
  const actor = await actorFromRequest(request); if (!actor) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 })
  if (!can(actor, 'memory:write')) return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'memory:write scope required' } }, { status: 403 })
  const parsed = handoffInputSchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 })
  try { return NextResponse.json({ data: await workspaceService.createHandoff(actor, parsed.data) }, { status: 201 }) } catch (error) { return NextResponse.json({ error: { code: 'INVALID_RELATION', message: error instanceof Error ? error.message : 'Invalid relationship' } }, { status: 400 }) }
}
