import { AsyncLocalStorage } from 'node:async_hooks'
import { createMcpHandler } from 'mcp-handler'
import { z } from 'zod'
import { actorFromRequest } from '@/lib/dal/request-actor'
import { memoryService } from '@/lib/application/container'
import type { Actor } from '@/lib/domain/memory'

export const runtime = 'nodejs'

const actorContext = new AsyncLocalStorage<Actor>()
const type = z.enum(['decision', 'context', 'preference', 'handoff'])

function actor() {
  const value = actorContext.getStore()
  if (!value) throw new Error('Unauthorized')
  return value
}

const mcp = createMcpHandler((server) => {
  server.registerTool('search_memories', {
    title: 'Search memories', description: 'Search durable context owned by the authenticated workspace.',
    inputSchema: z.object({ query: z.string().optional(), projectId: z.string().optional(), sessionId: z.string().optional(), type: type.optional(), limit: z.number().int().min(1).max(100).default(20) }),
  }, async ({ query, projectId, sessionId, type: memoryType, limit }) => {
    const data = await memoryService.find(actor(), { query, projectId, sessionId, types: memoryType ? [memoryType] : undefined, limit })
    return { content: [{ type: 'text', text: JSON.stringify(data) }], structuredContent: { memories: data } }
  })

  server.registerTool('save_memory', {
    title: 'Save memory', description: 'Persist a decision, context, preference, or handoff.',
    inputSchema: z.object({ title: z.string().min(1).max(200), content: z.string().min(1).max(20000), type: type.default('context'), projectId: z.string().nullable().default(null), sessionId: z.string().nullable().default(null), tags: z.array(z.string()).max(20).default([]) }),
  }, async (input) => {
    const data = await memoryService.capture(actor(), { ...input, source: 'mcp' })
    return { content: [{ type: 'text', text: `Saved memory ${data.id}` }], structuredContent: { memory: data } }
  })

  server.registerTool('get_context', {
    title: 'Get context', description: 'Retrieve recent context for a project or session.',
    inputSchema: z.object({ projectId: z.string().optional(), sessionId: z.string().optional(), limit: z.number().int().min(1).max(100).default(30) }),
  }, async (input) => {
    const data = await memoryService.find(actor(), input)
    return { content: [{ type: 'text', text: data.map((item) => `${item.type.toUpperCase()}: ${item.title}\n${item.content}`).join('\n\n') }], structuredContent: { memories: data } }
  })
})

async function handler(request: Request) {
  const requestActor = await actorFromRequest(request)
  if (!requestActor) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: { 'WWW-Authenticate': 'Bearer realm="Threadbase MCP"' } })
  return actorContext.run(requestActor, () => mcp(request))
}

export { handler as GET, handler as POST, handler as DELETE }
