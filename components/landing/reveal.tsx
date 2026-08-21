import { cn } from '@/lib/utils'

type RevealProps = {
  children: React.ReactNode
  className?: string
}

// CSS scroll-driven entrance. No JS, so content is never left invisible.
export function Reveal({ children, className }: RevealProps) {
  return <div className={cn('reveal', className)}>{children}</div>
}
