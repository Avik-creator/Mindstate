import { cn } from '@/lib/utils'

// Scroll-driven reveal handled entirely in CSS, so content is present in the server-rendered markup.
export function Reveal({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('reveal', className)}>{children}</div>
}
