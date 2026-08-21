import 'server-only'

import { randomUUID } from 'node:crypto'
import { and, count, desc, eq, inArray, isNull, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/infrastructure/db/postgres/client'
import { agents, agentSessions, handoffs, memories, projects } from '@/lib/infrastructure/db/postgres/schema'
import { SESSION_STALE_AFTER_MS } from '@/lib/domain/agent-session'
import type { Actor } from '@/lib/domain/memory'

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

async function ownedProject(userId: string, id: string) {
  const [row] = await db.select({ id: projects.id }).from(projects).where(and(eq(projects.userId, userId), eq(projects.id, id))).limit(1)
  return row
}
async function ownedSession(userId: string, id: string) {
  const [row] = await db.select({ id: agentSessions.id }).from(agentSessions).where(and(eq(agentSessions.userId, userId), eq(agentSessions.id, id))).limit(1)
  return row
}

export const workspaceService = {
  async summary(actor: Actor) {
    const cutoff = sql`(now() at time zone 'utc') - make_interval(secs => ${SESSION_STALE_AFTER_MS / 1000})`
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
  async listProjects(actor: Actor) {
    return db.select({ id: projects.id, name: projects.name, description: projects.description, createdAt: projects.createdAt, updatedAt: projects.updatedAt,
      memoryCount: sql<number>`(select count(*)::int from memories m where m."userId" = ${actor.userId} and m."projectId" = "projects"."id")`,
      sessionCount: sql<number>`(select count(*)::int from agent_sessions s where s."userId" = ${actor.userId} and s."projectId" = "projects"."id")`,
      handoffCount: sql<number>`(select count(*)::int from handoffs h where h."userId" = ${actor.userId} and h."projectId" = "projects"."id")`,
    }).from(projects).where(eq(projects.userId, actor.userId)).orderBy(desc(projects.updatedAt))
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
    const [row] = await db.delete(projects).where(and(eq(projects.id, id), eq(projects.userId, actor.userId))).returning({ id: projects.id }); return row ?? null
  },
  async listHandoffs(actor: Actor) { return db.select().from(handoffs).where(eq(handoffs.userId, actor.userId)).orderBy(desc(handoffs.updatedAt)).limit(100) },
  async createHandoff(actor: Actor, input: z.infer<typeof handoffInputSchema>) {
    if (input.projectId && !(await ownedProject(actor.userId, input.projectId))) throw new Error('PROJECT_NOT_FOUND')
    if (input.sessionId && !(await ownedSession(actor.userId, input.sessionId))) throw new Error('SESSION_NOT_FOUND')
    const [row] = await db.insert(handoffs).values({ id: randomUUID(), userId: actor.userId, ...input }).returning(); return row
  },
  async updateHandoff(actor: Actor, id: string, input: Partial<z.infer<typeof handoffInputSchema>> & { status?: 'open' | 'closed' }) {
    if (input.projectId && !(await ownedProject(actor.userId, input.projectId))) throw new Error('PROJECT_NOT_FOUND')
    if (input.sessionId && !(await ownedSession(actor.userId, input.sessionId))) throw new Error('SESSION_NOT_FOUND')
    const [row] = await db.update(handoffs).set({ ...input, updatedAt: new Date() }).where(and(eq(handoffs.id, id), eq(handoffs.userId, actor.userId))).returning(); return row ?? null
  },
  async listAgents(actor: Actor) { return db.select({ id: agents.id, name: agents.name, status: agents.status, category: agents.category, runtimeName: agents.runtimeName, runtimeVersion: agents.runtimeVersion, capabilities: agents.capabilities, detectionSignals: agents.detectionSignals, confidence: agents.confidence, lastSeenAt: agents.lastSeenAt, createdAt: agents.createdAt }).from(agents).where(eq(agents.userId, actor.userId)).orderBy(desc(agents.lastSeenAt), desc(agents.createdAt)) },
  async recordAgentTelemetry(actor: Actor, input: z.infer<typeof agentTelemetrySchema>) {
    if (!actor.agentId) throw new Error('AGENT_REQUIRED')
    const evidence = [...new Set([input.runtimeName, ...input.capabilities, ...input.signals].filter(Boolean) as string[])]
    const detected = classifyAgent(evidence)
    const [row] = await db.update(agents).set({ runtimeName: input.runtimeName, runtimeVersion: input.runtimeVersion, capabilities: input.capabilities, detectionSignals: evidence, ...detected, lastSeenAt: new Date() }).where(and(eq(agents.id, actor.agentId), eq(agents.userId, actor.userId))).returning(); return row ?? null
  },
}
