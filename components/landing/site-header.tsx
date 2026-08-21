'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Braces } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const links = [
  { href: '#enroll', label: 'Enroll' },
  { href: '#memory', label: 'Memory' },
  { href: '#flow', label: 'Flow' },
  { href: '#platform', label: 'Platform' },
]

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b border-transparent transition-colors duration-300',
        scrolled && 'border-border bg-background/80 backdrop-blur-md',
      )}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6" aria-label="Main navigation">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Mindstate home">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Braces className="size-4" aria-hidden="true" />
          </span>
          <span className="text-sm font-semibold tracking-tight">Mindstate</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/sign-in" />}>
            Sign in
          </Button>
          <Button size="sm" nativeButton={false} render={<Link href="/sign-up" />}>
            Get started
          </Button>
        </div>
      </nav>
    </header>
  )
}
