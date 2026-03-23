import { cn } from '@/lib/utils/cn'

interface PageShellProps {
  children: React.ReactNode
  className?: string
}

export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className={cn('min-h-screen bg-areia-100', className)}>
      {children}
    </div>
  )
}

export function PageContent({ children, className }: PageShellProps) {
  return (
    <div className={cn('px-8 pt-8 pb-12', className)}>
      {children}
    </div>
  )
}
