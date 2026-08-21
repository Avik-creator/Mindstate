import { NextResponse } from 'next/server'
import { sessionService } from '@/lib/application/container'
import { sessionCreateSchema } from '@/lib/application/session-schema'
import { invalidRelation, pageQuerySchema, ReferenceNotFoundError, validationError } from '@/lib/application/contracts'
import { apiGuard } from '@/lib/dal/api-guard'

export async function GET(request: Request) {
  const { actor, response } = await apiGuard(request, 'session:read')
  if (!actor) return response
  const parsed = pageQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams))
  if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 })
  return NextResponse.json(await sessionService.listPage(actor, parsed.data))
}

export async function POST(request: Request) {
  const { actor, response } = await apiGuard(request, 'session:write')
  if (!actor) return response
  const parsed = sessionCreateSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 })
  try {
    return NextResponse.json({ data: await sessionService.start(actor, parsed.data) }, { status: 201 })
  } catch (error) {
    if (error instanceof ReferenceNotFoundError) return NextResponse.json(invalidRelation(error), { status: 400 })
    throw error
  }
}
