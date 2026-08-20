import 'server-only'

import { createHash } from 'node:crypto'
import { and, eq, isNull } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/infrastructure/db/postgres/client'
import { apiKeys } from '@/lib/infrastructure/db/postgres/schema'
import type { Actor } from '@/lib/domain/memory'

export async function actorFromRequest(request: Request): Promise<Actor | null> {
  const authorization = request.headers.get('authorization')
  if (authorization?.startsWith('Bearer ')) {
    const token = authorization.slice(7).trim()
    const keyHash = createHash('sha256').update(token).digest('hex')
    const [key] = await db.select({ id: apiKeys.id, userId: apiKeys.userId }).from(apiKeys).where(and(eq(apiKeys.keyHash, keyHash), isNull(apiKeys.revokedAt))).limit(1)
    if (!key) return null
    await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, key.id))
    return { userId: key.userId, credentialId: key.id }
  }

  const session = await auth.api.getSession({ headers: request.headers })
  return session?.user ? { userId: session.user.id } : null
}
