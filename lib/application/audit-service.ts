import 'server-only'

import { randomUUID } from 'node:crypto'
import { and, desc, eq, count } from 'drizzle-orm'
import { db } from '@/lib/infrastructure/db/postgres/client'
import { auditEvents } from '@/lib/infrastructure/db/postgres/schema'
import { normalizePage, type PageRequest } from '@/lib/domain/pagination'
import type { AuditEntry } from '@/lib/domain/audit'
import type { Actor } from '@/lib/domain/memory'

type Executor = Pick<typeof db, 'insert'>

// Takes the transaction when there is one, so an action and its record land together or not at all.
export function recordAudit(actor: Actor, entry: AuditEntry, tx: Executor = db) {
  return tx.insert(auditEvents).values({
    id: randomUUID(),
    userId: actor.userId,
    actorType: actor.agentId ? 'agent' : 'user',
    actorId: actor.agentId ?? actor.userId,
    credentialId: actor.credentialId ?? null,
    action: entry.action,
    targetType: entry.targetType,
    targetId: entry.targetId,
    summary: entry.summary ?? '',
    metadata: entry.metadata ?? {},
  })
}

export async function listAudit(actor: Actor, page: PageRequest = {}) {
  const bounds = normalizePage(page)
  const where = eq(auditEvents.userId, actor.userId)
  const [data, [total]] = await Promise.all([
    db.select().from(auditEvents).where(where).orderBy(desc(auditEvents.createdAt)).limit(bounds.limit).offset(bounds.offset),
    db.select({ value: count() }).from(auditEvents).where(where),
  ])
  return { data, page: { ...bounds, total: Number(total?.value ?? 0) } }
}

export async function auditForTarget(actor: Actor, targetType: string, targetId: string) {
  return db.select().from(auditEvents)
    .where(and(eq(auditEvents.userId, actor.userId), eq(auditEvents.targetType, targetType), eq(auditEvents.targetId, targetId)))
    .orderBy(desc(auditEvents.createdAt))
}
