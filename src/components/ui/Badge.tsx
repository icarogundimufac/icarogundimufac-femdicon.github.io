import { cn } from '@/lib/utils/cn'

type BadgeVariant = 'default' | 'green' | 'red' | 'amber' | 'blue' | 'outline'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-areia-100 text-areia-700 border-areia-200',
  green: 'bg-verde-100 text-verde-700 border-verde-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  outline: 'bg-transparent text-areia-600 border-areia-300',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold border font-jakarta tracking-wide',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
