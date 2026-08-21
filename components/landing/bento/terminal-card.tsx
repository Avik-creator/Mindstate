const lines = [
  { prompt: '$', text: 'curl -X POST $HOST/api/v1/agents/bootstrap \\' },
  { prompt: ' ', text: '  -d \'{"token":"ONE_TIME_TOKEN"}\'' },
  { prompt: '>', text: '{ "apiKey": "tb_live_…", "scopes": [9] }', tone: 'brand' as const },
  { prompt: '$', text: 'curl $HOST/api/v1/memories?q=deploy' },
  { prompt: '>', text: '3 memories · ranked · stem-matched', tone: 'dim' as const },
]

export function TerminalCard() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b-2 border-foreground px-4 py-2">
        <span className="size-2 bg-brand" aria-hidden="true" />
        <span className="size-2 bg-foreground" aria-hidden="true" />
        <span className="size-2 bg-muted-foreground" aria-hidden="true" />
        <span className="ml-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Enrollment</span>
      </div>

      <pre className="flex-1 overflow-x-auto bg-foreground p-4 text-[11px] leading-6 text-background">
        <code>
          {lines.map((line, index) => (
            <div key={index} className="whitespace-pre">
              <span className="text-background/50">{line.prompt} </span>
              <span className={line.tone === 'brand' ? 'text-brand' : line.tone === 'dim' ? 'text-background/60' : undefined}>
                {line.text}
              </span>
            </div>
          ))}
          <div>
            <span className="text-background/50">$ </span>
            <span className="inline-block h-3.5 w-2 translate-y-0.5 animate-blink bg-background" aria-hidden="true" />
          </div>
        </code>
      </pre>

      <p className="border-t-2 border-foreground px-4 py-3 text-[10px] leading-5 text-muted-foreground">
        One-time token, redeemed once, exchanged for a scoped key. The owner never hands over a password.
      </p>
    </div>
  )
}
