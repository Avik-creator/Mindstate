import { NextResponse } from 'next/server'
import { apiGuard } from '@/lib/dal/api-guard'
import { handoffInputSchema, workspaceService } from '@/lib/application/workspace-service'
import { pageQuerySchema, validationError } from '@/lib/application/contracts'

export async function GET(request: Request) {
  const { actor, response } = await apiGuard(request, 'handoff:read')
  if (!actor) return response
  const parsed = pageQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams))
  if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 })
  return NextResponse.json(await workspaceService.listHandoffs(actor, parsed.data))
}
export async function POST(request: Request) {
  const { actor, response } = await apiGuard(request, 'handoff:write')
  if (!actor) return response
  const parsed = handoffInputSchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 })
  try { return NextResponse.json({ data: await workspaceService.createHandoff(actor, parsed.data) }, { status: 201 }) } catch (error) { return NextResponse.json({ error: { code: 'INVALID_RELATION', message: error instanceof Error ? error.message : 'Invalid relationship' } }, { status: 400 }) }
}
