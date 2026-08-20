import 'server-only'

import { MemoryService } from '@/lib/application/memory-service'
import { PostgresMemoryRepository } from '@/lib/infrastructure/db/postgres/memory-repository'

const memoryRepository = new PostgresMemoryRepository()
export const memoryService = new MemoryService(memoryRepository, memoryRepository)
