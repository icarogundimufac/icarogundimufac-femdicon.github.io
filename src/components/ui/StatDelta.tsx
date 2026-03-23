import { cn } from '@/lib/utils/cn'

interface StatDeltaProps {
  delta: number
  deltaDirection?: 'up' | 'down' | 'neutral'
  positiveDirection?: 'up' | 'down'
  unit?: string
  className?: string
}

export function StatDelta({
  delta,
  deltaDirection,
  positiveDirection = 'up',
  unit = '',
  className,
}: StatDeltaProps) {
  const direction = deltaDirection ?? (delta > 0 ? 'up' : delta < 0 ? 'down' : 'neutral')
  const isPositive = direction === positiveDirection
  const isNeutral = direction === 'neutral'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-semibold font-jakarta',
        isNeutral ? 'text-areia-500' : isPositive ? 'text-verde-600' : 'text-estrela-500',
        className,
      )}
    >
      {!isNeutral && (
        <svg
          viewBox="0 0 16 16"
          className={cn('w-3 h-3', direction === 'down' && 'rotate-180')}
          fill="currentColor"
        >
          <path d="M8 3l5 8H3z" />
        </svg>
      )}
      {delta > 0 ? '+' : ''}{delta.toFixed(1)}{unit}
      <span className="font-normal text-areia-400">vs. ano ant.</span>
    </span>
  )
}
