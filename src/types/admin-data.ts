import type { DashboardData } from '@/types/dashboard'
import type { IndicatorSection } from '@/types/indicators'
import type { MunicipioDetail, MunicipioSummary } from '@/types/municipio'
import type { IndicatorSectionId } from '@/lib/constants/indicator-sections'

export interface PortalDataBundle {
  dashboard: DashboardData
  sections: Record<IndicatorSectionId, IndicatorSection>
  municipiosIndex: MunicipioSummary[]
  municipioDetails: Record<string, MunicipioDetail>
}

export interface EditableDashboardKpiRow {
  rowId: string
  id: string
  section: string
  label: string
  value: number | string
  unit: string
  delta: number | null
  deltaDirection: 'up' | 'down' | 'neutral' | ''
  positiveDirection: 'up' | 'down' | ''
  year: number
}

export interface EditableDashboardSummaryRow {
  rowId: string
  section: string
  headline: string
  value: string
  trend: string
}

export interface EditableIndicatorRow {
  rowId: string
  sectionId: IndicatorSectionId
  sectionLabel: string
  lastUpdated: string
  groupId: string
  groupLabel: string
  indicatorId: string
  indicatorLabel: string
  description: string
  unit: string
  source: string
  latestValue: number | null
  delta: number | null
  deltaDirection: 'up' | 'down' | 'neutral' | ''
  year: number
  value: number
}

export interface EditableMapRow {
  rowId: string
  sectionId: IndicatorSectionId
  sectionLabel: string
  groupId: string
  groupLabel: string
  indicatorId: string
  indicatorLabel: string
  unit: string
  source: string
  year: number
  municipioSlug: string
  value: number
}

export interface EditableMunicipalTemplateRow {
  rowId: string
  sectionId: IndicatorSectionId
  sectionLabel: string
  groupId: string
  groupLabel: string
  indicatorId: string
  indicatorLabel: string
  unit: string
  source: string
  year: number
  municipioSlug: string
  municipioNome: string
  value: number | ''
}

export interface EditableMunicipioSummaryRow {
  rowId: string
  slug: string
  nome: string
  populacao: number
  area: number
  regiaoJudiciaria: string
  distanciaCapital: number
  idhm: number
  lat: number
  lng: number
}

export interface EditableMunicipioIndicatorRow {
  rowId: string
  municipioSlug: string
  municipioNome: string
  section: string
  id: string
  label: string
  value: number
  unit: string
  year: number
}

export interface MapVariableOption {
  key: string
  sectionId: IndicatorSectionId
  sectionLabel: string
  groupId: string
  groupLabel: string
  indicatorId: string
  indicatorLabel: string
  unit: string
  source: string
  years: number[]
}

export interface PortalWorkbookSheets {
  dashboardKpis: EditableDashboardKpiRow[]
  dashboardSummaries: EditableDashboardSummaryRow[]
  indicators: EditableIndicatorRow[]
  mapRows: EditableMapRow[]
  municipios: EditableMunicipioSummaryRow[]
  municipioIndicators: EditableMunicipioIndicatorRow[]
}
