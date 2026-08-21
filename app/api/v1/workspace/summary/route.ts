import { NextResponse } from 'next/server'
import { apiGuard } from '@/lib/dal/api-guard'
import { workspaceService } from '@/lib/application/workspace-service'

export async function GET(request: Request) {
  const { actor, response } = await apiGuard(request, 'memory:read')
  if (!actor) return response
  return NextResponse.json({ data: await workspaceService.summary(actor) })
}
