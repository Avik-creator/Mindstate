import { z } from 'zod'

export const sessionCreateSchema = z.object({
  title: z.string().trim().min(2).max(120),
  projectId: z.string().trim().min(1).max(120).nullable().optional(),
  agent: z.string().trim().min(1).max(80).optional(),
  metadata: z.record(z.string(), z.string().max(500)).default({}),
}).strict()

