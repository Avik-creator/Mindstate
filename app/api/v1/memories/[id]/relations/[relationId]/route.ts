import { NextResponse } from 'next/server'
import { unrelate } from '@/lib/application/memory-relation-service'
import { apiGuard } from '@/lib/dal/api-guard'

// Removes the relationship only. Neither memory is touched, because a superseded memory is
// kept permanently as the record of how something changed.
export async function DELETE(request: Request, context: { params: Promise<{ id: string; relationId: string }> }) {
  const { actor, response } = await apiGuard(request, 'memory:write')
  if (!actor) return response
  const { id, relationId } = await context.params
  const removed = await unrelate(actor, id, relationId)
  return removed ? new NextResponse(null, { status: 204 }) : NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Relationship not found' } }, { status: 404 })
}
