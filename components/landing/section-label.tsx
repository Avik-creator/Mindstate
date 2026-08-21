// Numbered rule used to head every chapter, in the template's engineering-log idiom.
export function SectionLabel({ label, index }: { label: string; index: string }) {
  return (
    <div className="mb-8 flex items-center gap-4">
      <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{`// ${label}`}</span>
      <div className="h-px flex-1 bg-border" />
      <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{index}</span>
    </div>
  )
}
