export async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url)
  const body = await response.json()
  if (!response.ok) throw new Error(body.error?.message ?? 'Could not load workspace')
  return body as T
}

export async function send(url: string, method: string, data?: unknown) {
  const response = await fetch(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: data ? JSON.stringify(data) : undefined,
  })
  // DELETE routes answer 204 with no body, so parsing unconditionally would report a success as a failure.
  const body: { error?: { message?: string } } | null =
    response.status === 204 ? null : await response.json().catch(() => null)
  if (!response.ok) throw new Error(body?.error?.message ?? 'Request failed')
  return body
}

// Compact relative time for heartbeats and last-seen stamps.
export function relativeTime(iso: string | null): string {
  if (!iso) return 'never'
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return 'unknown'

  const seconds = Math.round((Date.now() - then) / 1000)
  if (seconds < 0) return 'just now'
  if (seconds < 45) return `${seconds}s ago`

  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  return `${Math.round(hours / 24)}d ago`
}
