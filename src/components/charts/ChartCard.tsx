import { cn } from '@/lib/utils/cn'
import { Card } from '@/components/ui/Card'

interface ChartCardProps {
  title: string
  subtitle?: string
  source?: string
  children: React.ReactNode
  className?: string
  action?: React.ReactNode
}

export function ChartCard({
  title,
  subtitle,
  source,
  children,
  className,
  action,
}: ChartCardProps) {
  return (
    <Card className={cn('overflow-hidden animate-fade-in', className)}>
      <div className="px-6 pt-5 pb-4 border-b border-areia-100 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-verde-900 font-fraunces">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-areia-400 font-jakarta">{subtitle}</p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>

      <div className="p-6">{children}</div>

      {source && (
        <div className="px-6 pb-4">
          <p className="text-[10px] text-areia-400 font-jakarta">
            Fonte: {source}
          </p>
        </div>
      )}
    </Card>
  )
}
