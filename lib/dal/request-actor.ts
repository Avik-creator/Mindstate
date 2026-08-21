import 'server-only'

import { createHash } from 'node:crypto'
import { and, eq, isNull, sql } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/infrastructure/db/postgres/client'
import { agents, apiKeys } from '@/lib/infrastructure/db/postgres/schema'
import type { Actor } from '@/lib/domain/memory'

export { can } from '@/lib/domain/scopes'

// `bearerOnly` refuses session cookies, for endpoints that must not be reachable from a browser context.
export async function actorFromRequest(request: Request, options?: { bearerOnly?: boolean }): Promise<Actor | null> {
  const authorization = request.headers.get('authorization')
  if (authorization?.startsWith('Bearer ')) {
    const token = authorization.slice(7).trim()
    const keyHash = createHash('sha256').update(token).digest('hex')
    const [key] = await db.select({ id: apiKeys.id, userId: apiKeys.userId, agentId: apiKeys.agentId, scopes: apiKeys.scopes }).from(apiKeys).where(and(eq(apiKeys.keyHash, keyHash), isNull(apiKeys.revokedAt))).limit(1)
    if (!key) return null
    if (key.agentId) {
      const [agent] = await db.select({ id: agents.id }).from(agents).where(and(eq(agents.id, key.agentId), eq(agents.userId, key.userId), isNull(agents.revokedAt))).limit(1)
      if (!agent) return null
      // What the server sees, recorded alongside what the agent claims. The lastSeenAt write
      // already happened here, so observing costs no extra round trip.
      const userAgent = request.headers.get('user-agent')?.slice(0, 200) ?? null
      const surface = new URL(request.url).pathname.startsWith('/api/mcp') ? 'mcp' : 'rest'
      await db.update(agents).set({
        lastSeenAt: new Date(),
        observedRequests: sql`${agents.observedRequests} + 1`,
        ...(userAgent ? { observedUserAgent: userAgent } : {}),
        observedSurfaces: sql`(select coalesce(jsonb_agg(distinct value), '[]'::jsonb) from jsonb_array_elements_text(${agents.observedSurfaces} || ${JSON.stringify([surface])}::jsonb) as value)`,
      }).where(eq(agents.id, agent.id))
    }
    await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, key.id))
    return { userId: key.userId, credentialId: key.id, agentId: key.agentId ?? undefined, scopes: key.scopes as Actor['scopes'] }
  }

  if (options?.bearerOnly) return null

  const session = await auth.api.getSession({ headers: request.headers })
  return session?.user ? { userId: session.user.id } : null
}
