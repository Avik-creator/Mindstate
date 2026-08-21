import { NextResponse } from 'next/server'
import { z } from 'zod'
import { apiGuard } from '@/lib/dal/api-guard'
import { handoffInputSchema, workspaceService } from '@/lib/application/workspace-service'
import { invalidRelation, ReferenceNotFoundError, validationError } from '@/lib/application/contracts'

const updateSchema = handoffInputSchema.partial().extend({ status: z.enum(['open', 'closed']).optional() }).strict()
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { actor, response } = await apiGuard(request, 'handoff:write')
  if (!actor) return response
  const { id } = await context.params; if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid handoff ID' } }, { status: 400 })
  const parsed = updateSchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 })
  try { const data = await workspaceService.updateHandoff(actor, id, parsed.data); return data ? NextResponse.json({ data }) : NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Handoff not found' } }, { status: 404 }) } catch (error) {
    if (error instanceof Error && error.message === 'HANDOFF_HELD') {
      return NextResponse.json({ error: { code: 'HANDOFF_HELD', message: 'Another live agent is holding this handoff.' } }, { status: 409 })
    }
    if (error instanceof ReferenceNotFoundError) return NextResponse.json(invalidRelation(error), { status: 400 })
    throw error
  }
}
