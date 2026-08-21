import 'server-only'

import { memoryService } from '@/lib/application/container'
import { workspaceService } from '@/lib/application/workspace-service'
import { isCurrent } from '@/lib/domain/memory-relation'
import { can } from '@/lib/domain/scopes'
import type { Actor } from '@/lib/domain/memory'

type BriefingInput = { projectId?: string; limit?: number }

// What an agent needs before touching a project, assembled server-side. Recall by query makes the
// agent guess search terms; this answers "what should I know" instead.
export async function buildBriefing(actor: Actor, input: BriefingInput = {}) {
  const limit = Math.min(Math.max(input.limit ?? 40, 1), 100)
  const memories = await memoryService.find(actor, { projectId: input.projectId, limit })

  const current = memories.filter((memory) => isCurrent(memory.standing))
  const superseded = memories.filter((memory) => !isCurrent(memory.standing))

  const byType = (type: string) => current.filter((memory) => memory.type === type)

  // Each disagreement appears once, not once per side.
  const seen = new Set<string>()
  const contradictions = current.flatMap((memory) =>
    memory.standing.contradicts.flatMap((other) => {
      const key = [memory.id, other.id].sort().join(':')
      if (seen.has(key)) return []
      seen.add(key)
      return [{ note: other.note, between: [{ id: memory.id, title: memory.title }, { id: other.id, title: other.title }] }]
    }),
  )

  const handoffs = can(actor, 'handoff:read')
    ? (await workspaceService.listHandoffs(actor, { limit: 20 })).data
        .filter((handoff) => handoff.status === 'open')
        .filter((handoff) => !input.projectId || handoff.projectId === input.projectId)
        .map((handoff) => ({ id: handoff.id, title: handoff.title, summary: handoff.summary, nextSteps: handoff.nextSteps, claim: handoff.claim }))
    : []

  return {
    projectId: input.projectId ?? null,
    decisions: byType('decision'),
    preferences: byType('preference'),
    context: byType('context'),
    openHandoffs: handoffs,
    // Surfaced, never silently resolved. Picking a winner is the reader's call.
    contradictions,
    superseded: superseded.map((memory) => ({
      id: memory.id, title: memory.title,
      replacedBy: memory.standing.supersededBy.map((ref) => ({ id: ref.id, title: ref.title })),
    })),
  }
}
