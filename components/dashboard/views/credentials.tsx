import { Badge } from '@/components/ui/badge'
import { relativeTime } from '@/components/dashboard/api'
import { ConfirmAction } from '@/components/dashboard/confirm-action'
import { Empty } from '@/components/dashboard/states'
import type { ApiKey } from '@/components/dashboard/types'

export function CredentialList({ items, refresh }: { items: ApiKey[]; refresh: () => Promise<void> }) {
  if (!items.length) return <Empty label="API keys" hint="Enrol an agent to issue its first key." />

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      {items.map((key) => (
        <article key={key.id} className="flex flex-col gap-3 border-b p-5 last:border-b-0 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-medium">{key.name}</h3>
            <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
              {key.prefix}… · last used {relativeTime(key.lastUsedAt)}
            </p>
          </div>
          {key.revokedAt ? (
            <Badge variant="outline">Revoked {relativeTime(key.revokedAt)}</Badge>
          ) : (
            <ConfirmAction
              trigger="Revoke"
              title={`Revoke ${key.name}?`}
              description="The key stops working immediately. Any agent using it must be re-enrolled."
              confirmLabel="Revoke key"
              pendingLabel="Revoking…"
              url={`/api/v1/api-keys/${key.id}`}
              refresh={refresh}
            />
          )}
        </article>
      ))}
    </div>
  )
}
