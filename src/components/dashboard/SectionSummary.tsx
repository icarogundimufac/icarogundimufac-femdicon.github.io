import { useQueryClient } from '@tanstack/react-query'
import {
  BookOpen,
  HeartPulse,
  Landmark,
  Shield,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils/cn'
import type { SectionTrend } from '@/types/dashboard'
import { SECTIONS } from '@/lib/constants/sections'
import { prefetchPathData } from '@/lib/data/client'

interface SectionSummaryProps {
  summary: SectionTrend
  className?: string
}

const MINI_CHART_HEIGHT = 32
const MINI_CHART_WIDTH = 80

const SECTION_ICONS: Record<string, LucideIcon> = {
  'book-open': BookOpen,
  'heart-pulse': HeartPulse,
  shield: Shield,
  landmark: Landmark,
}

function MiniSparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * MINI_CHART_WIDTH
    const y = MINI_CHART_HEIGHT - ((value - min) / range) * MINI_CHART_HEIGHT
    return `${x},${y}`
  })

  const lastX = (MINI_CHART_WIDTH / (values.length - 1)) * (values.length - 1)
  const lastY =
    MINI_CHART_HEIGHT -
    ((values[values.length - 1] - min) / range) * MINI_CHART_HEIGHT

  return (
    <svg
      viewBox={`0 0 ${MINI_CHART_WIDTH} ${MINI_CHART_HEIGHT}`}
      className="w-20 h-8 overflow-visible"
    >
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-70"
      />
      <circle
        cx={lastX}
        cy={lastY}
        r="2.5"
        fill="currentColor"
        className="opacity-90"
      />
    </svg>
  )
}

export function SectionSummary({ summary, className }: SectionSummaryProps) {
  const queryClient = useQueryClient()
  const meta = SECTIONS.find((section) => section.id === summary.section)

  if (!meta) return null

  const SectionIcon = SECTION_ICONS[meta.icon]

  const handlePrefetch = () => {
    void prefetchPathData(queryClient, meta.href)
  }

  return (
    <Link to={meta.href} onMouseEnter={handlePrefetch} onFocus={handlePrefetch}>
      <div
        className={cn(
          'bg-white rounded-xl border border-areia-200 p-5 cursor-pointer',
          'transition-all duration-200 hover:shadow-md hover:border-areia-300 hover:-translate-y-0.5',
          'animate-slide-up',
          className,
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={cn(
                  'inline-flex h-7 w-7 items-center justify-center rounded-lg border border-black/5',
                  meta.bgColor,
                  meta.color,
                )}
              >
                <SectionIcon className="h-4 w-4" strokeWidth={1.8} />
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-areia-400 font-jakarta">
                {meta.label}
              </span>
            </div>
            <p className="text-[11px] text-areia-500 font-jakarta mb-1 line-clamp-1">
              {summary.headline}
            </p>
            <p className="text-xl font-bold text-verde-900 font-fraunces">
              {summary.value}
            </p>
          </div>

          <div className={cn(meta.color, 'flex-shrink-0')}>
            <MiniSparkline values={summary.trend} />
          </div>
        </div>

        <div className="mt-3 flex items-center text-xs text-verde-600 font-jakarta font-medium">
          Ver indicadores
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </Link>
  )
}
