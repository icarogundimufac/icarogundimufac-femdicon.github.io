import { cn } from '@/lib/utils/cn'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-areia-200',
        className,
      )}
    />
  )
}

export function KpiSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-areia-200 p-6 space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-9 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

interface ChartSkeletonProps {
  className?: string
  heightClassName?: string
}

export function ChartSkeleton({
  className,
  heightClassName = 'h-56',
}: ChartSkeletonProps = {}) {
  return (
    <div className={cn('bg-white rounded-xl border border-areia-200 p-6', className)}>
      <Skeleton className="h-4 w-40 mb-6" />
      <Skeleton className={cn('w-full', heightClassName)} />
    </div>
  )
}
