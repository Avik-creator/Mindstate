import 'server-only'

import { randomUUID } from 'node:crypto'
import { and, count, desc, eq, inArray, isNull, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/infrastructure/db/postgres/client'
import { agents, agentSessions, handoffs, memories, projects } from '@/lib/infrastructure/db/postgres/schema'
import { assertOwnedRefs } from '@/lib/infrastructure/db/postgres/owned-refs'
import { recordAudit } from '@/lib/application/audit-service'
import { verifyAgentIdentity } from '@/lib/domain/agent-identity'
import { claimState } from '@/lib/domain/handoff-claim'
import { CLAIM_LEASE_AFTER_MS, SESSION_STALE_AFTER_MS } from '@/lib/domain/agent-session'
import type { Actor } from '@/lib/domain/memory'
import { normalizePage, type PageRequest } from '@/lib/domain/pagination'

export const projectInputSchema = z.object({ name: z.string().trim().min(1).max(80), description: z.string().trim().max(500).default('') }).strict()
export const handoffInputSchema = z.object({
  title: z.string().trim().min(1).max(120), summary: z.string().trim().min(1).max(5000),
  projectId: z.string().uuid().nullable().optional(), sessionId: z.string().uuid().nullable().optional(),
  nextSteps: z.array(z.string().trim().min(1).max(300)).max(20).default([]),
}).strict()
export const agentTelemetrySchema = z.object({
  runtimeName: z.string().trim().min(1).max(100).optional(), runtimeVersion: z.string().trim().max(50).optional(),
  capabilities: z.array(z.string().trim().min(1).max(80)).max(30).default([]), signals: z.array(z.string().trim().min(1).max(120)).max(30).default([]),
}).strict()

export function classifyAgent(values: string[]) {
  const haystack = values.join(' ').toLowerCase()
  const rules = [
    ['coding', ['claude code', 'cursor', 'copilot', 'vscode', 'typescript', 'python', 'code', 'git', 'terminal']],
    ['research', ['research', 'search', 'browser', 'citation', 'paper', 'arxiv']],
    ['browser', ['playwright', 'browser', 'chrome', 'web navigation']],
    ['automation', ['workflow', 'cron', 'automation', 'scheduler', 'zapier']],
  ] as const
  const scores = rules.map(([category, keywords]) => ({ category, score: keywords.reduce((n, keyword) => n + (haystack.includes(keyword) ? 1 : 0), 0) })).sort((a, b) => b.score - a.score)
  const best = scores[0]
  return best.score ? { category: best.category, confidence: best.score >= 3 ? 'high' : best.score === 2 ? 'medium' : 'low' } : { category: 'general', confidence: 'low' }
}



// True while the session holding a claim is still active and heartbeating.
const holderIsLive = sql<boolean>`exists (
  select 1 from agent_sessions s
  where s."id" = "handoffs"."claimedBySessionId"
    and s."status" = 'active'
    and s."lastHeartbeatAt" >= now() - make_interval(secs => ${CLAIM_LEASE_AFTER_MS / 1000})
)`

export const workspaceService = {
  async summary(actor: Actor) {
    const cutoff = sql`now() - make_interval(secs => ${SESSION_STALE_AFTER_MS / 1000})`
    const [[memory], [project], [agent], [openHandoff], [liveSession], [staleSession], [completedSession]] = await Promise.all([
      db.select({ value: count() }).from(memories).where(eq(memories.userId, actor.userId)),
      db.select({ value: count() }).from(projects).where(eq(projects.userId, actor.userId)),
      db.select({ value: count() }).from(agents).where(and(eq(agents.userId, actor.userId), isNull(agents.revokedAt))),
      db.select({ value: count() }).from(handoffs).where(and(eq(handoffs.userId, actor.userId), eq(handoffs.status, 'open'))),
      db.select({ value: count() }).from(agentSessions).where(and(eq(agentSessions.userId, actor.userId), eq(agentSessions.status, 'active'), sql`${agentSessions.lastHeartbeatAt} >= ${cutoff}`)),
      db.select({ value: count() }).from(agentSessions).where(and(eq(agentSessions.userId, actor.userId), eq(agentSessions.status, 'active'), sql`${agentSessions.lastHeartbeatAt} < ${cutoff}`)),
      db.select({ value: count() }).from(agentSessions).where(and(eq(agentSessions.userId, actor.userId), eq(agentSessions.status, 'completed'))),
    ])
    return { memories: memory.value, projects: project.value, agents: agent.value, openHandoffs: openHandoff.value, sessions: { live: liveSession.value, stale: staleSession.value, completed: completedSession.value } }
  },
  async listProjects(actor: Actor, page: PageRequest = {}) {
    const bounds = normalizePage(page)
    const [data, [total]] = await Promise.all([
      this.projectRows(actor, bounds),
      db.select({ value: count() }).from(projects).where(eq(projects.userId, actor.userId)),
    ])
    return { data, page: { ...bounds, total: Number(total?.value ?? 0) } }
  },
  projectRows(actor: Actor, bounds: { limit: number; offset: number }) {
    return db.select({ id: projects.id, name: projects.name, description: projects.description, createdAt: projects.createdAt, updatedAt: projects.updatedAt,
      memoryCount: sql<number>`(select count(*)::int from memories m where m."userId" = ${actor.userId} and m."projectId" = "projects"."id")`,
      sessionCount: sql<number>`(select count(*)::int from agent_sessions s where s."userId" = ${actor.userId} and s."projectId" = "projects"."id")`,
      handoffCount: sql<number>`(select count(*)::int from handoffs h where h."userId" = ${actor.userId} and h."projectId" = "projects"."id")`,
    }).from(projects).where(eq(projects.userId, actor.userId)).orderBy(desc(projects.updatedAt)).limit(bounds.limit).offset(bounds.offset)
  },
  async createProject(actor: Actor, input: z.infer<typeof projectInputSchema>) { const [row] = await db.insert(projects).values({ id: randomUUID(), userId: actor.userId, ...input }).returning(); return row },
  async updateProject(actor: Actor, id: string, input: z.infer<typeof projectInputSchema>) { const [row] = await db.update(projects).set({ ...input, updatedAt: new Date() }).where(and(eq(projects.id, id), eq(projects.userId, actor.userId))).returning(); return row ?? null },
  async deleteProject(actor: Actor, id: string) {
    const [[memory], [session], [handoff]] = await Promise.all([
      db.select({ value: count() }).from(memories).where(and(eq(memories.userId, actor.userId), eq(memories.projectId, id))),
      db.select({ value: count() }).from(agentSessions).where(and(eq(agentSessions.userId, actor.userId), eq(agentSessions.projectId, id))),
      db.select({ value: count() }).from(handoffs).where(and(eq(handoffs.userId, actor.userId), eq(handoffs.projectId, id))),
    ])
    if (memory.value + session.value + handoff.value > 0) return { conflict: true }
    return db.transaction(async (tx) => {
      const [row] = await tx.delete(projects)
        .where(and(eq(projects.id, id), eq(projects.userId, actor.userId)))
        .returning({ id: projects.id, name: projects.name })
      if (!row) return null
      await recordAudit(actor, { action: 'project.delete', targetType: 'project', targetId: row.id, summary: row.name }, tx)
      return { id: row.id }
    })
  },
  async listHandoffs(actor: Actor, page: PageRequest & { status?: string; projectId?: string } = {}) {
    const bounds = normalizePage(page)
    const where = and(
      eq(handoffs.userId, actor.userId),
      ...(page.status ? [eq(handoffs.status, page.status)] : []),
      ...(page.projectId ? [eq(handoffs.projectId, page.projectId)] : []),
    )
    const [rows, [total]] = await Promise.all([
      db.select({
        id: handoffs.id, userId: handoffs.userId, projectId: handoffs.projectId, sessionId: handoffs.sessionId,
        title: handoffs.title, summary: handoffs.summary, nextSteps: handoffs.nextSteps, status: handoffs.status,
        claimedBySessionId: handoffs.claimedBySessionId, claimedByAgentId: handoffs.claimedByAgentId, claimedAt: handoffs.claimedAt,
        createdAt: handoffs.createdAt, updatedAt: handoffs.updatedAt, holderIsLive,
      }).from(handoffs).where(where).orderBy(desc(handoffs.updatedAt)).limit(bounds.limit).offset(bounds.offset),
      db.select({ value: count() }).from(handoffs).where(where),
    ])

    const data = rows.map(({ holderIsLive: live, ...row }) => ({
      ...row,
      claim: {
        state: claimState({ claimedBySessionId: row.claimedBySessionId, holderIsLive: Boolean(live) }),
        agentId: row.claimedByAgentId, sessionId: row.claimedBySessionId, claimedAt: row.claimedAt,
      },
    }))
    return { data, page: { ...bounds, total: Number(total?.value ?? 0) } }
  },

  // One guarded UPDATE, so two agents racing for the same handoff cannot both win.
  async claimHandoff(actor: Actor, id: string, sessionId: string) {
    const [session] = await db.select({ id: agentSessions.id }).from(agentSessions).where(and(
      eq(agentSessions.id, sessionId), eq(agentSessions.userId, actor.userId), eq(agentSessions.status, 'active'),
      sql`${agentSessions.lastHeartbeatAt} >= now() - make_interval(secs => ${SESSION_STALE_AFTER_MS / 1000})`,
    )).limit(1)
    if (!session) return { error: 'SESSION_NOT_LIVE' as const }

    const [row] = await db.update(handoffs)
      .set({ claimedBySessionId: sessionId, claimedByAgentId: actor.agentId ?? null, claimedAt: new Date(), updatedAt: new Date() })
      .where(and(
        eq(handoffs.id, id), eq(handoffs.userId, actor.userId), eq(handoffs.status, 'open'),
        sql`(${handoffs.claimedBySessionId} is null or ${handoffs.claimedBySessionId} = ${sessionId} or not ${holderIsLive})`,
      ))
      .returning({ id: handoffs.id, title: handoffs.title, claimedAt: handoffs.claimedAt })
    if (!row) return { error: 'UNAVAILABLE' as const }
    return { handoff: row }
  },

  async releaseHandoff(actor: Actor, id: string, sessionId: string) {
    const [row] = await db.update(handoffs)
      .set({ claimedBySessionId: null, claimedByAgentId: null, claimedAt: null, updatedAt: new Date() })
      .where(and(eq(handoffs.id, id), eq(handoffs.userId, actor.userId), eq(handoffs.claimedBySessionId, sessionId)))
      .returning({ id: handoffs.id })
    return row ?? null
  },
  async createHandoff(actor: Actor, input: z.infer<typeof handoffInputSchema>) {
    await assertOwnedRefs(actor.userId, input)
    const [row] = await db.insert(handoffs).values({ id: randomUUID(), userId: actor.userId, ...input }).returning(); return row
  },
  async updateHandoff(actor: Actor, id: string, input: Partial<z.infer<typeof handoffInputSchema>> & { status?: 'open' | 'closed' }) {
    await assertOwnedRefs(actor.userId, input)

    // An agent may not change work another live agent is holding. The owner always may.
    const claimGuard = actor.credentialId
      ? [sql`(${handoffs.claimedBySessionId} is null or not ${holderIsLive} or ${handoffs.claimedByAgentId} = ${actor.agentId ?? ''})`]
      : []

    const [row] = await db.update(handoffs).set({ ...input, updatedAt: new Date() })
      .where(and(eq(handoffs.id, id), eq(handoffs.userId, actor.userId), ...claimGuard)).returning()
    if (row) return row

    // Distinguish "held by someone else" from "does not exist", so the caller is not told the wrong thing.
    const [exists] = await db.select({ id: handoffs.id }).from(handoffs).where(and(eq(handoffs.id, id), eq(handoffs.userId, actor.userId))).limit(1)
    if (exists) throw new Error('HANDOFF_HELD')
    return null
  },
  async listAgents(actor: Actor, page: PageRequest = {}) {
    const bounds = normalizePage(page)
    const [data, [total]] = await Promise.all([
      this.agentRows(actor, bounds).then((rows) =>
        rows.map((row) => ({ ...row, verification: verifyAgentIdentity({ declaredRuntime: row.runtimeName, observedUserAgent: row.observedUserAgent, observedRequests: row.observedRequests }) })),
      ),
      db.select({ value: count() }).from(agents).where(eq(agents.userId, actor.userId)),
    ])
    return { data, page: { ...bounds, total: Number(total?.value ?? 0) } }
  },
  agentRows(actor: Actor, bounds: { limit: number; offset: number }) { return db.select({ id: agents.id, name: agents.name, status: agents.status, category: agents.category, runtimeName: agents.runtimeName, runtimeVersion: agents.runtimeVersion, capabilities: agents.capabilities, detectionSignals: agents.detectionSignals, confidence: agents.confidence, observedUserAgent: agents.observedUserAgent, observedSurfaces: agents.observedSurfaces, observedRequests: agents.observedRequests, lastSeenAt: agents.lastSeenAt, revokedAt: agents.revokedAt, createdAt: agents.createdAt }).from(agents).where(eq(agents.userId, actor.userId)).orderBy(desc(agents.lastSeenAt), desc(agents.createdAt)).limit(bounds.limit).offset(bounds.offset) },
  async recordAgentTelemetry(actor: Actor, input: z.infer<typeof agentTelemetrySchema>) {
    if (!actor.agentId) throw new Error('AGENT_REQUIRED')
    const evidence = [...new Set([input.runtimeName, ...input.capabilities, ...input.signals].filter(Boolean) as string[])]
    const detected = classifyAgent(evidence)
    const [row] = await db.update(agents).set({ runtimeName: input.runtimeName, runtimeVersion: input.runtimeVersion, capabilities: input.capabilities, detectionSignals: evidence, ...detected, lastSeenAt: new Date() }).where(and(eq(agents.id, actor.agentId), eq(agents.userId, actor.userId))).returning(); return row ?? null
  },
}
