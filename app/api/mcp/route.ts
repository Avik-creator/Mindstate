import { AsyncLocalStorage } from 'node:async_hooks'
import { createMcpHandler } from 'mcp-handler'
import { z } from 'zod'
import { consumeApiQuota } from '@/lib/dal/api-rate-limit'
import { actorFromRequest, can } from '@/lib/dal/request-actor'
import { memoryService, sessionService } from '@/lib/application/container'
import { memoryInputSchema, memoryTypeSchema } from '@/lib/application/memory-schema'
import { sessionCreateSchema } from '@/lib/application/session-schema'
import { agentTelemetrySchema, handoffInputSchema, projectInputSchema, workspaceService } from '@/lib/application/workspace-service'
import { relate, relationInputSchema, RelationError } from '@/lib/application/memory-relation-service'
import { buildBriefing } from '@/lib/application/briefing-service'
import type { Actor } from '@/lib/domain/memory'
import type { Scope } from '@/lib/domain/scopes'

export const runtime = 'nodejs'

const actorContext = new AsyncLocalStorage<Actor>()
function actor(scope: Scope) {
  const value = actorContext.getStore()
  if (!value) throw new Error('Unauthorized')
  if (!can(value, scope)) throw new Error(`Forbidden: ${scope} scope required`)
  return value
}

const mcp = createMcpHandler((server) => {
  server.registerTool('search_memories', {
    title: 'Search memories', description: 'Search durable context owned by the authenticated workspace.',
    inputSchema: z.object({ query: z.string().optional(), projectId: z.string().optional(), sessionId: z.string().optional(), type: memoryTypeSchema.optional(), limit: z.number().int().min(1).max(100).default(20) }).strict(),
  }, async ({ query, projectId, sessionId, type: memoryType, limit }) => {
    const data = await memoryService.find(actor('memory:read'), { query, projectId, sessionId, types: memoryType ? [memoryType] : undefined, limit })
    return { content: [{ type: 'text', text: JSON.stringify(data) }], structuredContent: { memories: data } }
  })

  server.registerTool('save_memory', {
    title: 'Save memory', description: 'Persist a decision, context, preference, or handoff.',
    inputSchema: memoryInputSchema.omit({ source: true }),
  }, async (input) => {
    const data = await memoryService.capture(actor('memory:write'), { ...input, source: 'mcp' })
    return { content: [{ type: 'text', text: `Saved memory ${data.id}` }], structuredContent: { memory: data } }
  })

  server.registerTool('get_context', {
    title: 'Get context', description: 'Retrieve recent context for a project or session. Returns memories in recency order without weighing supersession; prefer get_briefing when starting work.',
    inputSchema: z.object({ projectId: z.string().optional(), sessionId: z.string().optional(), limit: z.number().int().min(1).max(100).default(30) }).strict(),
  }, async (input) => {
    const data = await memoryService.find(actor('memory:read'), input)
    return { content: [{ type: 'text', text: data.map((item) => `${item.type.toUpperCase()}: ${item.title}\n${item.content}`).join('\n\n') }], structuredContent: { memories: data } }
  })

  server.registerTool('get_briefing', {
    title: 'Get briefing', description: 'What to know before working on a project: current decisions and preferences, open handoffs, and any unresolved contradictions. Superseded memories are listed separately and never presented as current. Prefer this over search at the start of a session.',
    inputSchema: z.object({ projectId: z.string().uuid().optional(), limit: z.number().int().min(1).max(100).optional() }).strict(),
  }, async (input) => {
    const data = await buildBriefing(actor('memory:read'), input)
    const lines = [
      `${data.decisions.length} decisions, ${data.preferences.length} preferences, ${data.openHandoffs.length} open handoffs`,
      data.contradictions.length ? `${data.contradictions.length} unresolved contradiction(s) — read both sides before acting` : 'No known contradictions',
      data.superseded.length ? `${data.superseded.length} memory(ies) superseded and excluded from the above` : '',
    ].filter(Boolean)
    return { content: [{ type: 'text', text: lines.join('\n') }], structuredContent: data }
  })

  server.registerTool('relate_memories', {
    title: 'Relate memories', description: 'Record that one memory supersedes or contradicts another. Superseding marks the older memory stale without deleting it, so the change stays visible. Use contradicts when both may be true or neither clearly wins.',
    inputSchema: z.object({ memoryId: z.string().uuid() }).extend(relationInputSchema.shape).strict(),
  }, async ({ memoryId, ...input }) => {
    try {
      const data = await relate(actor('memory:write'), memoryId, input)
      return { content: [{ type: 'text', text: `Recorded: ${memoryId} ${input.kind} ${input.targetId}` }], structuredContent: { relation: data } }
    } catch (error) {
      if (error instanceof RelationError) throw new Error(`Could not record that relationship: ${error.message}`)
      throw error
    }
  })

  server.registerTool('start_session', {
    title: 'Start session', description: 'Start a durable agent work session with live presence.', inputSchema: sessionCreateSchema,
  }, async (input) => {
    const data = await sessionService.start(actor('session:write'), input)
    return { content: [{ type: 'text', text: `Started session ${data.id}. Heartbeat every 30 seconds to stay live.` }], structuredContent: { session: data } }
  })

  server.registerTool('list_sessions', {
    title: 'List sessions', description: 'List live, stale, and completed sessions.', inputSchema: z.object({ limit: z.number().int().min(1).max(100).default(30) }).strict(),
  }, async ({ limit }) => {
    const { data } = await sessionService.listPage(actor('session:read'), { limit })
    return { content: [{ type: 'text', text: JSON.stringify(data) }], structuredContent: { sessions: data } }
  })

  server.registerTool('heartbeat_session', {
    title: 'Heartbeat session', description: 'Keep a running session live.', inputSchema: z.object({ sessionId: z.string().uuid() }).strict(),
  }, async ({ sessionId }) => {
    const data = await sessionService.heartbeat(actor('session:write'), sessionId)
    if (!data) throw new Error('Active session not found')
    return { content: [{ type: 'text', text: `Session ${sessionId} is live.` }], structuredContent: { session: data } }
  })

  server.registerTool('complete_session', {
    title: 'Complete session', description: 'Mark an agent session completed.', inputSchema: z.object({ sessionId: z.string().uuid() }).strict(),
  }, async ({ sessionId }) => {
    const data = await sessionService.complete(actor('session:write'), sessionId)
    if (!data) throw new Error('Session not found')
    return { content: [{ type: 'text', text: `Completed session ${sessionId}.` }], structuredContent: { session: data } }
  })

  server.registerTool('list_projects', { title: 'List projects', description: 'List projects with live related-record counts.', inputSchema: z.object({}).strict() }, async () => {
    const { data } = await workspaceService.listProjects(actor('project:read'))
    return { content: [{ type: 'text', text: JSON.stringify(data) }], structuredContent: { projects: data } }
  })
  server.registerTool('create_project', { title: 'Create project', description: 'Create an owner-scoped project.', inputSchema: projectInputSchema }, async (input) => {
    const data = await workspaceService.createProject(actor('project:write'), input)
    return { content: [{ type: 'text', text: `Created project ${data.id}` }], structuredContent: { project: data } }
  })
  server.registerTool('list_handoffs', { title: 'List handoffs', description: 'List durable agent handoffs, including whether each is currently held by a live agent.', inputSchema: z.object({}).strict() }, async () => {
    const { data } = await workspaceService.listHandoffs(actor('handoff:read'))
    return { content: [{ type: 'text', text: JSON.stringify(data) }], structuredContent: { handoffs: data } }
  })
  server.registerTool('create_handoff', { title: 'Create handoff', description: 'Create a durable handoff with optional project and session context.', inputSchema: handoffInputSchema }, async (input) => {
    const data = await workspaceService.createHandoff(actor('handoff:write'), input)
    return { content: [{ type: 'text', text: `Created handoff ${data.id}` }], structuredContent: { handoff: data } }
  })
  server.registerTool('claim_handoff', {
    title: 'Claim handoff', description: 'Take exclusive ownership of an open handoff. Requires a live session; the claim is released automatically if that session stops heartbeating.',
    inputSchema: z.object({ handoffId: z.string().uuid(), sessionId: z.string().uuid() }).strict(),
  }, async ({ handoffId, sessionId }) => {
    const result = await workspaceService.claimHandoff(actor('handoff:write'), handoffId, sessionId)
    if (result.error === 'SESSION_NOT_LIVE') throw new Error('Start a session and heartbeat it before claiming work')
    if (result.error === 'UNAVAILABLE') throw new Error('That handoff is closed or already held by a live agent')
    return { content: [{ type: 'text', text: `Claimed "${result.handoff.title}". Keep heartbeating ${sessionId} to hold it.` }], structuredContent: { handoff: result.handoff } }
  })

  server.registerTool('release_handoff', {
    title: 'Release handoff', description: 'Give up a claimed handoff so another agent can take it.',
    inputSchema: z.object({ handoffId: z.string().uuid(), sessionId: z.string().uuid() }).strict(),
  }, async ({ handoffId, sessionId }) => {
    const released = await workspaceService.releaseHandoff(actor('handoff:write'), handoffId, sessionId)
    if (!released) throw new Error('That session does not hold this handoff')
    return { content: [{ type: 'text', text: `Released handoff ${handoffId}.` }], structuredContent: { handoff: released } }
  })

  server.registerTool('report_agent_context', { title: 'Report agent context', description: 'Report runtime and capabilities for explainable automatic agent classification. Never send secrets.', inputSchema: agentTelemetrySchema }, async (input) => {
    const data = await workspaceService.recordAgentTelemetry(actor('agent:write'), input)
    return { content: [{ type: 'text', text: `Agent classified as ${data?.category ?? 'general'}.` }], structuredContent: { agent: data } }
  })
})

async function handler(request: Request) {
  const requestActor = await actorFromRequest(request, { bearerOnly: true })
  if (!requestActor) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: { 'WWW-Authenticate': 'Bearer realm="Mindstate MCP"' } })
  if (requestActor.credentialId) {
    const quota = await consumeApiQuota(requestActor.credentialId)
    if (!quota.allowed) return Response.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(quota.retryAfter) } })
  }
  return actorContext.run(requestActor, () => mcp(request))
}

export { handler as GET, handler as POST, handler as DELETE }
