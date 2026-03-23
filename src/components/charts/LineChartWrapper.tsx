'use client'

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatNumber } from '@/lib/utils/format'

interface DataPoint {
  year: number
  value: number
  [key: string]: number | string
}

export interface LineChartWrapperProps {
  data: DataPoint[]
  color?: string
  unit?: string
  height?: number
  referenceValue?: number
  referenceLabel?: string
}

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
      <p className="font-semibold text-areia-200 mb-0.5">{datum.year}</p>
      <p className="text-white tabular-nums font-semibold">
        {formatNumber(datum.value)}
        {unit ? ` ${unit}` : ''}
      </p>
    </div>
  )
}

export function LineChartWrapper({
  data,
  color = '#229157',
  unit = '',
  height = 280,
  referenceValue,
  referenceLabel,
}: LineChartWrapperProps) {
  if (data.length === 0) return null

  const yMax = Math.max(
    ...data.map((datum) => datum.value),
    referenceValue ?? Number.NEGATIVE_INFINITY,
  )
  const yMin = Math.min(
    ...data.map((datum) => datum.value),
    referenceValue ?? Number.POSITIVE_INFINITY,
  )
  const domainPadding = Math.max((yMax - yMin) * 0.15, 1)

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 16, right: 20, bottom: 20, left: 24 }}
        >
          <CartesianGrid stroke="#e8e6dc" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="year"
            tick={{ fill: '#8c8472', fontSize: 11, fontFamily: 'var(--font-jakarta)' }}
            axisLine={false}
            tickLine={false}
            dy={8}
          />
          <YAxis
            domain={[Math.max(0, yMin - domainPadding), yMax + domainPadding]}
            tickFormatter={(value: number) => formatNumber(value)}
            tick={{ fill: '#8c8472', fontSize: 11, fontFamily: 'var(--font-jakarta)' }}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <Tooltip
            cursor={{ stroke: '#d7d1c3', strokeDasharray: '4 4' }}
            content={<TooltipCard unit={unit} />}
          />
          {referenceValue !== undefined && (
            <ReferenceLine
              y={referenceValue}
              stroke="#c0392b"
              strokeDasharray="4 4"
              ifOverflow="extendDomain"
              label={
                referenceLabel
                  ? {
                      value: referenceLabel,
                      position: 'insideTopRight',
                      fill: '#c0392b',
                      fontSize: 10,
                    }
                  : undefined
              }
            />
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.5}
            dot={{ r: 4, fill: color, stroke: '#fff', strokeWidth: 2 }}
            activeDot={{ r: 5, fill: color, stroke: '#fff', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
