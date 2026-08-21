import 'server-only'

import { and, count, desc, eq, inArray, sql, type SQL } from 'drizzle-orm'
import { db } from './client'
import { memories } from './schema'
import { toTsQuery } from '@/lib/domain/text-search'
import type { Actor, CreateMemoryInput, MemoryRecord, MemoryRepository, MemorySearch, MemorySearchRepository } from '@/lib/domain/memory'

const searchVector = sql`"memories"."searchVector"`
const columns = { id: memories.id, userId: memories.userId, projectId: memories.projectId, sessionId: memories.sessionId, title: memories.title, content: memories.content, type: memories.type, tags: memories.tags, source: memories.source, actorType: memories.actorType, actorId: memories.actorId, createdAt: memories.createdAt, updatedAt: memories.updatedAt }

function conditions(actor: Actor, search: MemorySearch) {
  const list: SQL[] = [eq(memories.userId, actor.userId)]
  if (search.projectId) list.push(eq(memories.projectId, search.projectId))
  if (search.sessionId) list.push(eq(memories.sessionId, search.sessionId))
  if (search.types?.length) list.push(inArray(memories.type, search.types))
  const tsquery = search.query ? toTsQuery(search.query) : null
  if (tsquery) list.push(sql`${searchVector} @@ to_tsquery('english', ${tsquery})`)
  return list
}

export class PostgresMemoryRepository implements MemoryRepository, MemorySearchRepository {
  async create(actor: Actor, input: CreateMemoryInput): Promise<MemoryRecord> {
    const [created] = await db.insert(memories).values({ id: crypto.randomUUID(), userId: actor.userId, actorType: actor.agentId ? 'agent' : 'user', actorId: actor.agentId ?? actor.userId, ...input }).returning(columns)
    return created as MemoryRecord
  }

  async findById(actor: Actor, id: string) {
    const [record] = await db.select(columns).from(memories).where(and(eq(memories.id, id), eq(memories.userId, actor.userId))).limit(1)
    return (record as MemoryRecord | undefined) ?? null
  }

  async update(actor: Actor, id: string, input: Partial<CreateMemoryInput>) {
    const [record] = await db.update(memories).set({ ...input, updatedAt: new Date() }).where(and(eq(memories.id, id), eq(memories.userId, actor.userId))).returning(columns)
    return (record as MemoryRecord | undefined) ?? null
  }

  async list(actor: Actor, search: MemorySearch) {
    return db.select(columns).from(memories).where(and(...conditions(actor, search))).orderBy(desc(memories.updatedAt)).limit(search.limit ?? 20).offset(search.offset ?? 0) as Promise<MemoryRecord[]>
  }

  async search(actor: Actor, search: MemorySearch) {
    const tsquery = search.query ? toTsQuery(search.query) : null
    if (!tsquery) return this.list(actor, search)
    const rank = sql`ts_rank(${searchVector}, to_tsquery('english', ${tsquery}))`
    return db.select(columns).from(memories).where(and(...conditions(actor, search))).orderBy(desc(rank), desc(memories.updatedAt)).limit(search.limit ?? 20).offset(search.offset ?? 0) as Promise<MemoryRecord[]>
  }

  async count(actor: Actor, search: MemorySearch) {
    const [row] = await db.select({ value: count() }).from(memories).where(and(...conditions(actor, search)))
    return Number(row?.value ?? 0)
  }

  async remove(actor: Actor, id: string) {
    const deleted = await db.delete(memories).where(and(eq(memories.id, id), eq(memories.userId, actor.userId))).returning({ id: memories.id })
    return deleted.length > 0
  }
}
