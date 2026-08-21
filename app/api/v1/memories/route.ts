import { NextResponse } from 'next/server'
import { z } from 'zod'
import { apiGuard } from '@/lib/dal/api-guard'
import { memoryService } from '@/lib/application/container'
import { invalidRelation, ReferenceNotFoundError, validationError } from '@/lib/application/contracts'
import { memoryInputSchema, memoryTypeSchema } from '@/lib/application/memory-schema'

const searchSchema = z.object({
  q: z.string().optional(), projectId: z.string().optional(), sessionId: z.string().optional(),
  type: memoryTypeSchema.optional(), limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
})

export async function GET(request: Request) {
  const { actor, response } = await apiGuard(request, 'memory:read')
  if (!actor) return response
  const url = new URL(request.url)
  const parsed = searchSchema.safeParse(Object.fromEntries(url.searchParams))
  if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 })
  const { q, type, ...filters } = parsed.data
  const { data, page } = await memoryService.findPage(actor, { query: q, types: type ? [type] : undefined, ...filters })
  return NextResponse.json({ data, page })
}

export async function POST(request: Request) {
  const { actor, response } = await apiGuard(request, 'memory:write')
  if (!actor) return response
  const parsed = memoryInputSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 })
  try {
    const data = await memoryService.capture(actor, { ...parsed.data, source: actor.credentialId ? 'api' : parsed.data.source })
    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    if (error instanceof ReferenceNotFoundError) return NextResponse.json(invalidRelation(error), { status: 400 })
    throw error
  }
}
