import { and, eq, isNull } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { apiGuard } from '@/lib/dal/api-guard'
import { db } from '@/lib/infrastructure/db/postgres/client'
import { agents, apiKeys } from '@/lib/infrastructure/db/postgres/schema'

// Revoking an agent also revokes its keys, so a compromised agent cannot be reached through a key issued earlier.
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { actor, response } = await apiGuard(request, undefined, { sessionOnly: true })
  if (!actor) return response
  const { id } = await context.params
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid agent ID' } }, { status: 400 })

  const revoked = await db.transaction(async (tx) => {
    const [agent] = await tx.update(agents).set({ revokedAt: new Date(), status: 'revoked' })
      .where(and(eq(agents.id, id), eq(agents.userId, actor.userId), isNull(agents.revokedAt)))
      .returning({ id: agents.id })
    if (!agent) return null
    const keys = await tx.update(apiKeys).set({ revokedAt: new Date() })
      .where(and(eq(apiKeys.agentId, id), eq(apiKeys.userId, actor.userId), isNull(apiKeys.revokedAt)))
      .returning({ id: apiKeys.id })
    return { id: agent.id, revokedKeys: keys.length }
  })

  return revoked ? NextResponse.json({ data: revoked }) : NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Agent not found or already revoked' } }, { status: 404 })
}
