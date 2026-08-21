import Link from 'next/link'
import { Braces } from 'lucide-react'

const links = [
  { label: 'Memory', href: '#memory' },
  { label: 'Agents', href: '#agents' },
  { label: 'Protocol', href: '#protocol' },
  { label: 'Guide', href: '/skill.md' },
]

export function SiteHeader() {
  return (
    <div className="w-full px-4 pt-4 lg:px-6 lg:pt-6">
      <nav className="w-full border border-foreground/20 bg-background/80 px-6 py-3 backdrop-blur-sm lg:px-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Braces size={16} strokeWidth={1.5} aria-hidden="true" />
            <span className="text-xs font-bold uppercase tracking-[0.15em]">Mindstate</span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-xs uppercase tracking-widest text-muted-foreground transition-colors duration-200 hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/sign-in"
              className="hidden text-xs uppercase tracking-widest text-muted-foreground transition-colors duration-200 hover:text-foreground sm:block"
            >
              Log in
            </Link>
            <Link
              href="/sign-up"
              className="bg-foreground px-4 py-2 text-xs uppercase tracking-widest text-background transition-transform duration-150 hover:-translate-y-px"
            >
              Create workspace
            </Link>
          </div>
        </div>
      </nav>
    </div>
  )
}
