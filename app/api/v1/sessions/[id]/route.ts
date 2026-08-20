import { NextResponse } from 'next/server'
import { sessionService } from '@/lib/application/container'
import { idSchema, validationError } from '@/lib/application/contracts'
import { actorFromRequest, can } from '@/lib/dal/request-actor'

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = await actorFromRequest(request)
  if (!actor) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 })
  if (!can(actor, 'session:read')) return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'session:read scope required' } }, { status: 403 })
  const parsed = idSchema.safeParse((await context.params).id)
  if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 })
  const data = await sessionService.get(actor, parsed.data)
  return data ? NextResponse.json({ data }) : NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Session not found' } }, { status: 404 })
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = await actorFromRequest(request)
  if (!actor) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 })
  if (!can(actor, 'session:write')) return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'session:write scope required' } }, { status: 403 })
  const parsed = idSchema.safeParse((await context.params).id)
  if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 })
  const data = await sessionService.complete(actor, parsed.data)
  return data ? NextResponse.json({ data }) : NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Active session not found' } }, { status: 404 })
}
