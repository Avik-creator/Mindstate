// Every figure here is a real constant from the codebase, not an invented metric.
const facts = [
  { value: '90s', label: 'Until a silent session reads stale' },
  { value: '120', label: 'Requests per minute, per credential' },
  { value: '9', label: 'Scopes a key can be narrowed to' },
  { value: '30m', label: 'Claim link lifetime' },
]

export function LimitsCard() {
  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-4 flex items-center gap-2">
        <span className="size-2 bg-foreground" aria-hidden="true" />
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Operating limits</span>
      </div>
      <dl className="grid flex-1 grid-cols-2 gap-x-4 gap-y-5 content-center">
        {facts.map((fact) => (
          <div key={fact.label}>
            <dt className="font-pixel text-3xl leading-none">{fact.value}</dt>
            <dd className="mt-2 text-[10px] leading-4 text-muted-foreground">{fact.label}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
