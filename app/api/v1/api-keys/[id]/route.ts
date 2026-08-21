import { and, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { apiGuard } from '@/lib/dal/api-guard'
import { db } from '@/lib/infrastructure/db/postgres/client'
import { apiKeys } from '@/lib/infrastructure/db/postgres/schema'

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { actor, response } = await apiGuard(request, undefined, { sessionOnly: true })
  if (!actor) return response
  const revoked = await db.update(apiKeys).set({ revokedAt: new Date() }).where(and(eq(apiKeys.id, (await params).id), eq(apiKeys.userId, actor.userId))).returning({ id: apiKeys.id })
  return revoked.length ? new NextResponse(null, { status: 204 }) : NextResponse.json({ error: 'Not found' }, { status: 404 })
}
