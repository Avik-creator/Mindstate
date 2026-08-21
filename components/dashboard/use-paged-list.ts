'use client'

import useSWRInfinite from 'swr/infinite'
import { fetcher } from '@/components/dashboard/api'

const PAGE_SIZE = 50

export type PagedResponse<T> = { data: T[]; page: { limit: number; offset: number; total: number } }

// Every list in the dashboard pages the same way, so none of them can quietly cap itself.
export function usePagedList<T>(path: string, options: { refreshInterval?: number; query?: string } = {}) {
  const search = options.query ? `&q=${encodeURIComponent(options.query)}` : ''

  const swr = useSWRInfinite<PagedResponse<T>>(
    (index, previous) => {
      if (previous && previous.data.length < PAGE_SIZE) return null
      return `${path}${path.includes('?') ? '&' : '?'}limit=${PAGE_SIZE}&offset=${index * PAGE_SIZE}${search}`
    },
    fetcher,
    { refreshInterval: options.refreshInterval, keepPreviousData: true },
  )

  const items = swr.data?.flatMap((page) => page.data) ?? []
  const total = swr.data?.[0]?.page.total ?? 0

  return {
    items,
    total,
    hasMore: items.length < total,
    error: swr.error as Error | undefined,
    loading: swr.isLoading && !swr.data,
    busy: swr.isValidating,
    loadMore: () => { void swr.setSize(swr.size + 1) },
    refresh: () => swr.mutate(),
  }
}
