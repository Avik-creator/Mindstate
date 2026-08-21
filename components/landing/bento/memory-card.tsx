const records = [
  { type: 'Decision', title: 'Presence stays heartbeat-based', tag: 'architecture' },
  { type: 'Context', title: 'Every query is owner-scoped', tag: 'security' },
  { type: 'Preference', title: 'Migrations need human approval', tag: 'process' },
]

export function MemoryCard() {
  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-4 flex items-center gap-2">
        <span className="size-2 bg-foreground" aria-hidden="true" />
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Durable records</span>
      </div>
      <ul className="flex-1 divide-y divide-border border-y border-border">
        {records.map((record) => (
          <li key={record.title} className="flex flex-col gap-1 py-3">
            <span className="text-[9px] uppercase tracking-[0.2em] text-brand">{record.type}</span>
            <span className="text-xs leading-5">{record.title}</span>
            <span className="text-[10px] text-muted-foreground">#{record.tag}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[10px] leading-5 text-muted-foreground">
        Typed, tagged, and project-linked. Searched by word stem and ranked, not substring-matched.
      </p>
    </div>
  )
}
