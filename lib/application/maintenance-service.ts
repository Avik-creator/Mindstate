import 'server-only'

import { and, eq, isNotNull, isNull, lt, or, sql } from 'drizzle-orm'
import { db } from '@/lib/infrastructure/db/postgres/client'
import { agentSignupTokens, apiRateLimits, workspaceClaims } from '@/lib/infrastructure/db/postgres/schema'

const RETENTION_MS = 7 * 24 * 60 * 60 * 1000

// Infrastructure rows only. Memories, sessions, projects, and handoffs are the user's and are never pruned here.
export async function pruneExpiredRecords(now = new Date()) {
  const cutoff = new Date(now.getTime() - RETENTION_MS)

  const [claims, tokens, quotas] = await Promise.all([
    // Claimed rows stay: they are what stops a completed claim being reset.
    db.delete(workspaceClaims)
      .where(and(isNull(workspaceClaims.claimedAt), lt(workspaceClaims.expiresAt, cutoff)))
      .returning({ id: workspaceClaims.id }),
    db.delete(agentSignupTokens)
      .where(or(and(isNotNull(agentSignupTokens.usedAt), lt(agentSignupTokens.usedAt, cutoff)), lt(agentSignupTokens.expiresAt, cutoff)))
      .returning({ id: agentSignupTokens.id }),
    db.delete(apiRateLimits)
      .where(lt(apiRateLimits.expiresAt, now))
      .returning({ key: apiRateLimits.key }),
  ])

  return { expiredClaims: claims.length, spentTokens: tokens.length, expiredQuotas: quotas.length }
}
