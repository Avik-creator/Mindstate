import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HeroHeader } from "./header";
import { ChevronRight, Bot, BrainCircuit, Code2, Terminal, Database, Sparkles, Workflow, Zap } from "lucide-react";
import Image from "next/image";

const agents = [
  { name: "OpenCode", icon: Terminal, blur: true },
  { name: "Codex", icon: Code2 },
  { name: "Claude Code", icon: Sparkles, blur: true },
  { name: "Cursor", icon: Zap },
  { name: "Mindstate", icon: BrainCircuit },
  { name: "Gemini CLI", icon: Bot },
  { name: "Projects", icon: Workflow, blur: true },
  { name: "Memory", icon: Database, blur: true },
];

export default function HeroSection() {
  return (
    <>
      <HeroHeader />
      <main className="overflow-hidden">
        <section className="bg-background">
          <div className="relative py-32 md:pt-44">
            <div className="mask-radial-from-45% mask-radial-to-75% mask-radial-at-top mask-radial-[75%_100%] mask-t-from-50% lg:aspect-9/4 absolute inset-0 aspect-square lg:top-24 dark:opacity-30 dark:invert">
              <Image src="https://images.unsplash.com/photo-1740516367177-ae20098c8786?q=80&w=2268&auto=format&fit=crop" alt="A quiet horizon representing continuous context" width={2268} height={1740} priority unoptimized className="size-full object-cover object-top" />
            </div>
            <div className="relative z-10 mx-auto w-full max-w-5xl px-6">
              <div className="mx-auto max-w-lg text-center">
                <h1 className="text-balance font-serif text-4xl font-medium sm:text-5xl">Your agents change. Their memory shouldn&apos;t.</h1>
                <p className="text-muted-foreground mt-4 text-balance">Mindstate gives OpenCode, Codex, Claude Code, and the next agent one private source of truth for every project, decision, and handoff.</p>
                <Button className="mt-6 pr-1.5" render={<Link href="/sign-up" />} nativeButton={false}><span className="text-nowrap">Start your Mindstate</span><ChevronRight className="opacity-50" /></Button>
              </div>
              <div className="mx-auto mt-24 max-w-xl">
                <div className="grid scale-95 grid-cols-3 gap-12">
                  {agents.map(({ name, icon: Icon, blur }, index) => <div key={name} className={`${index % 3 === 0 ? "ml-auto" : index % 3 === 1 ? "mx-auto" : "mr-auto"} ${blur ? "blur-[2px]" : ""}`}><Card className="shadow-foreground/10 flex h-8 w-fit flex-row items-center gap-2 rounded-xl px-3 sm:h-10 sm:px-4"><Icon className="size-4 shrink-0 text-foreground" /><span className="text-nowrap font-medium max-sm:text-xs">{name}</span></Card></div>)}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
