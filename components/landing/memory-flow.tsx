const SOURCES = ['Claude Code', 'Cursor', 'Browser agent']
const SINKS = ['Recall', 'Handoff', 'Presence']

// Square nodes and hard right angles. Pure SVG so it paints server-side with no hydration step.
export function MemoryFlow() {
  return (
    <svg viewBox="0 0 640 200" className="w-full" role="img" aria-label="Agents write context into Mindstate and read it back on the next run">
      <g stroke="currentColor" strokeWidth={1.5} fill="none">
        {SOURCES.map((_, index) => {
          const y = 40 + index * 60
          return <path key={index} d={`M 168 ${y} H 250 V 100 H 280`} />
        })}
        {SINKS.map((_, index) => {
          const y = 40 + index * 60
          return <path key={index} d={`M 360 100 H 390 V ${y} H 472`} />
        })}
      </g>

      {SOURCES.map((label, index) => {
        const y = 40 + index * 60
        return (
          <g key={label}>
            <rect x={20} y={y - 13} width={148} height={26} fill="none" stroke="currentColor" strokeWidth={1.5} />
            <text x={94} y={y + 4} textAnchor="middle" fontSize={10} fill="currentColor" letterSpacing="0.08em" className="uppercase">
              {label}
            </text>
          </g>
        )
      })}

      <g>
        <rect x={280} y={78} width={80} height={44} className="fill-foreground" />
        <text x={320} y={104} textAnchor="middle" fontSize={10} letterSpacing="0.12em" className="fill-background uppercase">
          Store
        </text>
      </g>

      {SINKS.map((label, index) => {
        const y = 40 + index * 60
        return (
          <g key={label}>
            <rect x={472} y={y - 13} width={148} height={26} fill="none" stroke="currentColor" strokeWidth={1.5} />
            <text x={546} y={y + 4} textAnchor="middle" fontSize={10} fill="currentColor" letterSpacing="0.08em" className="uppercase">
              {label}
            </text>
          </g>
        )
      })}

      {/* Every source feeds the store and the store feeds every sink. Animating one path each way
          read as a single pulse pairing one agent to one capability, which is not what happens. */}
      <g className="motion-reduce:hidden">
        {SOURCES.map((label, index) => (
          <rect key={`in-${label}`} x={-3} y={-3} width={6} height={6} className="fill-brand">
            <animateMotion
              dur="2.4s"
              begin={`${index * 0.35}s`}
              repeatCount="indefinite"
              path={`M 168 ${40 + index * 60} H 250 V 100 H 280`}
            />
          </rect>
        ))}
        {SINKS.map((label, index) => (
          <rect key={`out-${label}`} x={-3} y={-3} width={6} height={6} className="fill-brand">
            <animateMotion
              dur="2.4s"
              begin={`${1.2 + index * 0.35}s`}
              repeatCount="indefinite"
              path={`M 360 100 H 390 V ${40 + index * 60} H 472`}
            />
          </rect>
        ))}
      </g>
    </svg>
  )
}
