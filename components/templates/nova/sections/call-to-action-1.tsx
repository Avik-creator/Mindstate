import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

export default function CallToAction() {
  return (
    <section className="bg-background @container py-24">
      <div className="mx-auto max-w-2xl px-6">
        <div className="text-center">
          <h2 className="text-balance font-serif text-4xl font-medium">
            Give your next agent the full story.
          </h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-md text-balance">
            Create one private workspace, connect your first coding agent, and let every handoff carry the context forward.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button className="pr-1.5" render={<Link href="/sign-up" />} nativeButton={false}><span>Create your workspace</span><ChevronRight className="opacity-50" /></Button>
            <Button variant="secondary" render={<Link href="/sign-in" />} nativeButton={false}>Sign in</Button>
          </div>
        </div>
      </div>
    </section>
  );
}
