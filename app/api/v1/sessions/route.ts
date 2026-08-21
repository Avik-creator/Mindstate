import { NextResponse } from 'next/server'
import { sessionService } from '@/lib/application/container'
import { sessionCreateSchema, sessionListSchema } from '@/lib/application/session-schema'
import { validationError } from '@/lib/application/contracts'
import { apiGuard } from '@/lib/dal/api-guard'

export async function GET(request: Request) {
  const { actor, response } = await apiGuard(request, 'session:read')
  if (!actor) return response
  const url = new URL(request.url)
  const parsed = sessionListSchema.safeParse({ limit: url.searchParams.get('limit') ?? undefined })
  if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 })
  return NextResponse.json({ data: await sessionService.list(actor, parsed.data.limit) })
}

export async function POST(request: Request) {
  const { actor, response } = await apiGuard(request, 'session:write')
  if (!actor) return response
  const parsed = sessionCreateSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 })
  return NextResponse.json({ data: await sessionService.start(actor, parsed.data) }, { status: 201 })
}
