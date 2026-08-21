import { NextResponse } from 'next/server'
import { listAudit } from '@/lib/application/audit-service'
import { pageQuerySchema, validationError } from '@/lib/application/contracts'
import { apiGuard } from '@/lib/dal/api-guard'

// Owner session only. An agent should not be able to read, or quietly check, the record of its own actions.
export async function GET(request: Request) {
  const { actor, response } = await apiGuard(request, undefined, { sessionOnly: true })
  if (!actor) return response
  const parsed = pageQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams))
  if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 })
  return NextResponse.json(await listAudit(actor, parsed.data))
}
