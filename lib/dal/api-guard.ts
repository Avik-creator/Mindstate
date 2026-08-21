import 'server-only'

import { NextResponse } from 'next/server'
import { consumeApiQuota } from '@/lib/dal/api-rate-limit'
import { actorFromRequest } from '@/lib/dal/request-actor'
import { can, type Scope } from '@/lib/domain/scopes'
import type { Actor } from '@/lib/domain/memory'

type Guard = { actor: Actor; response?: never } | { actor?: never; response: NextResponse }

const deny = (status: number, code: string, message: string, headers?: HeadersInit) =>
  ({ response: NextResponse.json({ error: { code, message } }, { status, headers }) }) satisfies Guard

// One place for authentication, scope, and quota, so a new route cannot quietly skip any of them.
export async function apiGuard(
  request: Request,
  scope?: Scope,
  options?: { bearerOnly?: boolean; sessionOnly?: boolean; agentOnly?: boolean },
): Promise<Guard> {
  const actor = await actorFromRequest(request, { bearerOnly: options?.bearerOnly })
  if (!actor) return deny(401, 'UNAUTHORIZED', 'Authentication required')
  if (options?.sessionOnly && actor.credentialId) return deny(401, 'SESSION_REQUIRED', 'Owner session authentication required')
  if (options?.agentOnly && !actor.agentId) return deny(403, 'FORBIDDEN', 'Agent credential required')
  if (scope && !can(actor, scope)) return deny(403, 'FORBIDDEN', `${scope} scope required`)

  // Owner sessions are the human and are already bounded by the auth rate limits.
  if (actor.credentialId) {
    const quota = await consumeApiQuota(actor.credentialId)
    if (!quota.allowed) {
      return deny(429, 'RATE_LIMITED', 'Too many requests. Slow down.', { 'Retry-After': String(quota.retryAfter) })
    }
  }

  return { actor }
}
