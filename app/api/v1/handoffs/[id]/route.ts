import { NextResponse } from 'next/server'
import { z } from 'zod'
import { actorFromRequest, can } from '@/lib/dal/request-actor'
import { handoffInputSchema, workspaceService } from '@/lib/application/workspace-service'
import { validationError } from '@/lib/application/contracts'

const updateSchema = handoffInputSchema.partial().extend({ status: z.enum(['open', 'closed']).optional() }).strict()
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = await actorFromRequest(request); if (!actor) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 })
  if (!can(actor, 'memory:write')) return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'memory:write scope required' } }, { status: 403 })
  const { id } = await context.params; if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid handoff ID' } }, { status: 400 })
  const parsed = updateSchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 })
  try { const data = await workspaceService.updateHandoff(actor, id, parsed.data); return data ? NextResponse.json({ data }) : NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Handoff not found' } }, { status: 404 }) } catch (error) { return NextResponse.json({ error: { code: 'INVALID_RELATION', message: error instanceof Error ? error.message : 'Invalid relationship' } }, { status: 400 }) }
}
