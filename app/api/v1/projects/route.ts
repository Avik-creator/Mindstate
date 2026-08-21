import { NextResponse } from 'next/server'
import { actorFromRequest, can } from '@/lib/dal/request-actor'
import { projectInputSchema, workspaceService } from '@/lib/application/workspace-service'
import { validationError } from '@/lib/application/contracts'

export async function GET(request: Request) {
  const actor = await actorFromRequest(request)
  if (!actor) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 })
  if (!can(actor, 'project:read')) return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'project:read scope required' } }, { status: 403 })
  return NextResponse.json({ data: await workspaceService.listProjects(actor) })
}
export async function POST(request: Request) {
  const actor = await actorFromRequest(request)
  if (!actor) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 })
  if (!can(actor, 'project:write')) return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'project:write scope required' } }, { status: 403 })
  const parsed = projectInputSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 })
  return NextResponse.json({ data: await workspaceService.createProject(actor, parsed.data) }, { status: 201 })
}
