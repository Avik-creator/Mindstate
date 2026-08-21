const states = [
  { name: 'Live', detail: 'Heartbeat within 90 seconds', bar: 'w-full', tone: 'bg-brand' },
  { name: 'Stale', detail: 'Agent stopped or disconnected', bar: 'w-1/2', tone: 'bg-foreground' },
  { name: 'Completed', detail: 'Session closed by the agent', bar: 'w-1/4', tone: 'bg-muted-foreground' },
]

export function StatusCard() {
  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-4 flex items-center gap-2">
        <span className="relative flex size-2" aria-hidden="true">
          <span className="absolute inline-flex size-full animate-ping bg-brand opacity-60 motion-reduce:hidden" />
          <span className="relative inline-flex size-2 bg-brand" />
        </span>
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Session presence</span>
      </div>
      <ul className="flex flex-1 flex-col justify-center gap-5">
        {states.map((state) => (
          <li key={state.name}>
            <div className="flex items-baseline justify-between">
              <span className="text-xs uppercase tracking-[0.15em]">{state.name}</span>
              <span className="text-[10px] text-muted-foreground">{state.detail}</span>
            </div>
            <div className="mt-2 h-1.5 w-full bg-muted">
              <div className={`h-full ${state.bar} ${state.tone}`} />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[10px] leading-5 text-muted-foreground">
        Derived from the heartbeat, so a crashed agent shows as stale rather than silently live.
      </p>
    </div>
  )
}
