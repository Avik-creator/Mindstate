import { NextResponse } from 'next/server'
import { z } from 'zod'
import { actorFromRequest } from '@/lib/dal/request-actor'
import { memoryService } from '@/lib/application/container'
import { memoryInputSchema, memoryTypeSchema } from '@/lib/application/memory-schema'

const searchSchema = z.object({
  q: z.string().optional(), projectId: z.string().optional(), sessionId: z.string().optional(),
  type: memoryTypeSchema.optional(), limit: z.coerce.number().int().min(1).max(100).default(20),
})

export async function GET(request: Request) {
  const actor = await actorFromRequest(request)
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const url = new URL(request.url)
  const parsed = searchSchema.safeParse(Object.fromEntries(url.searchParams))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid query', details: parsed.error.flatten() }, { status: 400 })
  const { q, type, ...filters } = parsed.data
  const data = await memoryService.find(actor, { query: q, types: type ? [type] : undefined, ...filters })
  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  const actor = await actorFromRequest(request)
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const parsed = memoryInputSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid memory', details: parsed.error.flatten() }, { status: 400 })
  const data = await memoryService.capture(actor, { ...parsed.data, source: actor.credentialId ? 'api' : parsed.data.source })
  return NextResponse.json({ data }, { status: 201 })
}
