import { NextResponse } from 'next/server'
import { actorFromRequest } from '@/lib/dal/request-actor'
import { memoryService } from '@/lib/application/container'
import { memoryPatchSchema } from '@/lib/application/memory-schema'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await actorFromRequest(request)
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const data = await memoryService.get(actor, (await params).id)
  return data ? NextResponse.json({ data }) : NextResponse.json({ error: 'Not found' }, { status: 404 })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await actorFromRequest(request)
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const parsed = memoryPatchSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid memory', details: parsed.error.flatten() }, { status: 400 })
  const data = await memoryService.update(actor, (await params).id, parsed.data)
  return data ? NextResponse.json({ data }) : NextResponse.json({ error: 'Not found' }, { status: 404 })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await actorFromRequest(request)
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const removed = await memoryService.delete(actor, (await params).id)
  return removed ? new NextResponse(null, { status: 204 }) : NextResponse.json({ error: 'Not found' }, { status: 404 })
}
