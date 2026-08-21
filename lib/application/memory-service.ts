import { standingFor } from '@/lib/application/memory-relation-service'
import { emptyStanding } from '@/lib/domain/memory-relation'
import type {
  Actor,
  CreateMemoryInput,
  MemoryRepository,
  MemorySearch,
  MemorySearchRepository,
  MemoryRecord,
} from '@/lib/domain/memory'

function normalize(search: MemorySearch) {
  return {
    ...search,
    query: search.query?.trim(),
    limit: Math.min(Math.max(search.limit ?? 20, 1), 100),
    offset: Math.max(search.offset ?? 0, 0),
  }
}

export class MemoryService {
  constructor(
    private readonly memories: MemoryRepository,
    private readonly searchIndex: MemorySearchRepository,
  ) {}

  async capture(actor: Actor, input: CreateMemoryInput) {
    const normalized = {
      ...input,
      title: input.title.trim(),
      content: input.content.trim(),
      tags: [...new Set(input.tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))],
    }

    if (!normalized.title || !normalized.content) {
      throw new Error('Title and content are required')
    }

    return this.memories.create(actor, normalized)
  }

  async get(actor: Actor, id: string) {
    const record = await this.memories.findById(actor, id)
    if (!record) return null
    const [withStanding] = await this.withStanding(actor, [record])
    return withStanding
  }

  async update(actor: Actor, id: string, input: Partial<CreateMemoryInput>) {
    return this.memories.update(actor, id, input)
  }

  async find(actor: Actor, search: MemorySearch) {
    const safeSearch = normalize(search)
    const rows = safeSearch.query
      ? await this.searchIndex.search(actor, safeSearch)
      : await this.memories.list(actor, safeSearch)

    return this.withStanding(actor, rows)
  }

  // Every read carries standing, so a superseded memory can never be presented as current by
  // a caller that simply forgot to ask.
  private async withStanding(actor: Actor, rows: MemoryRecord[]) {
    const standing = await standingFor(actor, rows.map((row) => row.id))
    return rows.map((row) => ({ ...row, standing: standing.get(row.id) ?? emptyStanding() }))
  }

  // Same query as find(), plus the total so a caller knows whether more pages exist.
  async findPage(actor: Actor, search: MemorySearch) {
    const safeSearch = normalize(search)
    const [rows, total] = await Promise.all([
      safeSearch.query ? this.searchIndex.search(actor, safeSearch) : this.memories.list(actor, safeSearch),
      this.memories.count(actor, safeSearch),
    ])

    return { data: await this.withStanding(actor, rows), page: { limit: safeSearch.limit, offset: safeSearch.offset, total } }
  }

  async delete(actor: Actor, id: string) {
    return this.memories.remove(actor, id)
  }
}
