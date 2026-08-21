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

  // Query per type rather than fetching a mixed page and filtering it. Filtering after the limit
  // meant a decision older than the newest N memories simply never appeared in the briefing.
  const [decisions, preferences, context] = await Promise.all(
    (['decision', 'preference', 'context'] as const).map((type) =>
      memoryService.find(actor, { projectId: input.projectId, types: [type], limit }),
    ),
  )

  const all = [...decisions, ...preferences, ...context]
  const current = all.filter((memory) => isCurrent(memory.standing))
  const superseded = all.filter((memory) => !isCurrent(memory.standing))

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

  // Filtered in the query, not after, for the same reason.
  const handoffs = can(actor, 'handoff:read')
    ? (await workspaceService.listHandoffs(actor, { limit: 20, status: 'open', projectId: input.projectId })).data
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
