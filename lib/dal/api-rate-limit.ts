import 'server-only'

import { sql } from 'drizzle-orm'
import { db } from '@/lib/infrastructure/db/postgres/client'
import { apiRateLimits } from '@/lib/infrastructure/db/postgres/schema'

export const API_WINDOW_MS = 60_000
export const API_MAX_REQUESTS = 120

// Fixed window, so a burst straddling a boundary can reach twice the cap. Enough to stop a runaway agent.
export async function consumeApiQuota(credentialId: string, now = Date.now()) {
  const windowStart = Math.floor(now / API_WINDOW_MS) * API_WINDOW_MS
  const expiresAt = new Date(windowStart + API_WINDOW_MS)
  const [row] = await db.insert(apiRateLimits)
    .values({ key: `${credentialId}:${windowStart}`, count: 1, expiresAt })
    .onConflictDoUpdate({ target: apiRateLimits.key, set: { count: sql`${apiRateLimits.count} + 1` } })
    .returning({ count: apiRateLimits.count })

  const count = row?.count ?? 1
  return { allowed: count <= API_MAX_REQUESTS, retryAfter: Math.max(1, Math.ceil((expiresAt.getTime() - now) / 1000)) }
}
