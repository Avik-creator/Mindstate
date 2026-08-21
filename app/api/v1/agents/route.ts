import { NextResponse } from 'next/server'
import { pageQuerySchema, validationError } from '@/lib/application/contracts'
import { apiGuard } from '@/lib/dal/api-guard'
import { workspaceService } from '@/lib/application/workspace-service'

export async function GET(request: Request) {
  const { actor, response } = await apiGuard(request, undefined, { sessionOnly: true })
  if (!actor) return response
  const parsed = pageQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams))
  if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 })
  return NextResponse.json(await workspaceService.listAgents(actor, parsed.data))
}
