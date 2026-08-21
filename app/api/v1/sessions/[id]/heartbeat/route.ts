import { NextResponse } from 'next/server'
import { sessionService } from '@/lib/application/container'
import { idSchema, validationError } from '@/lib/application/contracts'
import { apiGuard } from '@/lib/dal/api-guard'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { actor, response } = await apiGuard(request, 'session:write')
  if (!actor) return response
  const parsed = idSchema.safeParse((await context.params).id)
  if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 })
  const data = await sessionService.heartbeat(actor, parsed.data)
  return data ? NextResponse.json({ data }) : NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Active session not found' } }, { status: 404 })
}
