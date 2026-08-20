import 'server-only'

import { and, desc, eq, ilike, inArray, or, type SQL } from 'drizzle-orm'
import { db } from './client'
import { memories } from './schema'
import type { Actor, CreateMemoryInput, MemoryRecord, MemoryRepository, MemorySearch, MemorySearchRepository } from '@/lib/domain/memory'

function conditions(actor: Actor, search: MemorySearch) {
  const list: SQL[] = [eq(memories.userId, actor.userId)]
  if (search.projectId) list.push(eq(memories.projectId, search.projectId))
  if (search.sessionId) list.push(eq(memories.sessionId, search.sessionId))
  if (search.types?.length) list.push(inArray(memories.type, search.types))
  return list
}

export class PostgresMemoryRepository implements MemoryRepository, MemorySearchRepository {
  async create(actor: Actor, input: CreateMemoryInput): Promise<MemoryRecord> {
    const [created] = await db.insert(memories).values({ id: crypto.randomUUID(), userId: actor.userId, ...input }).returning()
    return created as MemoryRecord
  }

  async findById(actor: Actor, id: string) {
    const [record] = await db.select().from(memories).where(and(eq(memories.id, id), eq(memories.userId, actor.userId))).limit(1)
    return (record as MemoryRecord | undefined) ?? null
  }

  async update(actor: Actor, id: string, input: Partial<CreateMemoryInput>) {
    const [record] = await db.update(memories).set({ ...input, updatedAt: new Date() }).where(and(eq(memories.id, id), eq(memories.userId, actor.userId))).returning()
    return (record as MemoryRecord | undefined) ?? null
  }

  async list(actor: Actor, search: MemorySearch) {
    return db.select().from(memories).where(and(...conditions(actor, search))).orderBy(desc(memories.updatedAt)).limit(search.limit ?? 20) as Promise<MemoryRecord[]>
  }

  async search(actor: Actor, search: MemorySearch) {
    const query = `%${search.query ?? ''}%`
    return db.select().from(memories).where(and(...conditions(actor, search), or(ilike(memories.title, query), ilike(memories.content, query)))).orderBy(desc(memories.updatedAt)).limit(search.limit ?? 20) as Promise<MemoryRecord[]>
  }

  async remove(actor: Actor, id: string) {
    const deleted = await db.delete(memories).where(and(eq(memories.id, id), eq(memories.userId, actor.userId))).returning({ id: memories.id })
    return deleted.length > 0
  }
}
