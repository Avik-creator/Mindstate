import { NextResponse } from 'next/server'
import { sessionService } from '@/lib/application/container'
import { sessionCreateSchema, sessionListSchema } from '@/lib/application/session-schema'
import { validationError } from '@/lib/application/contracts'
import { actorFromRequest, can } from '@/lib/dal/request-actor'

export async function GET(request: Request) {
  const actor = await actorFromRequest(request)
  if (!actor) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 })
  if (!can(actor, 'session:read')) return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'session:read scope required' } }, { status: 403 })
  const url = new URL(request.url)
  const parsed = sessionListSchema.safeParse({ limit: url.searchParams.get('limit') ?? undefined })
  if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 })
  return NextResponse.json({ data: await sessionService.list(actor, parsed.data.limit) })
}

export async function POST(request: Request) {
  const actor = await actorFromRequest(request)
  if (!actor) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 })
  if (!can(actor, 'session:write')) return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'session:write scope required' } }, { status: 403 })
  const parsed = sessionCreateSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 })
  return NextResponse.json({ data: await sessionService.start(actor, parsed.data) }, { status: 201 })
}
