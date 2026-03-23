import {
  INDICATOR_SECTION_IDS,
  type IndicatorSectionId,
} from '@/lib/constants/indicator-sections'
import { portalDataClient } from '@/lib/data/client'
import type { PortalDataBundle, MapVariableOption } from '@/types/admin-data'
import type { DashboardData } from '@/types/dashboard'
import type { Indicator, IndicatorSection } from '@/types/indicators'
import type { MunicipioDetail, MunicipioSummary } from '@/types/municipio'

export const DEFAULT_MAP_VARIABLE_KEY = 'educacao::desempenho::ideb_municipios'

function getCurrentDateLabel() {
  return new Date().toISOString().slice(0, 10)
}

function buildEmptyDashboard(): DashboardData {
  return {
    lastUpdated: getCurrentDateLabel(),
    kpis: [],
    sectionSummaries: [],
  }
}

function buildDefaultMunicipioDetail(summary: MunicipioSummary): MunicipioDetail {
  return {
    ...summary,
    indicadores: [],
  }
}

export function buildMapVariableKey(
  sectionId: string,
  groupId: string,
  indicatorId: string,
) {
  return `${sectionId}::${groupId}::${indicatorId}`
}

export function parseMapVariableKey(key: string) {
  const [sectionId, groupId, indicatorId] = key.split('::')

  return {
    sectionId: sectionId as IndicatorSectionId,
    groupId,
    indicatorId,
  }
}

export function getSectionFallbackMapYear(section: IndicatorSection) {
  const years = section.groups.flatMap((group) =>
    group.indicators.flatMap((indicator) =>
      indicator.timeSeries.map((point) => point.year),
    ),
  )

  if (years.length > 0) return Math.max(...years)

  const yearFromLastUpdated = Number(section.lastUpdated?.slice(0, 4))
  return Number.isFinite(yearFromLastUpdated) && yearFromLastUpdated > 0
    ? yearFromLastUpdated
    : new Date().getFullYear()
}

function sortMapSeriesYears(
  mapSeries: Record<string, Record<string, number>>,
) {
  return Object.fromEntries(
    Object.entries(mapSeries).sort(
      ([leftYear], [rightYear]) => Number(leftYear) - Number(rightYear),
    ),
  )
}

export function getIndicatorMapSeries(
  indicator: Indicator,
  fallbackYear: number,
) {
  if (indicator.mapSeries && Object.keys(indicator.mapSeries).length > 0) {
    return sortMapSeriesYears(indicator.mapSeries)
  }

  if (indicator.byMunicipio && Object.keys(indicator.byMunicipio).length > 0) {
    return {
      [String(fallbackYear)]: indicator.byMunicipio,
    }
  }

  return undefined
}

export function getIndicatorLatestMapYear(
  indicator: Indicator,
  fallbackYear: number,
) {
  const mapSeries = getIndicatorMapSeries(indicator, fallbackYear)

  if (!mapSeries) return null

  return Math.max(...Object.keys(mapSeries).map(Number))
}

export function getIndicatorLatestByMunicipio(
  indicator: Indicator,
  fallbackYear: number,
) {
  const mapSeries = getIndicatorMapSeries(indicator, fallbackYear)

  if (!mapSeries) return indicator.byMunicipio

  const latestYear = getIndicatorLatestMapYear(indicator, fallbackYear)

  if (latestYear === null) return indicator.byMunicipio

  return mapSeries[String(latestYear)] ?? indicator.byMunicipio
}

export function normalizeIndicatorSection(section: IndicatorSection): IndicatorSection {
  const fallbackYear = getSectionFallbackMapYear(section)

  return {
    ...section,
    groups: section.groups.map((group) => ({
      ...group,
      indicators: group.indicators.map((indicator) => {
        const mapSeries = getIndicatorMapSeries(indicator, fallbackYear)

        return {
          ...indicator,
          mapSeries,
          byMunicipio: getIndicatorLatestByMunicipio(indicator, fallbackYear),
        }
      }),
    })),
  }
}

function normalizeMunicipioDetails(
  municipiosIndex: MunicipioSummary[],
  municipioDetails: Record<string, MunicipioDetail>,
) {
  const entries = municipiosIndex.map((summary) => {
    const current = municipioDetails[summary.slug] ?? buildDefaultMunicipioDetail(summary)

    return [
      summary.slug,
      {
        ...summary,
        ...current,
        indicadores: [...(current.indicadores ?? [])],
      },
    ] as const
  })

  return Object.fromEntries(entries)
}

export async function loadPortalDataBundle(): Promise<PortalDataBundle> {
  const [dashboard, municipiosIndex, ...sectionPayloads] = await Promise.all([
    portalDataClient.getDashboard(),
    portalDataClient.getMunicipios(),
    ...INDICATOR_SECTION_IDS.map((sectionId) => portalDataClient.getSection(sectionId)),
  ])

  const sectionEntries = sectionPayloads.map((section, index) => [
    INDICATOR_SECTION_IDS[index],
    normalizeIndicatorSection(
      section ?? {
        id: INDICATOR_SECTION_IDS[index],
        label: INDICATOR_SECTION_IDS[index],
        lastUpdated: getCurrentDateLabel(),
        groups: [],
      },
    ),
  ]) as Array<[IndicatorSectionId, IndicatorSection]>

  const municipioDetailsList = await Promise.all(
    municipiosIndex.map(async (municipio) => {
      const detail = await portalDataClient.getMunicipio(municipio.slug)
      return [
        municipio.slug,
        detail ?? buildDefaultMunicipioDetail(municipio),
      ] as const
    }),
  )

  return {
    dashboard: dashboard ?? buildEmptyDashboard(),
    sections: Object.fromEntries(sectionEntries) as Record<
      IndicatorSectionId,
      IndicatorSection
    >,
    municipiosIndex,
    municipioDetails: normalizeMunicipioDetails(
      municipiosIndex,
      Object.fromEntries(municipioDetailsList),
    ),
  }
}

export function getMapVariableOptions(bundle: PortalDataBundle): MapVariableOption[] {
  const municipioSlugs = new Set(bundle.municipiosIndex.map((municipio) => municipio.slug))

  return INDICATOR_SECTION_IDS.flatMap((sectionId) => {
    const section = bundle.sections[sectionId]
    const fallbackYear = getSectionFallbackMapYear(section)

    return section.groups.flatMap((group) =>
      group.indicators.flatMap((indicator) => {
        const mapSeries = getIndicatorMapSeries(indicator, fallbackYear)
        if (!mapSeries) return []

        const years = Object.entries(mapSeries)
          .filter(([, values]) =>
            Object.keys(values).some((slug) => municipioSlugs.has(slug)),
          )
          .map(([year]) => Number(year))
          .sort((left, right) => left - right)

        if (years.length === 0) return []

        return [
          {
            key: buildMapVariableKey(sectionId, group.id, indicator.id),
            sectionId,
            sectionLabel: section.label,
            groupId: group.id,
            groupLabel: group.label,
            indicatorId: indicator.id,
            indicatorLabel: indicator.label,
            unit: indicator.unit,
            source: indicator.source,
            years,
          },
        ]
      }),
    )
  }).sort((left, right) => left.indicatorLabel.localeCompare(right.indicatorLabel))
}

export function getMapVariableData(
  bundle: PortalDataBundle,
  variableKey: string,
  year: number,
) {
  const { sectionId, groupId, indicatorId } = parseMapVariableKey(variableKey)
  const section = bundle.sections[sectionId]
  const group = section?.groups.find((item) => item.id === groupId)
  const indicator = group?.indicators.find((item) => item.id === indicatorId)

  if (!section || !group || !indicator) {
    return {
      dataByMunicipio: {} as Record<string, number>,
      label: 'Indicador',
      unit: '',
      source: '',
    }
  }

  const fallbackYear = getSectionFallbackMapYear(section)
  const mapSeries = getIndicatorMapSeries(indicator, fallbackYear) ?? {}
  const availableYears = Object.keys(mapSeries).map(Number).sort((left, right) => left - right)
  const selectedYear = availableYears.includes(year)
    ? year
    : availableYears[availableYears.length - 1]

  return {
    dataByMunicipio: mapSeries[String(selectedYear)] ?? {},
    label: `${indicator.label.replace(/\s+\(\d{4}\)$/, '')} (${selectedYear})`,
    unit: indicator.unit,
    source: indicator.source,
  }
}
