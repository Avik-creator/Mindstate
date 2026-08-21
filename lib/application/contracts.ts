import { z } from 'zod'
import { SCOPES } from '@/lib/domain/scopes'

export const scopeSchema = z.enum(SCOPES)
export const scopesSchema = z.array(scopeSchema).min(1).max(SCOPES.length).transform((scopes) => [...new Set(scopes)])
export const pageQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(30),
  offset: z.coerce.number().int().min(0).default(0),
})

export const agentNameSchema = z.string().trim().min(2).max(80)
export const idSchema = z.string().uuid()

export const apiKeyCreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  agentId: idSchema.optional(),
  scopes: scopesSchema.default(['memory:read']),
}).strict()

export const signupTokenCreateSchema = z.object({
  agentName: agentNameSchema,
  scopes: scopesSchema.default([...SCOPES]),
  expiresInMinutes: z.number().int().min(5).max(60).default(15),
}).strict()

export const agentBootstrapSchema = z.object({
  token: z.string().min(32).max(256),
  agentName: agentNameSchema.optional(),
}).strict()

// Thrown when a request references a project or session the caller does not own.
export class ReferenceNotFoundError extends Error {}

export function invalidRelation(error: ReferenceNotFoundError) {
  return { error: { code: 'INVALID_RELATION', message: error.message } }
}

export function validationError(error: z.ZodError) {
  return {
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      issues: error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message, code: issue.code })),
    },
  }
}

export type AgentScope = z.infer<typeof scopeSchema>
