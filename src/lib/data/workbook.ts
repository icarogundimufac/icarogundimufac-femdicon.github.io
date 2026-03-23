import JSZip from 'jszip'
import * as XLSX from 'xlsx'
import {
  INDICATOR_SECTION_IDS,
  type IndicatorSectionId,
} from '@/lib/constants/indicator-sections'
import { portalDataClient } from '@/lib/data/client'
import type {
  EditableDashboardKpiRow,
  EditableDashboardSummaryRow,
  EditableIndicatorRow,
  EditableMapRow,
  EditableMunicipalTemplateRow,
  EditableMunicipioIndicatorRow,
  EditableMunicipioSummaryRow,
  MapVariableOption,
  PortalDataBundle,
  PortalWorkbookSheets,
} from '@/types/admin-data'
import type { DashboardData } from '@/types/dashboard'
import type { Indicator, IndicatorGroup, IndicatorSection } from '@/types/indicators'
import type { MunicipioDetail, MunicipioSummary } from '@/types/municipio'

const WORKBOOK_SHEETS = {
  dashboardKpis: 'dashboard_kpis',
  dashboardSummaries: 'dashboard_summaries',
  indicators: 'indicadores',
  mapRows: 'mapa',
  municipios: 'municipios',
  municipioIndicators: 'municipio_indicadores',
} as const

const MUNICIPAL_TEMPLATE_SHEET = 'dados_municipais'
const MUNICIPAL_TEMPLATE_INSTRUCTIONS_SHEET = 'instrucoes'

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

function parseNumericValue(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string') {
    const sanitized = value.replace(/\./g, '').replace(',', '.').trim()
    if (sanitized === '') return 0
    const parsed = Number(sanitized)
    return Number.isFinite(parsed) ? parsed : 0
  }

  return 0
}

function parseIntegerValue(value: unknown) {
  return Math.max(0, Math.trunc(parseNumericValue(value)))
}

function toOptionalNumber(value: unknown) {
  if (value === '' || value === null || value === undefined) return null
  return parseNumericValue(value)
}

function toBlankableNumber(value: unknown) {
  if (value === '' || value === null || value === undefined) return ''
  return parseNumericValue(value)
}

function toStringValue(value: unknown) {
  return String(value ?? '').trim()
}

function normalizeDirection(
  value: unknown,
): 'up' | 'down' | 'neutral' | '' {
  const normalized = toStringValue(value) as 'up' | 'down' | 'neutral' | ''
  return ['up', 'down', 'neutral', ''].includes(normalized)
    ? normalized
    : ''
}

function normalizePositiveDirection(value: unknown): 'up' | 'down' | '' {
  const normalized = toStringValue(value) as 'up' | 'down' | ''
  return ['up', 'down', ''].includes(normalized) ? normalized : ''
}

function parseTrendValue(value: unknown) {
  return toStringValue(value)
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => Number(item.replace(',', '.')))
    .filter((item) => Number.isFinite(item))
}

function serializeTrendValue(values: number[]) {
  return values.join('|')
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

export function bundleToDashboardKpiRows(
  bundle: PortalDataBundle,
): EditableDashboardKpiRow[] {
  return bundle.dashboard.kpis.map((kpi) => ({
    rowId: kpi.id,
    id: kpi.id,
    section: kpi.section,
    label: kpi.label,
    value: kpi.value,
    unit: kpi.unit,
    delta: kpi.delta ?? null,
    deltaDirection: kpi.deltaDirection ?? '',
    positiveDirection: kpi.positiveDirection ?? '',
    year: kpi.year,
  }))
}

export function bundleToDashboardSummaryRows(
  bundle: PortalDataBundle,
): EditableDashboardSummaryRow[] {
  return bundle.dashboard.sectionSummaries.map((summary) => ({
    rowId: summary.section,
    section: summary.section,
    headline: summary.headline,
    value: summary.value,
    trend: serializeTrendValue(summary.trend),
  }))
}

export function bundleToIndicatorRows(
  bundle: PortalDataBundle,
): EditableIndicatorRow[] {
  return INDICATOR_SECTION_IDS.flatMap((sectionId) => {
    const section = bundle.sections[sectionId]

    return section.groups.flatMap((group) =>
      group.indicators.flatMap((indicator) =>
        indicator.timeSeries.map((point) => ({
          rowId: `${sectionId}::${group.id}::${indicator.id}::${point.year}`,
          sectionId,
          sectionLabel: section.label,
          lastUpdated: section.lastUpdated,
          groupId: group.id,
          groupLabel: group.label,
          indicatorId: indicator.id,
          indicatorLabel: indicator.label,
          description: indicator.description,
          unit: indicator.unit,
          source: indicator.source,
          latestValue:
            indicator.latestValue === undefined ? null : indicator.latestValue,
          delta: indicator.delta === undefined ? null : indicator.delta,
          deltaDirection: indicator.deltaDirection ?? '',
          year: point.year,
          value: point.value,
        })),
      ),
    )
  })
}

export function bundleToMapRows(
  bundle: PortalDataBundle,
): EditableMapRow[] {
  const municipioSlugs = new Set(bundle.municipiosIndex.map((municipio) => municipio.slug))

  return INDICATOR_SECTION_IDS.flatMap((sectionId) => {
    const section = bundle.sections[sectionId]
    const fallbackYear = getSectionFallbackMapYear(section)

    return section.groups.flatMap((group) =>
      group.indicators.flatMap((indicator) => {
        const mapSeries = getIndicatorMapSeries(indicator, fallbackYear)
        if (!mapSeries) return []

        return Object.entries(mapSeries).flatMap(([year, values]) =>
          Object.entries(values)
            .filter(([slug]) => municipioSlugs.has(slug))
            .map(([municipioSlug, value]) => ({
              rowId: `${sectionId}::${group.id}::${indicator.id}::${year}::${municipioSlug}`,
              sectionId,
              sectionLabel: section.label,
              groupId: group.id,
              groupLabel: group.label,
              indicatorId: indicator.id,
              indicatorLabel: indicator.label,
              unit: indicator.unit,
              source: indicator.source,
              year: Number(year),
              municipioSlug,
              value,
            })),
        )
      }),
    )
  })
}

export function bundleToMunicipalTemplateRows(
  bundle: PortalDataBundle,
  variableKey: string,
  year: number,
): EditableMunicipalTemplateRow[] {
  const { sectionId, groupId, indicatorId } = parseMapVariableKey(variableKey)
  const section = bundle.sections[sectionId]
  const group = section?.groups.find((item) => item.id === groupId)
  const indicator = group?.indicators.find((item) => item.id === indicatorId)

  if (!section || !group || !indicator) {
    return []
  }

  const fallbackYear = getSectionFallbackMapYear(section)
  const mapSeries = getIndicatorMapSeries(indicator, fallbackYear) ?? {}
  const valuesByMunicipio = mapSeries[String(year)] ?? {}

  return bundle.municipiosIndex.map((municipio) => ({
    rowId: `${sectionId}::${groupId}::${indicatorId}::${year}::${municipio.slug}`,
    sectionId,
    sectionLabel: section.label,
    groupId,
    groupLabel: group.label,
    indicatorId,
    indicatorLabel: indicator.label,
    unit: indicator.unit,
    source: indicator.source,
    year,
    municipioSlug: municipio.slug,
    municipioNome: municipio.nome,
    value: valuesByMunicipio[municipio.slug] ?? '',
  }))
}

export function bundleToMunicipioSummaryRows(
  bundle: PortalDataBundle,
): EditableMunicipioSummaryRow[] {
  return bundle.municipiosIndex.map((municipio) => ({
    rowId: municipio.slug,
    ...municipio,
  }))
}

export function bundleToMunicipioIndicatorRows(
  bundle: PortalDataBundle,
): EditableMunicipioIndicatorRow[] {
  return Object.values(bundle.municipioDetails).flatMap((municipio) =>
    municipio.indicadores.map((indicator) => ({
      rowId: `${municipio.slug}::${indicator.section}::${indicator.id}::${indicator.year}`,
      municipioSlug: municipio.slug,
      municipioNome: municipio.nome,
      section: indicator.section,
      id: indicator.id,
      label: indicator.label,
      value: indicator.value,
      unit: indicator.unit,
      year: indicator.year,
    })),
  )
}

export function bundleToWorkbookSheets(bundle: PortalDataBundle): PortalWorkbookSheets {
  return {
    dashboardKpis: bundleToDashboardKpiRows(bundle),
    dashboardSummaries: bundleToDashboardSummaryRows(bundle),
    indicators: bundleToIndicatorRows(bundle),
    mapRows: bundleToMapRows(bundle),
    municipios: bundleToMunicipioSummaryRows(bundle),
    municipioIndicators: bundleToMunicipioIndicatorRows(bundle),
  }
}

function buildIndicatorSkeletons(
  indicatorRows: EditableIndicatorRow[],
) {
  const sectionEntries = new Map<
    IndicatorSectionId,
    {
      label: string
      lastUpdated: string
      groups: Map<
        string,
        {
          label: string
          indicators: Map<string, Indicator>
        }
      >
    }
  >()

  for (const row of indicatorRows) {
    if (!sectionEntries.has(row.sectionId)) {
      sectionEntries.set(row.sectionId, {
        label: row.sectionLabel,
        lastUpdated: row.lastUpdated,
        groups: new Map(),
      })
    }

    const section = sectionEntries.get(row.sectionId)!

    if (!section.groups.has(row.groupId)) {
      section.groups.set(row.groupId, {
        label: row.groupLabel,
        indicators: new Map(),
      })
    }

    const group = section.groups.get(row.groupId)!

    if (!group.indicators.has(row.indicatorId)) {
      group.indicators.set(row.indicatorId, {
        id: row.indicatorId,
        label: row.indicatorLabel,
        description: row.description,
        unit: row.unit,
        source: row.source,
        latestValue: row.latestValue ?? undefined,
        delta: row.delta ?? undefined,
        deltaDirection: row.deltaDirection || undefined,
        timeSeries: [],
      })
    }

    const indicator = group.indicators.get(row.indicatorId)!
    indicator.timeSeries.push({
      year: row.year,
      value: row.value,
    })
  }

  for (const sectionId of INDICATOR_SECTION_IDS) {
    if (!sectionEntries.has(sectionId)) {
      sectionEntries.set(sectionId, {
        label: sectionId,
        lastUpdated: getCurrentDateLabel(),
        groups: new Map(),
      })
    }
  }

  return Object.fromEntries(
    Array.from(sectionEntries.entries()).map(([sectionId, section]) => [
      sectionId,
      {
        id: sectionId,
        label: section.label,
        lastUpdated: section.lastUpdated,
        groups: Array.from(section.groups.entries()).map(([groupId, group]) => ({
          id: groupId,
          label: group.label,
          indicators: Array.from(group.indicators.values()).map((indicator) => ({
            ...indicator,
            timeSeries: [...indicator.timeSeries].sort(
              (left, right) => left.year - right.year,
            ),
          })),
        })),
      },
    ]),
  ) as Record<IndicatorSectionId, IndicatorSection>
}

function applyMapRowsToSections(
  sections: Record<IndicatorSectionId, IndicatorSection>,
  mapRows: EditableMapRow[],
) {
  const mapRowsByIndicator = new Map<string, EditableMapRow[]>()

  for (const row of mapRows) {
    const key = buildMapVariableKey(row.sectionId, row.groupId, row.indicatorId)
    const list = mapRowsByIndicator.get(key) ?? []
    list.push(row)
    mapRowsByIndicator.set(key, list)
  }

  for (const sectionId of INDICATOR_SECTION_IDS) {
    const section = sections[sectionId]
    const fallbackYear = getSectionFallbackMapYear(section)

    section.groups = section.groups.map((group) => ({
      ...group,
      indicators: group.indicators.map((indicator) => {
        const key = buildMapVariableKey(sectionId, group.id, indicator.id)
        const rows = mapRowsByIndicator.get(key) ?? []

        if (rows.length === 0) {
          const latestByMunicipio = getIndicatorLatestByMunicipio(
            indicator,
            fallbackYear,
          )
          return {
            ...indicator,
            byMunicipio: latestByMunicipio,
          }
        }

        const mapSeries: Record<string, Record<string, number>> = {}
        for (const row of rows) {
          if (!mapSeries[String(row.year)]) {
            mapSeries[String(row.year)] = {}
          }
          mapSeries[String(row.year)][row.municipioSlug] = row.value
        }

        const sortedMapSeries = sortMapSeriesYears(mapSeries)
        const latestYear = Math.max(...Object.keys(sortedMapSeries).map(Number))

        return {
          ...indicator,
          mapSeries: sortedMapSeries,
          byMunicipio: sortedMapSeries[String(latestYear)],
        }
      }),
    }))
  }

  return sections
}

export function workbookSheetsToBundle(
  sheets: PortalWorkbookSheets,
): PortalDataBundle {
  const sections = applyMapRowsToSections(
    buildIndicatorSkeletons(sheets.indicators),
    sheets.mapRows,
  )

  const municipiosIndex = sheets.municipios.map((municipio) => ({
    slug: municipio.slug,
    nome: municipio.nome,
    populacao: municipio.populacao,
    area: municipio.area,
    regiaoJudiciaria: municipio.regiaoJudiciaria,
    distanciaCapital: municipio.distanciaCapital,
    idhm: municipio.idhm,
    lat: municipio.lat,
    lng: municipio.lng,
  }))

  const municipioDetails = normalizeMunicipioDetails(
    municipiosIndex,
    Object.fromEntries(
      sheets.municipios.map((municipio) => [
        municipio.slug,
        {
          slug: municipio.slug,
          nome: municipio.nome,
          populacao: municipio.populacao,
          area: municipio.area,
          regiaoJudiciaria: municipio.regiaoJudiciaria,
          distanciaCapital: municipio.distanciaCapital,
          idhm: municipio.idhm,
          lat: municipio.lat,
          lng: municipio.lng,
          indicadores: sheets.municipioIndicators
            .filter((indicator) => indicator.municipioSlug === municipio.slug)
            .map((indicator) => ({
              section: indicator.section,
              id: indicator.id,
              label: indicator.label,
              value: indicator.value,
              unit: indicator.unit,
              year: indicator.year,
            })),
        },
      ]),
    ),
  )

  return {
    dashboard: {
      lastUpdated:
        Object.values(sections)[0]?.lastUpdated ?? getCurrentDateLabel(),
      kpis: sheets.dashboardKpis.map((row) => ({
        id: row.id,
        section: row.section,
        label: row.label,
        value: row.value,
        unit: row.unit,
        delta: row.delta ?? undefined,
        deltaDirection: row.deltaDirection || undefined,
        positiveDirection: row.positiveDirection || undefined,
        year: row.year,
      })),
      sectionSummaries: sheets.dashboardSummaries.map((row) => ({
        section: row.section,
        headline: row.headline,
        value: row.value,
        trend: parseTrendValue(row.trend),
      })),
    },
    sections,
    municipiosIndex,
    municipioDetails,
  }
}

function createDownloadableBlob(
  blob: Blob,
  filename: string,
) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function downloadBundleAsJson(bundle: PortalDataBundle) {
  const blob = new Blob([JSON.stringify(bundle, null, 2)], {
    type: 'application/json',
  })

  createDownloadableBlob(blob, 'portal-data-bundle.json')
}

export async function downloadBundleAsWorkbook(bundle: PortalDataBundle) {
  const workbook = XLSX.utils.book_new()
  const sheets = bundleToWorkbookSheets(bundle)

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(sheets.dashboardKpis),
    WORKBOOK_SHEETS.dashboardKpis,
  )
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(sheets.dashboardSummaries),
    WORKBOOK_SHEETS.dashboardSummaries,
  )
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(sheets.indicators),
    WORKBOOK_SHEETS.indicators,
  )
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(sheets.mapRows),
    WORKBOOK_SHEETS.mapRows,
  )
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(sheets.municipios),
    WORKBOOK_SHEETS.municipios,
  )
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(sheets.municipioIndicators),
    WORKBOOK_SHEETS.municipioIndicators,
  )

  const output = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
  })

  createDownloadableBlob(
    new Blob([output], {
      type:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    'portal-dados.xlsx',
  )
}

function buildMunicipalTemplateInstructions() {
  return [
    {
      passo: '1',
      orientacao:
        'Preencha somente a coluna value para cada municipio, mantendo sectionId, groupId, indicatorId e year.',
    },
    {
      passo: '2',
      orientacao:
        'Voce pode editar indicatorLabel, unit e source se quiser atualizar o metadado da variavel.',
    },
    {
      passo: '3',
      orientacao:
        'Linhas com value vazio serao tratadas como sem dado municipal para aquele municipio.',
    },
  ]
}

export async function downloadMunicipalTemplateWorkbook(
  bundle: PortalDataBundle,
  variableKey: string,
  year: number,
) {
  const workbook = XLSX.utils.book_new()
  const rows = bundleToMunicipalTemplateRows(bundle, variableKey, year)

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(buildMunicipalTemplateInstructions()),
    MUNICIPAL_TEMPLATE_INSTRUCTIONS_SHEET,
  )
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(rows),
    MUNICIPAL_TEMPLATE_SHEET,
  )

  const output = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
  })

  const firstRow = rows[0]
  const filename = firstRow
    ? `modelo-municipal-${firstRow.indicatorId}-${year}.xlsx`
    : `modelo-municipal-${year}.xlsx`

  createDownloadableBlob(
    new Blob([output], {
      type:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    filename,
  )
}

export function buildBundleJsonFiles(bundle: PortalDataBundle) {
  const normalizedSections = Object.fromEntries(
    INDICATOR_SECTION_IDS.map((sectionId) => [
      sectionId,
      normalizeIndicatorSection(bundle.sections[sectionId]),
    ]),
  ) as Record<IndicatorSectionId, IndicatorSection>

  const files: Record<string, string> = {
    'public/data/dashboard.json': JSON.stringify(bundle.dashboard, null, 2),
    'public/data/municipios/index.json': JSON.stringify(
      bundle.municipiosIndex,
      null,
      2,
    ),
  }

  for (const sectionId of INDICATOR_SECTION_IDS) {
    files[`public/data/${sectionId}.json`] = JSON.stringify(
      normalizedSections[sectionId],
      null,
      2,
    )
  }

  for (const municipio of bundle.municipiosIndex) {
    files[`public/data/municipios/${municipio.slug}.json`] = JSON.stringify(
      bundle.municipioDetails[municipio.slug] ?? buildDefaultMunicipioDetail(municipio),
      null,
      2,
    )
  }

  return files
}

export async function downloadBundleAsZip(bundle: PortalDataBundle) {
  const zip = new JSZip()
  const files = buildBundleJsonFiles(bundle)

  for (const [path, contents] of Object.entries(files)) {
    zip.file(path, `${contents}\n`)
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  createDownloadableBlob(blob, 'portal-data-json.zip')
}

function extractSheetRows<T>(workbook: XLSX.WorkBook, sheetName: string) {
  const sheet = workbook.Sheets[sheetName]
  if (!sheet) return [] as T[]
  return XLSX.utils.sheet_to_json<T>(sheet, { defval: '' })
}

export async function importBundleFromWorkbook(file: File) {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })

  const sheets: PortalWorkbookSheets = {
    dashboardKpis: extractSheetRows<EditableDashboardKpiRow>(
      workbook,
      WORKBOOK_SHEETS.dashboardKpis,
    ).map((row) => ({
      ...row,
      rowId: toStringValue(row.rowId || row.id),
      id: toStringValue(row.id),
      section: toStringValue(row.section),
      label: toStringValue(row.label),
      value:
        typeof row.value === 'string' && row.value !== ''
          ? row.value
          : parseNumericValue(row.value),
      unit: toStringValue(row.unit),
      delta: toOptionalNumber(row.delta),
      deltaDirection: normalizeDirection(row.deltaDirection),
      positiveDirection: normalizePositiveDirection(row.positiveDirection),
      year: parseIntegerValue(row.year),
    })),
    dashboardSummaries: extractSheetRows<EditableDashboardSummaryRow>(
      workbook,
      WORKBOOK_SHEETS.dashboardSummaries,
    ).map((row) => ({
      rowId: toStringValue(row.rowId || row.section),
      section: toStringValue(row.section),
      headline: toStringValue(row.headline),
      value: toStringValue(row.value),
      trend: toStringValue(row.trend),
    })),
    indicators: extractSheetRows<EditableIndicatorRow>(
      workbook,
      WORKBOOK_SHEETS.indicators,
    ).map((row) => ({
      rowId: toStringValue(row.rowId),
      sectionId: toStringValue(row.sectionId) as IndicatorSectionId,
      sectionLabel: toStringValue(row.sectionLabel),
      lastUpdated: toStringValue(row.lastUpdated),
      groupId: toStringValue(row.groupId),
      groupLabel: toStringValue(row.groupLabel),
      indicatorId: toStringValue(row.indicatorId),
      indicatorLabel: toStringValue(row.indicatorLabel),
      description: toStringValue(row.description),
      unit: toStringValue(row.unit),
      source: toStringValue(row.source),
      latestValue: toOptionalNumber(row.latestValue),
      delta: toOptionalNumber(row.delta),
      deltaDirection: normalizeDirection(row.deltaDirection),
      year: parseIntegerValue(row.year),
      value: parseNumericValue(row.value),
    })),
    mapRows: extractSheetRows<EditableMapRow>(
      workbook,
      WORKBOOK_SHEETS.mapRows,
    ).map((row) => ({
      rowId: toStringValue(row.rowId),
      sectionId: toStringValue(row.sectionId) as IndicatorSectionId,
      sectionLabel: toStringValue(row.sectionLabel),
      groupId: toStringValue(row.groupId),
      groupLabel: toStringValue(row.groupLabel),
      indicatorId: toStringValue(row.indicatorId),
      indicatorLabel: toStringValue(row.indicatorLabel),
      unit: toStringValue(row.unit),
      source: toStringValue(row.source),
      year: parseIntegerValue(row.year),
      municipioSlug: toStringValue(row.municipioSlug),
      value: parseNumericValue(row.value),
    })),
    municipios: extractSheetRows<EditableMunicipioSummaryRow>(
      workbook,
      WORKBOOK_SHEETS.municipios,
    ).map((row) => ({
      rowId: toStringValue(row.rowId || row.slug),
      slug: toStringValue(row.slug),
      nome: toStringValue(row.nome),
      populacao: parseIntegerValue(row.populacao),
      area: parseNumericValue(row.area),
      regiaoJudiciaria: toStringValue(row.regiaoJudiciaria),
      distanciaCapital: parseNumericValue(row.distanciaCapital),
      idhm: parseNumericValue(row.idhm),
      lat: parseNumericValue(row.lat),
      lng: parseNumericValue(row.lng),
    })),
    municipioIndicators: extractSheetRows<EditableMunicipioIndicatorRow>(
      workbook,
      WORKBOOK_SHEETS.municipioIndicators,
    ).map((row) => ({
      rowId: toStringValue(row.rowId),
      municipioSlug: toStringValue(row.municipioSlug),
      municipioNome: toStringValue(row.municipioNome),
      section: toStringValue(row.section),
      id: toStringValue(row.id),
      label: toStringValue(row.label),
      value: parseNumericValue(row.value),
      unit: toStringValue(row.unit),
      year: parseIntegerValue(row.year),
    })),
  }

  return workbookSheetsToBundle(sheets)
}

function ensureIndicatorStructure(
  bundle: PortalDataBundle,
  row: EditableMunicipalTemplateRow,
) {
  const section = bundle.sections[row.sectionId]
  let group = section.groups.find((item) => item.id === row.groupId)

  if (!group) {
    group = {
      id: row.groupId,
      label: row.groupLabel || row.groupId,
      indicators: [],
    }
    section.groups.push(group)
  } else if (row.groupLabel) {
    group.label = row.groupLabel
  }

  let indicator = group.indicators.find((item) => item.id === row.indicatorId)

  if (!indicator) {
    indicator = {
      id: row.indicatorId,
      label: row.indicatorLabel || row.indicatorId,
      description: '',
      unit: row.unit,
      source: row.source,
      timeSeries: [{ year: row.year, value: 0 }],
      mapSeries: {},
      byMunicipio: {},
    }
    group.indicators.push(indicator)
  }

  indicator.label = row.indicatorLabel || indicator.label
  indicator.unit = row.unit
  indicator.source = row.source

  if (!indicator.timeSeries.some((point) => point.year === row.year)) {
    indicator.timeSeries.push({ year: row.year, value: 0 })
    indicator.timeSeries.sort((left, right) => left.year - right.year)
  }

  return { section, indicator }
}

export function applyMunicipalTemplateRowsToBundle(
  bundle: PortalDataBundle,
  rows: EditableMunicipalTemplateRow[],
) {
  const nextBundle = structuredClone(bundle) as PortalDataBundle
  const touchedYearKeys = new Map<string, EditableMunicipalTemplateRow>()

  for (const row of rows) {
    const key = `${row.sectionId}::${row.groupId}::${row.indicatorId}::${row.year}`
    if (!touchedYearKeys.has(key)) {
      touchedYearKeys.set(key, row)
    }
  }

  for (const row of touchedYearKeys.values()) {
    const { indicator } = ensureIndicatorStructure(nextBundle, row)
    const mapSeries = indicator.mapSeries ? { ...indicator.mapSeries } : {}
    mapSeries[String(row.year)] = {}
    indicator.mapSeries = mapSeries
  }

  for (const row of rows) {
    const { section, indicator } = ensureIndicatorStructure(nextBundle, row)
    const fallbackYear =
      Number(section.lastUpdated.slice(0, 4)) || new Date().getFullYear()
    const mapSeries = getIndicatorMapSeries(indicator, fallbackYear) ?? {}
    const yearKey = String(row.year)

    if (!mapSeries[yearKey]) {
      mapSeries[yearKey] = {}
    }

    if (row.value !== '') {
      mapSeries[yearKey][row.municipioSlug] = Number(row.value)
    }

    indicator.mapSeries = sortMapSeriesYears(mapSeries)
    indicator.byMunicipio = getIndicatorLatestByMunicipio(indicator, fallbackYear)
  }

  for (const sectionId of INDICATOR_SECTION_IDS) {
    const section = nextBundle.sections[sectionId]
    const fallbackYear = getSectionFallbackMapYear(section)

    for (const group of section.groups) {
      for (const indicator of group.indicators) {
        const mapSeries = indicator.mapSeries ? { ...indicator.mapSeries } : undefined
        if (!mapSeries) continue

        for (const yearKey of Object.keys(mapSeries)) {
          const touchKey = `${sectionId}::${group.id}::${indicator.id}::${yearKey}`
          if (!touchedYearKeys.has(touchKey)) continue
          if (Object.keys(mapSeries[yearKey] ?? {}).length === 0) {
            delete mapSeries[yearKey]
          }
        }

        indicator.mapSeries =
          Object.keys(mapSeries).length > 0 ? sortMapSeriesYears(mapSeries) : undefined
        indicator.byMunicipio = getIndicatorLatestByMunicipio(indicator, fallbackYear)
      }
    }
  }

  return nextBundle
}

export async function importMunicipalTemplateWorkbook(
  file: File,
  currentBundle: PortalDataBundle,
) {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const rows = extractSheetRows<EditableMunicipalTemplateRow>(
    workbook,
    MUNICIPAL_TEMPLATE_SHEET,
  ).map((row) => ({
    rowId:
      toStringValue(row.rowId) ||
      `${toStringValue(row.sectionId)}::${toStringValue(row.groupId)}::${toStringValue(
        row.indicatorId,
      )}::${parseIntegerValue(row.year)}::${toStringValue(row.municipioSlug)}`,
    sectionId: toStringValue(row.sectionId) as IndicatorSectionId,
    sectionLabel: toStringValue(row.sectionLabel),
    groupId: toStringValue(row.groupId),
    groupLabel: toStringValue(row.groupLabel),
    indicatorId: toStringValue(row.indicatorId),
    indicatorLabel: toStringValue(row.indicatorLabel),
    unit: toStringValue(row.unit),
    source: toStringValue(row.source),
    year: parseIntegerValue(row.year),
    municipioSlug: toStringValue(row.municipioSlug),
    municipioNome: toStringValue(row.municipioNome),
    value: toBlankableNumber(row.value),
  }))

  if (rows.length === 0) {
    throw new Error('A planilha municipal nao possui linhas para importar.')
  }

  return applyMunicipalTemplateRowsToBundle(currentBundle, rows)
}

export async function importBundleFromJson(file: File) {
  const text = await file.text()
  const parsed = JSON.parse(text) as PortalDataBundle

  return {
    ...parsed,
    dashboard: parsed.dashboard ?? buildEmptyDashboard(),
    sections: Object.fromEntries(
      INDICATOR_SECTION_IDS.map((sectionId) => [
        sectionId,
        normalizeIndicatorSection(parsed.sections[sectionId]),
      ]),
    ) as Record<IndicatorSectionId, IndicatorSection>,
    municipiosIndex: parsed.municipiosIndex ?? [],
    municipioDetails: normalizeMunicipioDetails(
      parsed.municipiosIndex ?? [],
      parsed.municipioDetails ?? {},
    ),
  }
}

export async function importBundleFromZip(file: File) {
  const zip = await JSZip.loadAsync(await file.arrayBuffer())
  const readJson = async <T>(path: string) => {
    const entry = zip.file(path)
    if (!entry) return null
    return JSON.parse(await entry.async('string')) as T
  }

  const dashboard = (await readJson<DashboardData>('public/data/dashboard.json')) ??
    buildEmptyDashboard()

  const municipiosIndex =
    (await readJson<MunicipioSummary[]>('public/data/municipios/index.json')) ?? []

  const sections = Object.fromEntries(
    await Promise.all(
      INDICATOR_SECTION_IDS.map(async (sectionId) => {
        const section = await readJson<IndicatorSection>(`public/data/${sectionId}.json`)
        return [
          sectionId,
          normalizeIndicatorSection(
            section ?? {
              id: sectionId,
              label: sectionId,
              lastUpdated: getCurrentDateLabel(),
              groups: [],
            },
          ),
        ] as const
      }),
    ),
  ) as Record<IndicatorSectionId, IndicatorSection>

  const municipioDetailsEntries = await Promise.all(
    municipiosIndex.map(async (municipio) => {
      const detail = await readJson<MunicipioDetail>(
        `public/data/municipios/${municipio.slug}.json`,
      )
      return [
        municipio.slug,
        detail ?? buildDefaultMunicipioDetail(municipio),
      ] as const
    }),
  )

  return {
    dashboard,
    sections,
    municipiosIndex,
    municipioDetails: normalizeMunicipioDetails(
      municipiosIndex,
      Object.fromEntries(municipioDetailsEntries),
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

export function validateMapRows(rows: EditableMapRow[]) {
  const duplicates = new Set<string>()
  const seen = new Set<string>()

  for (const row of rows) {
    const key = `${row.sectionId}::${row.groupId}::${row.indicatorId}::${row.year}::${row.municipioSlug}`
    if (seen.has(key)) {
      duplicates.add(key)
    }
    seen.add(key)
  }

  return Array.from(duplicates)
}
