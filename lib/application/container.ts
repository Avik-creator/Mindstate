import 'server-only'

import { MemoryService } from '@/lib/application/memory-service'
import { PostgresMemoryRepository } from '@/lib/infrastructure/db/postgres/memory-repository'
import { AgentSessionService } from '@/lib/application/session-service'
import { PostgresAgentSessionRepository } from '@/lib/infrastructure/db/postgres/session-repository'

const memoryRepository = new PostgresMemoryRepository()
const sessionRepository = new PostgresAgentSessionRepository()
export const memoryService = new MemoryService(memoryRepository, memoryRepository)
export const sessionService = new AgentSessionService(sessionRepository)
