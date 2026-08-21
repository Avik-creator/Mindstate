import { NextResponse } from 'next/server'
import { z } from 'zod'
import { buildBriefing } from '@/lib/application/briefing-service'
import { validationError } from '@/lib/application/contracts'
import { apiGuard } from '@/lib/dal/api-guard'

const querySchema = z.object({
  projectId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
})

// Open handoffs are included only when the credential may read them, so the briefing cannot
// become a way around handoff:read.
export async function GET(request: Request) {
  const { actor, response } = await apiGuard(request, 'memory:read')
  if (!actor) return response
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams))
  if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 })
  return NextResponse.json({ data: await buildBriefing(actor, parsed.data) })
}
