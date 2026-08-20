import type { Actor } from '@/lib/domain/memory'
import type { AgentSessionRepository, CreateSessionInput } from '@/lib/domain/agent-session'

export class AgentSessionService {
  constructor(private readonly repository: AgentSessionRepository) {}
  start(actor: Actor, input: CreateSessionInput) { return this.repository.create(actor, input) }
  list(actor: Actor, limit = 30) { return this.repository.list(actor, limit) }
  get(actor: Actor, id: string) { return this.repository.findById(actor, id) }
  heartbeat(actor: Actor, id: string) { return this.repository.heartbeat(actor, id) }
  complete(actor: Actor, id: string) { return this.repository.complete(actor, id) }
}
