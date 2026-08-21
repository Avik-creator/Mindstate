'use client'

import { useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { relativeTime, send } from '@/components/dashboard/api'
import { Empty, NoMatches } from '@/components/dashboard/states'
import type { Handoff } from '@/components/dashboard/types'

// An expired claim is worth showing as its own state: it means an agent took the work and died,
// which is different from nobody having picked it up.
function ClaimBadge({ claim }: { claim: Handoff['claim'] }) {
  if (claim.state === 'unclaimed') return null
  if (claim.state === 'held') {
    return (
      <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-brand">
        <span className="size-1.5 bg-brand" aria-hidden="true" />
        held {claim.claimedAt ? relativeTime(claim.claimedAt) : ''}
      </span>
    )
  }
  return (
    <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground" title="The agent holding this stopped heartbeating, so it is available again">
      claim expired
    </span>
  )
}

function StatusToggle({ handoff, refresh }: { handoff: Handoff; refresh: () => Promise<void> }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function toggle() {
    setBusy(true)
    setError('')
    try {
      await send(`/api/v1/handoffs/${handoff.id}`, 'PATCH', { status: handoff.status === 'open' ? 'closed' : 'open' })
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not update this handoff')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-4 flex flex-col gap-2">
      <Button variant="outline" size="sm" className="self-start" disabled={busy} onClick={toggle}>
        {busy ? 'Saving…' : handoff.status === 'open' ? 'Close' : 'Reopen'}
      </Button>
      {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
    </div>
  )
}

export function HandoffList({ items, query, refresh }: { items: Handoff[]; query?: string; refresh: () => Promise<void> }) {
  if (!items.length) return query ? <NoMatches label="handoffs" query={query} /> : <Empty label="handoffs" />

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((handoff) => (
        <article key={handoff.id} className="border-2 border-foreground bg-card p-5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold">{handoff.title}</h3>
            <Badge variant={handoff.status === 'open' ? 'default' : 'secondary'}>{handoff.status}</Badge>
          </div>
          <p className="mt-3 line-clamp-4 text-sm leading-6 text-muted-foreground">{handoff.summary}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="font-mono text-[10px] text-muted-foreground">updated {relativeTime(handoff.updatedAt)}</p>
            <ClaimBadge claim={handoff.claim} />
          </div>
          <StatusToggle handoff={handoff} refresh={refresh} />
        </article>
      ))}
    </div>
  )
}
