import { notFound } from 'next/navigation'

// Source for public/mindstate-og.png. Screenshot this at 1200x630 to regenerate it.
// Development only, so regenerating stays possible without shipping a live marketing route.
export default function OgPreview() {
  if (process.env.NODE_ENV === 'production') notFound()

  return (
    <div className="dot-grid-bg flex h-[630px] w-[1200px] flex-col justify-between bg-background p-14 text-foreground">
      {/* The dev overlay would otherwise be baked into the captured image. */}
      <style>{'nextjs-portal{display:none!important}'}</style>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="flex size-11 items-center justify-center bg-foreground text-xl text-background">{'{}'}</span>
          <span className="text-xl font-bold uppercase tracking-[0.18em]">Mindstate</span>
        </div>
        <span className="text-sm uppercase tracking-[0.25em] text-muted-foreground">{'// PRIVATE AGENT MEMORY'}</span>
      </div>

      <div>
        <p className="font-pixel text-[86px] leading-[1.05] tracking-tight">AGENTS FORGET.</p>
        <p className="font-pixel text-[86px] leading-[1.05] tracking-tight">THIS REMEMBERS.</p>
      </div>

      <div className="flex items-end justify-between">
        <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
          Durable memory, live session presence, and clean handoffs for every coding, research,
          and browser agent you run.
        </p>
        <div className="flex items-center gap-3">
          <span className="size-4 bg-brand" />
          <span className="text-sm uppercase tracking-[0.25em]">REST · MCP</span>
        </div>
      </div>
    </div>
  )
}
