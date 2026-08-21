import { NextResponse } from 'next/server'
import { z } from 'zod'
import { actorFromRequest, can } from '@/lib/dal/request-actor'
import { memoryService } from '@/lib/application/container'
import { validationError } from '@/lib/application/contracts'
import { memoryInputSchema, memoryTypeSchema } from '@/lib/application/memory-schema'

const searchSchema = z.object({
  q: z.string().optional(), projectId: z.string().optional(), sessionId: z.string().optional(),
  type: memoryTypeSchema.optional(), limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
})

export async function GET(request: Request) {
  const actor = await actorFromRequest(request)
  if (!actor) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 })
  if (!can(actor, 'memory:read')) return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'memory:read scope required' } }, { status: 403 })
  const url = new URL(request.url)
  const parsed = searchSchema.safeParse(Object.fromEntries(url.searchParams))
  if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 })
  const { q, type, ...filters } = parsed.data
  const { data, page } = await memoryService.findPage(actor, { query: q, types: type ? [type] : undefined, ...filters })
  return NextResponse.json({ data, page })
}

export async function POST(request: Request) {
  const actor = await actorFromRequest(request)
  if (!actor) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 })
  if (!can(actor, 'memory:write')) return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'memory:write scope required' } }, { status: 403 })
  const parsed = memoryInputSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 })
  const data = await memoryService.capture(actor, { ...parsed.data, source: actor.credentialId ? 'api' : parsed.data.source })
  return NextResponse.json({ data }, { status: 201 })
}
