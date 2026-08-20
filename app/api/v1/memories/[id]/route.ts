import { NextResponse } from 'next/server'
import { idSchema, validationError } from '@/lib/application/contracts'
import { memoryService } from '@/lib/application/container'
import { memoryPatchSchema } from '@/lib/application/memory-schema'
import { actorFromRequest, can } from '@/lib/dal/request-actor'

const unauthorized = () => NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 })
const forbidden = (scope: string) => NextResponse.json({ error: { code: 'FORBIDDEN', message: `${scope} scope required` } }, { status: 403 })
const notFound = () => NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Memory not found' } }, { status: 404 })

async function parseId(params: Promise<{ id: string }>) {
  return idSchema.safeParse((await params).id)
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await actorFromRequest(request)
  if (!actor) return unauthorized()
  if (!can(actor, 'memory:read')) return forbidden('memory:read')
  const id = await parseId(params)
  if (!id.success) return NextResponse.json(validationError(id.error), { status: 400 })
  const data = await memoryService.get(actor, id.data)
  return data ? NextResponse.json({ data }) : notFound()
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await actorFromRequest(request)
  if (!actor) return unauthorized()
  if (!can(actor, 'memory:write')) return forbidden('memory:write')
  const id = await parseId(params)
  if (!id.success) return NextResponse.json(validationError(id.error), { status: 400 })
  const parsed = memoryPatchSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 })
  const data = await memoryService.update(actor, id.data, parsed.data)
  return data ? NextResponse.json({ data }) : notFound()
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await actorFromRequest(request)
  if (!actor) return unauthorized()
  if (!can(actor, 'memory:write')) return forbidden('memory:write')
  const id = await parseId(params)
  if (!id.success) return NextResponse.json(validationError(id.error), { status: 400 })
  const removed = await memoryService.delete(actor, id.data)
  return removed ? new NextResponse(null, { status: 204 }) : notFound()
}
