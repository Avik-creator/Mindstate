import type { Actor } from '@/lib/domain/memory'
import type { PageRequest } from '@/lib/domain/pagination'

// A session with no heartbeat inside this window reads as stale rather than live.
export const SESSION_STALE_AFTER_MS = 90_000

// Taking work away from an agent needs more confidence than dimming a dot in the dashboard, so
// a claim survives longer silence than presence does. Three times the documented 60s upper
// bound, which tolerates two missed heartbeats; presence stays responsive at 90s.
export const CLAIM_LEASE_AFTER_MS = 180_000

export type SessionStatus = 'active' | 'completed'
export type SessionPresence = 'live' | 'stale' | 'completed'

export type AgentSessionRecord = {
  id: string
  userId: string
  projectId: string | null
  agentId: string | null
  title: string
  agent: string
  status: SessionStatus
  presence: SessionPresence
  metadata: Record<string, string>
  lastHeartbeatAt: Date
  endedAt: Date | null
  createdAt: Date
  updatedAt: Date
  memoryCount: number
}

export type CreateSessionInput = {
  title: string
  projectId?: string | null
  agent?: string
  metadata?: Record<string, string>
}

export interface AgentSessionRepository {
  create(actor: Actor, input: CreateSessionInput): Promise<AgentSessionRecord>
  list(actor: Actor, page: PageRequest): Promise<AgentSessionRecord[]>
  count(actor: Actor): Promise<number>
  findById(actor: Actor, id: string): Promise<AgentSessionRecord | null>
  heartbeat(actor: Actor, id: string): Promise<AgentSessionRecord | null>
  complete(actor: Actor, id: string): Promise<AgentSessionRecord | null>
}
