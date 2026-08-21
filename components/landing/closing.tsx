import Link from 'next/link'
import { ArrowRight, Braces } from 'lucide-react'
import { Reveal } from '@/components/landing/reveal'

export function Closing() {
  return (
    <>
      <section className="w-full px-6 py-20 lg:px-12">
        <Reveal>
          <div className="border-2 border-foreground bg-foreground px-8 py-16 text-background lg:px-16 lg:py-20">
            <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
              <h2 className="font-pixel text-3xl tracking-tight sm:text-5xl lg:text-6xl">
                STOP RE-EXPLAINING.
              </h2>
              <p className="mt-6 max-w-md text-xs leading-relaxed text-background/70 lg:text-sm">
                Create a workspace, enroll your first agent, and let every run start from what the
                last one already knew.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/sign-up"
                  className="press group flex items-center bg-background text-sm uppercase tracking-wider text-foreground [--press-shadow:var(--background)]"
                >
                  <span className="flex size-10 items-center justify-center bg-brand text-brand-foreground">
                    <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
                  </span>
                  <span className="px-5 py-2.5">Create a workspace</span>
                </Link>
                <Link
                  href="/skill.md"
                  className="press border border-background px-5 py-2.5 text-sm uppercase tracking-wider [--press-shadow:var(--background)]"
                >
                  Read the agent guide
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="w-full border-t-2 border-foreground px-6 py-8 lg:px-12">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em]">
              <Braces size={14} strokeWidth={1.5} aria-hidden="true" />
              Mindstate
            </span>
            <span className="text-[10px] tracking-widest text-muted-foreground">
              PRIVATE AGENT MEMORY · SELF-HOSTABLE
            </span>
          </div>
          <nav className="flex flex-wrap items-center gap-6" aria-label="Footer">
            {[
              { label: 'Sign in', href: '/sign-in' },
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Agent guide', href: '/skill.md' },
              { label: 'GitHub', href: 'https://github.com/Avik-creator/Mindstate' },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="wipe text-[10px] uppercase tracking-widest text-muted-foreground transition-colors duration-200 hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </>
  )
}
