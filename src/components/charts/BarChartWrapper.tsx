'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatNumber } from '@/lib/utils/format'

interface DataPoint {
  label: string
  value: number
  [key: string]: string | number
}

export interface BarChartWrapperProps {
  data: DataPoint[]
  color?: string
  unit?: string
  height?: number
  horizontal?: boolean
  showLegend?: boolean
}

const BRAND_COLORS = ['#229157', '#0f5b36', '#44b375', '#7bd09e', '#c0392b', '#e74c3c']

interface TooltipContentProps {
  active?: boolean
  payload?: Array<{ payload: DataPoint }>
}

function TooltipCard({ active, payload, unit }: TooltipContentProps & { unit?: string }) {
  if (!active || !payload?.length) return null

  const datum = payload[0]?.payload

  if (!datum) return null

  return (
    <div className="bg-verde-900 text-white rounded-lg px-3 py-2 shadow-xl text-xs font-jakarta">
      <p className="font-semibold text-areia-200 mb-1">{datum.label}</p>
      <p className="text-white tabular-nums">
        {formatNumber(datum.value)}
        {unit ? ` ${unit}` : ''}
      </p>
    </div>
  )
}

function VerticalChart({
  data,
  color,
  unit,
}: {
  data: DataPoint[]
  color: string
  unit: string
}) {
  return (
    <BarChart data={data} margin={{ top: 16, right: 12, bottom: 32, left: 24 }}>
      <CartesianGrid stroke="#e8e6dc" strokeDasharray="3 3" vertical={false} />
      <XAxis
        dataKey="label"
        tick={{ fill: '#8c8472', fontSize: 11, fontFamily: 'var(--font-jakarta)' }}
        axisLine={false}
        tickLine={false}
        dy={8}
      />
      <YAxis
        tickFormatter={(value: number) => formatNumber(value)}
        tick={{ fill: '#8c8472', fontSize: 11, fontFamily: 'var(--font-jakarta)' }}
        axisLine={false}
        tickLine={false}
        width={56}
      />
      <Tooltip cursor={{ fill: '#f5f1e7' }} content={<TooltipCard unit={unit} />} />
      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
        {data.map((datum, index) => (
          <Cell
            key={datum.label}
            fill={BRAND_COLORS[index % BRAND_COLORS.length] ?? color}
          />
        ))}
      </Bar>
    </BarChart>
  )
}

function HorizontalChart({
  data,
  color,
  unit,
}: {
  data: DataPoint[]
  color: string
  unit: string
}) {
  return (
    <BarChart
      data={data}
      layout="vertical"
      margin={{ top: 8, right: 20, bottom: 16, left: 84 }}
    >
      <CartesianGrid stroke="#e8e6dc" strokeDasharray="3 3" horizontal={false} />
      <XAxis
        type="number"
        tickFormatter={(value: number) => formatNumber(value)}
        tick={{ fill: '#8c8472', fontSize: 11, fontFamily: 'var(--font-jakarta)' }}
        axisLine={false}
        tickLine={false}
      />
      <YAxis
        type="category"
        dataKey="label"
        tick={{ fill: '#514b40', fontSize: 11, fontFamily: 'var(--font-jakarta)' }}
        axisLine={false}
        tickLine={false}
        width={110}
      />
      <Tooltip cursor={{ fill: '#f5f1e7' }} content={<TooltipCard unit={unit} />} />
      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
        {data.map((datum, index) => (
          <Cell
            key={datum.label}
            fill={BRAND_COLORS[index % BRAND_COLORS.length] ?? color}
          />
        ))}
      </Bar>
    </BarChart>
  )
}

export function BarChartWrapper({
  data,
  color = '#229157',
  unit = '',
  height = 280,
  horizontal = false,
}: BarChartWrapperProps) {
  if (data.length === 0) return null

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {horizontal ? (
          <HorizontalChart data={data} color={color} unit={unit} />
        ) : (
          <VerticalChart data={data} color={color} unit={unit} />
        )}
      </ResponsiveContainer>
    </div>
  )
}
