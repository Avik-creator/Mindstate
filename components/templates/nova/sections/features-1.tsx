import { Card } from "@/components/ui/card";
import { Bot, BrainCircuit, Code2, Database, Shield, Terminal } from "lucide-react";

export default function Features() {
  return (
    <section id="features" className="bg-background @container py-24">
      <div className="mx-auto max-w-3xl px-6">
        <div><h2 className="text-balance font-serif text-4xl font-medium">One memory. Every agent.</h2><p className="text-muted-foreground mt-4 text-balance">Start in OpenCode, continue in Codex, and return in Claude Code without rebuilding the story from scratch.</p></div>
        <div className="@xl:grid-cols-2 mt-12 grid gap-3 *:p-6">
          <Card className="row-span-2 grid grid-rows-subgrid">
            <div className="flex flex-col gap-2"><h3 className="text-foreground font-medium">Agents connect independently</h3><p className="text-muted-foreground text-sm">Each agent gets its own identity and key while sharing your owner-scoped workspace.</p></div>
            <div aria-hidden className="flex h-44 flex-col justify-between pt-8">
              {[[Terminal,"OpenCode"],[Code2,"Codex"],[Bot,"Claude Code"]].map(([Icon,label]) => { const AgentIcon = Icon as typeof Terminal; return <div key={label as string} className="relative flex h-10 items-center justify-between px-6"><div className="bg-border absolute inset-0 my-auto h-px"/><div className="bg-card ring-border relative flex h-8 items-center gap-2 rounded-full px-3 shadow-sm ring"><AgentIcon className="size-3.5"/><span className="text-xs">{label as string}</span></div><div className="bg-card ring-border relative flex size-8 items-center justify-center rounded-full shadow-sm ring"><BrainCircuit className="size-3.5"/></div></div>})}
            </div>
          </Card>
          <Card className="row-span-2 grid grid-rows-subgrid overflow-hidden"><div className="flex flex-col gap-2"><h3 className="text-foreground font-medium">Context moves in real time</h3><p className="text-muted-foreground text-sm">Memories, project state, sessions, and handoffs stay available to the next tool.</p></div><div aria-hidden className="relative h-44 translate-y-6"><div className="bg-foreground/15 absolute inset-0 mx-auto w-px"/><div className="absolute -inset-x-16 top-6 aspect-square rounded-full border"/><div className="border-primary mask-l-from-50% mask-l-to-90% mask-r-from-50% mask-r-to-50% absolute -inset-x-16 top-6 aspect-square rounded-full border"/><div className="absolute -inset-x-8 top-24 aspect-square rounded-full border"/><div className="border-primary mask-r-from-50% mask-r-to-90% mask-l-from-50% mask-l-to-50% absolute -inset-x-8 top-24 aspect-square rounded-full border"/></div></Card>
          <Card className="row-span-2 grid grid-rows-subgrid overflow-hidden"><div className="flex flex-col gap-2"><h3 className="text-foreground font-medium">Built for agent workflows</h3><p className="text-muted-foreground text-sm">MCP and REST tools let agents search, save, start sessions, and leave structured handoffs.</p></div><div aria-hidden className="flex h-44 items-end justify-between pb-6 pt-12">{Array.from({length:24}).map((_,i)=><div key={i} className={`w-px ${[4,9,13,18,23].includes(i)?"h-full bg-primary":"h-2/3 bg-foreground/15"}`}/>)}</div></Card>
          <Card className="row-span-2 grid grid-rows-subgrid"><div className="flex flex-col gap-2"><h3 className="font-medium">Private by design</h3><p className="text-muted-foreground text-sm">Agent keys resolve to your workspace and can be scoped or revoked independently.</p></div><div className="pointer-events-none relative -ml-7 flex size-44 items-center justify-center pt-5"><Shield className="absolute inset-0 top-2.5 size-full stroke-[0.1px] opacity-15"/><Database className="size-24 stroke-[0.4px]"/></div></Card>
        </div>
      </div>
    </section>
  );
}
