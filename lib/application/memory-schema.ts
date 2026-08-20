import { z } from 'zod'

export const memoryTypeSchema = z.enum(['decision', 'context', 'preference', 'handoff'])
export const memoryInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1).max(20000),
  type: memoryTypeSchema.default('context'),
  projectId: z.string().nullable().default(null),
  sessionId: z.string().nullable().default(null),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  source: z.enum(['manual', 'api', 'mcp']).default('api'),
})

export const memoryPatchSchema = memoryInputSchema.partial()
