export interface TimeSeriesPoint {
  year: number
  value: number
}

export interface Indicator {
  id: string
  label: string
  description: string
  unit: string
  source: string
  timeSeries: TimeSeriesPoint[]
  mapSeries?: Record<string, Record<string, number>>
  byMunicipio?: Record<string, number>
  latestValue?: number
  delta?: number
  deltaDirection?: 'up' | 'down' | 'neutral'
}

export interface IndicatorGroup {
  id: string
  label: string
  indicators: Indicator[]
}

export interface IndicatorSection {
  id: string
  label: string
  lastUpdated: string
  groups: IndicatorGroup[]
}
