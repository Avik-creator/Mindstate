import { NextResponse } from 'next/server'
import { z } from 'zod'
import { actorFromRequest, can } from '@/lib/dal/request-actor'
import { projectInputSchema, workspaceService } from '@/lib/application/workspace-service'
import { validationError } from '@/lib/application/contracts'

const idSchema = z.string().uuid()
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = await actorFromRequest(request); if (!actor) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 })
  if (!can(actor, 'memory:write')) return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'memory:write scope required' } }, { status: 403 })
  const { id } = await context.params; if (!idSchema.safeParse(id).success) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid project ID' } }, { status: 400 })
  const parsed = projectInputSchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 })
  const data = await workspaceService.updateProject(actor, id, parsed.data); return data ? NextResponse.json({ data }) : NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Project not found' } }, { status: 404 })
}
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = await actorFromRequest(request); if (!actor) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 })
  if (!can(actor, 'memory:write')) return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'memory:write scope required' } }, { status: 403 })
  const { id } = await context.params; if (!idSchema.safeParse(id).success) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid project ID' } }, { status: 400 })
  const result = await workspaceService.deleteProject(actor, id)
  if (result && 'conflict' in result) return NextResponse.json({ error: { code: 'CONFLICT', message: 'Project has related memories, sessions, or handoffs' } }, { status: 409 })
  return result ? NextResponse.json({ data: result }) : NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Project not found' } }, { status: 404 })
}
