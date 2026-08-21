import type { Actor } from '@/lib/domain/memory'
import type { AgentSessionRepository, CreateSessionInput } from '@/lib/domain/agent-session'
import { normalizePage, type PageRequest, type Paged } from '@/lib/domain/pagination'
import type { AgentSessionRecord } from '@/lib/domain/agent-session'

export class AgentSessionService {
  constructor(private readonly repository: AgentSessionRepository) {}
  start(actor: Actor, input: CreateSessionInput) { return this.repository.create(actor, input) }
  list(actor: Actor, page: PageRequest = {}) { return this.repository.list(actor, page) }

  // Carries the total so a caller can tell whether more pages exist.
  async listPage(actor: Actor, page: PageRequest = {}): Promise<Paged<AgentSessionRecord>> {
    const bounds = normalizePage(page)
    const [data, total] = await Promise.all([this.repository.list(actor, bounds), this.repository.count(actor)])
    return { data, page: { ...bounds, total } }
  }
  get(actor: Actor, id: string) { return this.repository.findById(actor, id) }
  heartbeat(actor: Actor, id: string) { return this.repository.heartbeat(actor, id) }
  complete(actor: Actor, id: string) { return this.repository.complete(actor, id) }
}
