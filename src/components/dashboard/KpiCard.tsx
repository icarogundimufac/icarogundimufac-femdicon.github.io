import { cn } from '@/lib/utils/cn'
import { StatDelta } from '@/components/ui/StatDelta'
import { SectionTag } from '@/components/ui/SectionTag'
import type { KpiData } from '@/types/dashboard'

type KpiCardKpi = KpiData & { positiveDirection?: 'up' | 'down' }

interface KpiCardProps {
  kpi: KpiCardKpi
  className?: string
}

const SECTION_ACCENT_BG: Record<string, string> = {
  educacao: 'bg-blue-400',
  saude: 'bg-emerald-400',
  seguranca: 'bg-orange-400',
  orcamento: 'bg-amber-400',
  municipios: 'bg-purple-400',
  default: 'bg-verde-400',
}

export function KpiCard({ kpi, className }: KpiCardProps) {
  const accentBg = SECTION_ACCENT_BG[kpi.section] ?? SECTION_ACCENT_BG.default

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-areia-200 shadow-sm pt-0 overflow-hidden',
        'transition-shadow duration-200 hover:shadow-md',
        'animate-slide-up',
        className,
      )}
    >
      {/* Top accent bar */}
      <div className={cn('h-1 w-full', accentBg)} />

      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <SectionTag section={kpi.section} />
          <span className="text-[11px] text-areia-400 font-jakarta">{kpi.year}</span>
        </div>

        <p className="text-xs font-medium text-areia-500 font-jakarta mb-1 leading-tight">
          {kpi.label}
        </p>

        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-bold text-verde-900 font-fraunces tabular-nums">
            {typeof kpi.value === 'number'
              ? kpi.value.toLocaleString('pt-BR')
              : kpi.value}
          </span>
          {kpi.unit && (
            <span className="text-sm text-areia-400 font-jakarta">{kpi.unit}</span>
          )}
        </div>

        {kpi.delta !== undefined && (
          <div className="mt-2">
            <StatDelta
              delta={kpi.delta}
              deltaDirection={kpi.deltaDirection}
              positiveDirection={kpi.positiveDirection}
            />
          </div>
        )}
      </div>
    </div>
  )
}
