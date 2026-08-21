import { NextResponse } from 'next/server'
import { idSchema, validationError } from '@/lib/application/contracts'
import { memoryService } from '@/lib/application/container'
import { memoryPatchSchema } from '@/lib/application/memory-schema'
import { apiGuard } from '@/lib/dal/api-guard'

const notFound = () => NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Memory not found' } }, { status: 404 })

async function parseId(params: Promise<{ id: string }>) {
  return idSchema.safeParse((await params).id)
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { actor, response } = await apiGuard(request, 'memory:read')
  if (!actor) return response
  const id = await parseId(params)
  if (!id.success) return NextResponse.json(validationError(id.error), { status: 400 })
  const data = await memoryService.get(actor, id.data)
  return data ? NextResponse.json({ data }) : notFound()
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { actor, response } = await apiGuard(request, 'memory:write')
  if (!actor) return response
  const id = await parseId(params)
  if (!id.success) return NextResponse.json(validationError(id.error), { status: 400 })
  const parsed = memoryPatchSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 })
  const data = await memoryService.update(actor, id.data, parsed.data)
  return data ? NextResponse.json({ data }) : notFound()
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { actor, response } = await apiGuard(request, 'memory:write')
  if (!actor) return response
  const id = await parseId(params)
  if (!id.success) return NextResponse.json(validationError(id.error), { status: 400 })
  const removed = await memoryService.delete(actor, id.data)
  return removed ? new NextResponse(null, { status: 204 }) : notFound()
}
