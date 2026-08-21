export const RELATION_KINDS = ['supersedes', 'contradicts'] as const
export type RelationKind = (typeof RELATION_KINDS)[number]

export type RelationRef = { id: string; title: string; note: string }

// What a reader needs to know about a memory before trusting it.
export type MemoryStanding = {
  // Newer memories that replace this one. Non-empty means the memory is stale.
  supersededBy: RelationRef[]
  // Older memories this one replaces. Kept so the change is visible from either side.
  supersedes: RelationRef[]
  // Memories that disagree with this one, where neither side has been declared the winner.
  contradicts: RelationRef[]
}

export const emptyStanding = (): MemoryStanding => ({ supersededBy: [], supersedes: [], contradicts: [] })

// A superseded memory is history, not truth. It is never deleted, only stopped from being
// presented as current.
export function isCurrent(standing: MemoryStanding) {
  return standing.supersededBy.length === 0
}

export function isDisputed(standing: MemoryStanding) {
  return standing.contradicts.length > 0
}
