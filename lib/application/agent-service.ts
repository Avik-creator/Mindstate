import 'server-only'

import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { and, eq, gt, isNull } from 'drizzle-orm'
import { db } from '@/lib/infrastructure/db/postgres/client'
import { agents, agentSignupTokens, apiKeys } from '@/lib/infrastructure/db/postgres/schema'
import type { AgentScope } from '@/lib/application/contracts'

const hash = (value: string) => createHash('sha256').update(value).digest('hex')

export async function issueAgentSignupToken(userId: string, input: { agentName: string; scopes: AgentScope[]; expiresInMinutes: number }) {
  const token = `tbs_${randomBytes(32).toString('base64url')}`
  const expiresAt = new Date(Date.now() + input.expiresInMinutes * 60_000)
  await db.insert(agentSignupTokens).values({ id: randomUUID(), userId, agentName: input.agentName, tokenHash: hash(token), scopes: input.scopes, expiresAt })
  return { token, expiresAt }
}

export async function redeemAgentSignupToken(token: string, requestedName?: string) {
  return db.transaction(async (tx) => {
    const [enrollment] = await tx.select().from(agentSignupTokens).where(and(eq(agentSignupTokens.tokenHash, hash(token)), isNull(agentSignupTokens.usedAt), gt(agentSignupTokens.expiresAt, new Date()))).for('update').limit(1)
    if (!enrollment) return null

    const agentId = randomUUID()
    const apiKey = `tb_live_${randomBytes(32).toString('base64url')}`
    const name = requestedName ?? enrollment.agentName
    await tx.insert(agents).values({ id: agentId, userId: enrollment.userId, name })
    await tx.insert(apiKeys).values({ id: randomUUID(), userId: enrollment.userId, agentId, name: `${name} key`, prefix: apiKey.slice(0, 16), keyHash: hash(apiKey), scopes: enrollment.scopes })
    await tx.update(agentSignupTokens).set({ usedAt: new Date() }).where(and(eq(agentSignupTokens.id, enrollment.id), isNull(agentSignupTokens.usedAt)))

    return { agent: { id: agentId, name }, apiKey, scopes: enrollment.scopes }
  })
}
