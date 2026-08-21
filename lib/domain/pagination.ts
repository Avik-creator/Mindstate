export const DEFAULT_LIMIT = 30
export const MAX_LIMIT = 100

export type PageRequest = { limit?: number; offset?: number }
export type Paged<T> = { data: T[]; page: { limit: number; offset: number; total: number } }

// One place decides the bounds, so no list can quietly cap itself somewhere else.
export function normalizePage(request: PageRequest = {}) {
  return {
    limit: Math.min(Math.max(request.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT),
    offset: Math.max(request.offset ?? 0, 0),
  }
}
