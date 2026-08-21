import { NextResponse } from 'next/server'
import { apiGuard } from '@/lib/dal/api-guard'
import { projectInputSchema, workspaceService } from '@/lib/application/workspace-service'
import { validationError } from '@/lib/application/contracts'

export async function GET(request: Request) {
  const { actor, response } = await apiGuard(request, 'project:read')
  if (!actor) return response
  return NextResponse.json({ data: await workspaceService.listProjects(actor) })
}
export async function POST(request: Request) {
  const { actor, response } = await apiGuard(request, 'project:write')
  if (!actor) return response
  const parsed = projectInputSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 })
  return NextResponse.json({ data: await workspaceService.createProject(actor, parsed.data) }, { status: 201 })
}
