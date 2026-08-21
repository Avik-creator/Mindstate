import 'server-only'

import { randomUUID } from 'node:crypto'
import { and, eq, inArray, or } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/infrastructure/db/postgres/client'
import { memories, memoryRelations } from '@/lib/infrastructure/db/postgres/schema'
import { emptyStanding, RELATION_KINDS, type MemoryStanding } from '@/lib/domain/memory-relation'
import type { Actor } from '@/lib/domain/memory'

export const relationInputSchema = z.object({
  kind: z.enum(RELATION_KINDS),
  targetId: z.string().uuid(),
  note: z.string().trim().max(500).default(''),
}).strict()

export class RelationError extends Error {}

// Reads the standing of many memories in one round trip, so annotating a page of results does
// not become a query per row.
export async function standingFor(actor: Actor, ids: string[]): Promise<Map<string, MemoryStanding>> {
  const standing = new Map<string, MemoryStanding>(ids.map((id) => [id, emptyStanding()]))
  if (!ids.length) return standing

  const edges = await db.select({
    id: memoryRelations.id, fromId: memoryRelations.fromId, toId: memoryRelations.toId,
    kind: memoryRelations.kind, note: memoryRelations.note,
    fromTitle: memories.title,
  }).from(memoryRelations)
    .innerJoin(memories, eq(memories.id, memoryRelations.fromId))
    .where(and(
      eq(memoryRelations.userId, actor.userId),
      or(inArray(memoryRelations.fromId, ids), inArray(memoryRelations.toId, ids)),
    ))

  // Titles for the far end of each edge, whichever side that is.
  const otherIds = [...new Set(edges.flatMap((edge) => [edge.fromId, edge.toId]))]
  const titles = new Map(
    (await db.select({ id: memories.id, title: memories.title }).from(memories)
      .where(and(eq(memories.userId, actor.userId), inArray(memories.id, otherIds))))
      .map((row) => [row.id, row.title]),
  )

  for (const edge of edges) {
    const ref = (id: string) => ({ id, title: titles.get(id) ?? 'Unknown memory', note: edge.note })
    if (edge.kind === 'supersedes') {
      standing.get(edge.toId)?.supersededBy.push(ref(edge.fromId))
      standing.get(edge.fromId)?.supersedes.push(ref(edge.toId))
    } else {
      // Disagreement has no direction, so both sides see it.
      standing.get(edge.fromId)?.contradicts.push(ref(edge.toId))
      standing.get(edge.toId)?.contradicts.push(ref(edge.fromId))
    }
  }

  return standing
}

export async function relate(actor: Actor, fromId: string, input: z.infer<typeof relationInputSchema>) {
  if (fromId === input.targetId) throw new RelationError('SELF_RELATION')

  const owned = await db.select({ id: memories.id }).from(memories)
    .where(and(eq(memories.userId, actor.userId), inArray(memories.id, [fromId, input.targetId])))
  if (owned.length !== 2) throw new RelationError('MEMORY_NOT_FOUND')

  if (input.kind === 'supersedes') {
    // A supersedes B while B supersedes A would leave both stale and neither current.
    const [reciprocal] = await db.select({ id: memoryRelations.id }).from(memoryRelations).where(and(
      eq(memoryRelations.userId, actor.userId), eq(memoryRelations.fromId, input.targetId),
      eq(memoryRelations.toId, fromId), eq(memoryRelations.kind, 'supersedes'),
    )).limit(1)
    if (reciprocal) throw new RelationError('RECIPROCAL_SUPERSESSION')
  }

  const [row] = await db.insert(memoryRelations).values({
    id: randomUUID(), userId: actor.userId, fromId, toId: input.targetId, kind: input.kind,
    note: input.note, actorType: actor.agentId ? 'agent' : 'user', actorId: actor.agentId ?? actor.userId,
  }).onConflictDoNothing().returning()

  if (!row) throw new RelationError('ALREADY_RELATED')
  return row
}

export async function unrelate(actor: Actor, fromId: string, relationId: string) {
  const [row] = await db.delete(memoryRelations)
    .where(and(eq(memoryRelations.userId, actor.userId), eq(memoryRelations.id, relationId), eq(memoryRelations.fromId, fromId)))
    .returning({ id: memoryRelations.id })
  return row ?? null
}
