import 'server-only'

import { randomUUID } from 'node:crypto'
import { and, count, desc, eq, inArray } from 'drizzle-orm'
import { db } from './client'
import { agentSessions, memories } from './schema'
import type { Actor } from '@/lib/domain/memory'
import { SESSION_STALE_AFTER_MS, type AgentSessionRecord, type AgentSessionRepository, type CreateSessionInput, type SessionPresence } from '@/lib/domain/agent-session'

type Row = typeof agentSessions.$inferSelect
function presence(row: Row): SessionPresence {
  if (row.status === 'completed') return 'completed'
  return Date.now() - row.lastHeartbeatAt.getTime() <= SESSION_STALE_AFTER_MS ? 'live' : 'stale'
}
function record(row: Row, memoryCount = 0): AgentSessionRecord {
  return { ...row, status: row.status as 'active' | 'completed', presence: presence(row), metadata: row.metadata ?? {}, memoryCount }
}

export class PostgresAgentSessionRepository implements AgentSessionRepository {
  async create(actor: Actor, input: CreateSessionInput) {
    const now = new Date()
    const [row] = await db.insert(agentSessions).values({ id: randomUUID(), userId: actor.userId, agentId: actor.agentId ?? null, title: input.title, projectId: input.projectId ?? null, agent: input.agent ?? (actor.agentId ? 'agent' : 'manual'), metadata: input.metadata ?? {}, lastHeartbeatAt: now, updatedAt: now }).returning()
    return record(row)
  }

  async list(actor: Actor, limit: number) {
    const rows = await db.select().from(agentSessions).where(eq(agentSessions.userId, actor.userId)).orderBy(desc(agentSessions.updatedAt)).limit(limit)
    if (!rows.length) return []
    const totals = await db.select({ sessionId: memories.sessionId, value: count() }).from(memories).where(and(eq(memories.userId, actor.userId), inArray(memories.sessionId, rows.map((row) => row.id)))).groupBy(memories.sessionId)
    const byId = new Map(totals.map((item) => [item.sessionId, Number(item.value)]))
    return rows.map((row) => record(row, byId.get(row.id) ?? 0))
  }

  async findById(actor: Actor, id: string) {
    const [row] = await db.select().from(agentSessions).where(and(eq(agentSessions.id, id), eq(agentSessions.userId, actor.userId))).limit(1)
    if (!row) return null
    const [total] = await db.select({ value: count() }).from(memories).where(and(eq(memories.userId, actor.userId), eq(memories.sessionId, id)))
    return record(row, Number(total?.value ?? 0))
  }

  async heartbeat(actor: Actor, id: string) {
    const now = new Date()
    const [row] = await db.update(agentSessions).set({ lastHeartbeatAt: now, updatedAt: now }).where(and(eq(agentSessions.id, id), eq(agentSessions.userId, actor.userId), eq(agentSessions.status, 'active'))).returning()
    return row ? record(row) : null
  }

  async complete(actor: Actor, id: string) {
    const now = new Date()
    const [row] = await db.update(agentSessions).set({ status: 'completed', endedAt: now, updatedAt: now }).where(and(eq(agentSessions.id, id), eq(agentSessions.userId, actor.userId))).returning()
    return row ? record(row) : null
  }
}
