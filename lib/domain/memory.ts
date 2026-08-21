import type { Scope } from '@/lib/domain/scopes'

export type Actor = {
  userId: string
  credentialId?: string
  agentId?: string
  scopes?: Scope[]
}

export type MemoryType = 'decision' | 'context' | 'preference' | 'handoff'

export type MemoryRecord = {
  id: string
  userId: string
  title: string
  content: string
  type: MemoryType
  projectId: string | null
  sessionId: string | null
  tags: string[]
  source: 'manual' | 'api' | 'mcp'
  createdAt: Date
  updatedAt: Date
}

export type CreateMemoryInput = Pick<
  MemoryRecord,
  'title' | 'content' | 'type' | 'projectId' | 'sessionId' | 'tags' | 'source'
>

export type MemorySearch = {
  query?: string
  projectId?: string
  sessionId?: string
  types?: MemoryType[]
  tags?: string[]
  limit?: number
  offset?: number
}

export interface MemoryRepository {
  create(actor: Actor, input: CreateMemoryInput): Promise<MemoryRecord>
  findById(actor: Actor, id: string): Promise<MemoryRecord | null>
  update(actor: Actor, id: string, input: Partial<CreateMemoryInput>): Promise<MemoryRecord | null>
  list(actor: Actor, search: MemorySearch): Promise<MemoryRecord[]>
  count(actor: Actor, search: MemorySearch): Promise<number>
  remove(actor: Actor, id: string): Promise<boolean>
}

export interface MemorySearchRepository {
  search(actor: Actor, search: MemorySearch): Promise<MemoryRecord[]>
}
