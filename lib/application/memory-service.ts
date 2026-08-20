import type {
  Actor,
  CreateMemoryInput,
  MemoryRepository,
  MemorySearch,
  MemorySearchRepository,
} from '@/lib/domain/memory'

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
    return this.memories.findById(actor, id)
  }

  async update(actor: Actor, id: string, input: Partial<CreateMemoryInput>) {
    return this.memories.update(actor, id, input)
  }

  async find(actor: Actor, search: MemorySearch) {
    const safeSearch = {
      ...search,
      query: search.query?.trim(),
      limit: Math.min(Math.max(search.limit ?? 20, 1), 100),
    }

    return safeSearch.query
      ? this.searchIndex.search(actor, safeSearch)
      : this.memories.list(actor, safeSearch)
  }

  async delete(actor: Actor, id: string) {
    return this.memories.remove(actor, id)
  }
}
