export default function Content() {
  return (
    <section className="bg-background @container py-24">
      <div className="@2xl:grid-cols-2 mx-auto grid max-w-3xl gap-6 px-6">
        <h2 className="text-balance font-serif text-4xl font-medium">
          Pick up exactly where the last agent stopped
        </h2>

        <div className="flex flex-col gap-6">
          <p className="text-muted-foreground"><span className="text-foreground font-medium">OpenCode explores.</span>{" "}It saves the decisions, constraints, and unresolved questions that matter.</p>
          <p className="text-muted-foreground"><span className="text-foreground font-medium">Codex continues.</span>{" "}It searches the same project memory and resumes with the full context intact.</p>
          <p className="text-muted-foreground"><span className="text-foreground font-medium">You stay in control.</span>{" "}Every agent has a separate identity, while your private Mindstate remains the source of truth.</p>
        </div>
      </div>
    </section>
  );
}
