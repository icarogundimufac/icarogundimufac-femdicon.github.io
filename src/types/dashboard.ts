export interface KpiData {
  id: string
  section: string
  label: string
  value: number | string
  unit: string
  delta?: number
  deltaDirection?: 'up' | 'down' | 'neutral'
  year: number
  positiveDirection?: 'up' | 'down'
}

export interface SectionTrend {
  section: string
  headline: string
  value: string
  trend: number[]
}

export interface DashboardData {
  lastUpdated: string
  kpis: KpiData[]
  sectionSummaries: SectionTrend[]
}
