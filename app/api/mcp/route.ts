import { AsyncLocalStorage } from 'node:async_hooks'
import { createMcpHandler } from 'mcp-handler'
import { z } from 'zod'
import { actorFromRequest, can } from '@/lib/dal/request-actor'
import { memoryService, sessionService } from '@/lib/application/container'
import { memoryInputSchema, memoryTypeSchema } from '@/lib/application/memory-schema'
import { sessionCreateSchema } from '@/lib/application/session-schema'
import type { Actor } from '@/lib/domain/memory'

export const runtime = 'nodejs'

const actorContext = new AsyncLocalStorage<Actor>()
function actor(scope: 'memory:read' | 'memory:write' | 'session:read' | 'session:write') {
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
    title: 'Get context', description: 'Retrieve recent context for a project or session.',
    inputSchema: z.object({ projectId: z.string().optional(), sessionId: z.string().optional(), limit: z.number().int().min(1).max(100).default(30) }).strict(),
  }, async (input) => {
    const data = await memoryService.find(actor('memory:read'), input)
    return { content: [{ type: 'text', text: data.map((item) => `${item.type.toUpperCase()}: ${item.title}\n${item.content}`).join('\n\n') }], structuredContent: { memories: data } }
  })

  server.registerTool('start_session', {
    title: 'Start session', description: 'Start a durable agent work session with live presence.', inputSchema: sessionCreateSchema,
  }, async (input) => {
    const data = await sessionService.start(actor('session:write'), input)
    return { content: [{ type: 'text', text: `Started session ${data.id}. Heartbeat every 30-60 seconds.` }], structuredContent: { session: data } }
  })

  server.registerTool('list_sessions', {
    title: 'List sessions', description: 'List live, stale, and completed sessions.', inputSchema: z.object({ limit: z.number().int().min(1).max(100).default(30) }).strict(),
  }, async ({ limit }) => {
    const data = await sessionService.list(actor('session:read'), limit)
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
})

async function handler(request: Request) {
  const requestActor = await actorFromRequest(request)
  if (!requestActor) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: { 'WWW-Authenticate': 'Bearer realm="Mindstate MCP"' } })
  return actorContext.run(requestActor, () => mcp(request))
}

export { handler as GET, handler as POST, handler as DELETE }
