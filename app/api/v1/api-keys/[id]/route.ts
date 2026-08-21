import { and, eq, isNull } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { recordAudit } from '@/lib/application/audit-service'
import { apiGuard } from '@/lib/dal/api-guard'
import { db } from '@/lib/infrastructure/db/postgres/client'
import { apiKeys } from '@/lib/infrastructure/db/postgres/schema'

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { actor, response } = await apiGuard(request, undefined, { sessionOnly: true })
  if (!actor) return response
  const id = (await params).id
  const revoked = await db.transaction(async (tx) => {
    const [key] = await tx.update(apiKeys).set({ revokedAt: new Date() })
      .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, actor.userId), isNull(apiKeys.revokedAt)))
      .returning({ id: apiKeys.id, name: apiKeys.name, prefix: apiKeys.prefix })
    if (!key) return null
    await recordAudit(actor, {
      action: 'api_key.revoke', targetType: 'api_key', targetId: key.id,
      summary: key.name, metadata: { prefix: key.prefix },
    }, tx)
    return key
  })
  return revoked ? new NextResponse(null, { status: 204 }) : NextResponse.json({ error: 'Not found' }, { status: 404 })
}
