import { formatNumber } from '@/lib/utils/format'

interface MapLegendProps {
  min: number
  max: number
  unit?: string
  label?: string
  colors: string[]
  steps?: number
}

export function MapLegend({
  min,
  max,
  unit = '',
  label = '',
  colors,
  steps = 5,
}: MapLegendProps) {
  const gradient = `linear-gradient(to right, ${colors.join(', ')})`

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2.5 shadow-md border border-areia-200 min-w-[140px]">
      {label && (
        <p className="text-[10px] font-semibold text-areia-600 font-jakarta uppercase tracking-widest mb-2">
          {label}
        </p>
      )}
      <div
        className="h-2.5 rounded-full mb-1.5"
        style={{ background: gradient }}
      />
      <div className="flex justify-between">
        <span className="text-[10px] text-areia-500 font-jakarta tabular-nums">
          {formatNumber(min)}{unit ? ` ${unit}` : ''}
        </span>
        <span className="text-[10px] text-areia-500 font-jakarta tabular-nums">
          {formatNumber(max)}{unit ? ` ${unit}` : ''}
        </span>
      </div>
    </div>
  )
}
