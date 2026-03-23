import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { EditableDataTable, type EditableColumn } from '@/components/admin/EditableDataTable'
import { cn } from '@/lib/utils/cn'
import {
  DEFAULT_MAP_VARIABLE_KEY,
  buildMapVariableKey,
  bundleToMunicipalTemplateRows,
  bundleToDashboardKpiRows,
  bundleToDashboardSummaryRows,
  bundleToIndicatorRows,
  bundleToMapRows,
  bundleToMunicipioIndicatorRows,
  bundleToMunicipioSummaryRows,
  downloadMunicipalTemplateWorkbook,
  downloadBundleAsJson,
  downloadBundleAsWorkbook,
  downloadBundleAsZip,
  getIndicatorLatestByMunicipio,
  getIndicatorMapSeries,
  getMapVariableOptions,
  importMunicipalTemplateWorkbook,
  importBundleFromJson,
  importBundleFromWorkbook,
  importBundleFromZip,
  parseMapVariableKey,
  validateMapRows,
} from '@/lib/data/workbook'
import {
  INDICATOR_SECTION_IDS,
  type IndicatorSectionId,
} from '@/lib/constants/indicator-sections'
import type {
  EditableDashboardKpiRow,
  EditableDashboardSummaryRow,
  EditableIndicatorRow,
  EditableMapRow,
  EditableMunicipalTemplateRow,
  EditableMunicipioIndicatorRow,
  EditableMunicipioSummaryRow,
  PortalDataBundle,
} from '@/types/admin-data'
import type { Indicator } from '@/types/indicators'

interface AdminDataPageProps {
  initialBundle: PortalDataBundle | null
  isLoading?: boolean
  isError?: boolean
  errorMessage?: string | null
}

type AdminTab = 'indicadores' | 'mapa' | 'importar'

const TABS: Array<{ id: AdminTab; label: string }> = [
  { id: 'indicadores', label: 'Planilha de variáveis' },
  { id: 'mapa', label: 'Planilha municipal' },
  { id: 'importar', label: 'Modelos e importação' },
]

function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f4f1e8]">
      <header className="border-b border-areia-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1F6B3A]/70 font-jakarta">
              Admin de Dados
            </p>
            <h1 className="text-2xl font-semibold text-[#1F6B3A] font-fraunces">
              Gestão do Portal de Indicadores
            </h1>
          </div>

          <Link
            to="/"
            className="rounded-full border border-areia-200 bg-white px-4 py-2 text-sm font-medium text-areia-700 shadow-sm transition hover:border-areia-300 hover:text-[#1F6B3A] font-jakarta"
          >
            Voltar ao portal
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-6 py-6">{children}</main>
    </div>
  )
}

function SectionCard({
  title,
  description,
  actions,
  children,
}: {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-areia-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-areia-100 px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold text-areia-800 font-fraunces">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-areia-500 font-jakarta">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

function ActionButton({
  children,
  onClick,
  variant = 'default',
}: {
  children: ReactNode
  onClick: () => void
  variant?: 'default' | 'danger'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full px-3 py-2 text-xs font-semibold shadow-sm transition font-jakarta',
        variant === 'danger'
          ? 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
          : 'border border-[#1F6B3A]/10 bg-[#1F6B3A] text-white hover:bg-[#15512c]',
      )}
    >
      {children}
    </button>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full px-4 py-2 text-sm font-semibold transition font-jakarta',
        active
          ? 'bg-[#1F6B3A] text-white shadow-sm'
          : 'bg-white text-areia-600 border border-areia-200 hover:border-areia-300 hover:text-[#1F6B3A]',
      )}
    >
      {children}
    </button>
  )
}

function parseNumberInput(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function parseOptionalNumberInput(value: string) {
  if (value.trim() === '') return null
  return parseNumberInput(value)
}

function formatSectionLabel(sectionId: string) {
  return sectionId.replace(/^\w/, (char) => char.toUpperCase())
}

function createStatusMessage(kind: 'success' | 'error', message: string) {
  return { kind, message }
}

function getSectionAndIndicator(
  bundle: PortalDataBundle,
  sectionId: IndicatorSectionId,
  groupId: string,
  indicatorId: string,
) {
  const section = bundle.sections[sectionId]
  const group = section.groups.find((item) => item.id === groupId)
  const indicator = group?.indicators.find((item) => item.id === indicatorId)
  return { section, group, indicator }
}

function syncIndicatorMapValues(sectionLastUpdated: string, indicator: Indicator) {
  const fallbackYear =
    Number(sectionLastUpdated.slice(0, 4)) || new Date().getFullYear()
  indicator.byMunicipio = getIndicatorLatestByMunicipio(indicator, fallbackYear)
}

export function AdminDataPage({
  initialBundle,
  isLoading = false,
  isError = false,
  errorMessage = null,
}: AdminDataPageProps) {
  const [bundle, setBundle] = useState<PortalDataBundle | null>(initialBundle)
  const [activeTab, setActiveTab] = useState<AdminTab>('indicadores')
  const [status, setStatus] = useState<ReturnType<typeof createStatusMessage> | null>(
    null,
  )
  const [selectedIndicatorSection, setSelectedIndicatorSection] =
    useState<IndicatorSectionId>('educacao')
  const [selectedIndicatorGroup, setSelectedIndicatorGroup] = useState('')
  const [selectedIndicatorId, setSelectedIndicatorId] = useState('')
  const [newIndicatorId, setNewIndicatorId] = useState('')
  const [newIndicatorLabel, setNewIndicatorLabel] = useState('')
  const [newIndicatorUnit, setNewIndicatorUnit] = useState('')
  const [newIndicatorSource, setNewIndicatorSource] = useState('')
  const [newIndicatorYear, setNewIndicatorYear] = useState(new Date().getFullYear())
  const [newSeriesYear, setNewSeriesYear] = useState(new Date().getFullYear())
  const [selectedMapVariableKey, setSelectedMapVariableKey] = useState(
    DEFAULT_MAP_VARIABLE_KEY,
  )
  const [selectedMapYear, setSelectedMapYear] = useState<number>(2023)
  const [mapMunicipioFilter, setMapMunicipioFilter] = useState('')
  const [selectedMunicipioSlug, setSelectedMunicipioSlug] = useState('')

  useEffect(() => {
    if (initialBundle) {
      setBundle(initialBundle)
    }
  }, [initialBundle])

  const dashboardKpiRows = useMemo(
    () => (bundle ? bundleToDashboardKpiRows(bundle) : []),
    [bundle],
  )
  const dashboardSummaryRows = useMemo(
    () => (bundle ? bundleToDashboardSummaryRows(bundle) : []),
    [bundle],
  )
  const indicatorRows = useMemo(
    () => (bundle ? bundleToIndicatorRows(bundle) : []),
    [bundle],
  )
  const mapRows = useMemo(() => (bundle ? bundleToMapRows(bundle) : []), [bundle])
  const municipioRows = useMemo(
    () => (bundle ? bundleToMunicipioSummaryRows(bundle) : []),
    [bundle],
  )
  const municipioIndicatorRows = useMemo(
    () => (bundle ? bundleToMunicipioIndicatorRows(bundle) : []),
    [bundle],
  )
  const mapVariableOptions = useMemo(() => {
    if (!bundle) return []

    return INDICATOR_SECTION_IDS.flatMap((sectionId) => {
      const section = bundle.sections[sectionId]
      const fallbackYear =
        Number(section.lastUpdated.slice(0, 4)) || new Date().getFullYear()

      return section.groups.flatMap((group) =>
        group.indicators.flatMap((indicator) => {
          const years = Array.from(
            new Set([
              ...indicator.timeSeries.map((point) => point.year),
              ...Object.keys(getIndicatorMapSeries(indicator, fallbackYear) ?? {}).map(Number),
            ]),
          ).sort((left, right) => left - right)

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
  }, [bundle])
  const duplicateMapRows = useMemo(() => validateMapRows(mapRows), [mapRows])

  const selectedSection = bundle?.sections[selectedIndicatorSection]
  const selectedGroupOptions = selectedSection?.groups ?? []
  const selectedIndicatorGroupEntry = selectedGroupOptions.find(
    (group) => group.id === selectedIndicatorGroup,
  )
  const selectedIndicatorOptions = selectedIndicatorGroupEntry?.indicators ?? []
  const selectedMapOption = mapVariableOptions.find(
    (option) => option.key === selectedMapVariableKey,
  )

  useEffect(() => {
    if (!selectedGroupOptions.length) return
    if (!selectedGroupOptions.some((group) => group.id === selectedIndicatorGroup)) {
      setSelectedIndicatorGroup(selectedGroupOptions[0]?.id ?? '')
    }
  }, [selectedGroupOptions, selectedIndicatorGroup])

  useEffect(() => {
    if (!selectedIndicatorOptions.length) return
    if (
      !selectedIndicatorOptions.some((indicator) => indicator.id === selectedIndicatorId)
    ) {
      setSelectedIndicatorId(selectedIndicatorOptions[0]?.id ?? '')
    }
  }, [selectedIndicatorOptions, selectedIndicatorId])

  useEffect(() => {
    if (municipioRows.length === 0) return
    if (!municipioRows.some((municipio) => municipio.slug === selectedMunicipioSlug)) {
      setSelectedMunicipioSlug(municipioRows[0]?.slug ?? '')
    }
  }, [municipioRows, selectedMunicipioSlug])

  useEffect(() => {
    if (mapVariableOptions.length === 0) return
    if (!mapVariableOptions.some((option) => option.key === selectedMapVariableKey)) {
      const fallbackOption =
        mapVariableOptions.find((option) => option.key === DEFAULT_MAP_VARIABLE_KEY) ??
        mapVariableOptions[0]
      setSelectedMapVariableKey(fallbackOption.key)
      setSelectedMapYear(fallbackOption.years[fallbackOption.years.length - 1] ?? 0)
      return
    }

    const currentOption = mapVariableOptions.find(
      (option) => option.key === selectedMapVariableKey,
    )
    if (!currentOption) return
    if (!currentOption.years.includes(selectedMapYear)) {
      setSelectedMapYear(currentOption.years[currentOption.years.length - 1] ?? 0)
    }
  }, [mapVariableOptions, selectedMapVariableKey, selectedMapYear])

  const filteredIndicatorRows = useMemo(
    () =>
      indicatorRows.filter(
        (row) =>
          row.sectionId === selectedIndicatorSection &&
          (selectedIndicatorGroup ? row.groupId === selectedIndicatorGroup : true) &&
          (selectedIndicatorId ? row.indicatorId === selectedIndicatorId : true),
      ),
    [indicatorRows, selectedIndicatorGroup, selectedIndicatorId, selectedIndicatorSection],
  )

  const filteredMapRows = useMemo(
    () =>
      bundle
        ? bundleToMunicipalTemplateRows(bundle, selectedMapVariableKey, selectedMapYear).filter(
        (row) =>
          (!mapMunicipioFilter ||
            row.municipioSlug.includes(mapMunicipioFilter.toLowerCase()) ||
            row.municipioNome.toLowerCase().includes(mapMunicipioFilter.toLowerCase())),
      )
        : [],
    [bundle, mapMunicipioFilter, selectedMapVariableKey, selectedMapYear],
  )

  const filteredMunicipioIndicatorRows = useMemo(
    () =>
      municipioIndicatorRows.filter(
        (row) => row.municipioSlug === selectedMunicipioSlug,
      ),
    [municipioIndicatorRows, selectedMunicipioSlug],
  )

  const patchBundle = (mutator: (draft: PortalDataBundle) => void) => {
    setBundle((current) => {
      if (!current) return current
      const draft = structuredClone(current) as PortalDataBundle
      mutator(draft)
      return draft
    })
  }

  const updateDashboardKpiCell = (rowId: string, columnId: string, value: string) => {
    patchBundle((draft) => {
      const kpi = draft.dashboard.kpis.find((item) => item.id === rowId)
      if (!kpi) return

      switch (columnId) {
        case 'id':
          kpi.id = value.trim()
          break
        case 'section':
          kpi.section = value.trim()
          break
        case 'label':
          kpi.label = value
          break
        case 'value':
          kpi.value = value.trim() === '' ? '' : parseNumberInput(value)
          break
        case 'unit':
          kpi.unit = value
          break
        case 'delta':
          kpi.delta = parseOptionalNumberInput(value) ?? undefined
          break
        case 'deltaDirection':
          kpi.deltaDirection =
            (value as 'up' | 'down' | 'neutral' | '') || undefined
          break
        case 'positiveDirection':
          kpi.positiveDirection = (value as 'up' | 'down' | '') || undefined
          break
        case 'year':
          kpi.year = Math.max(0, Math.trunc(parseNumberInput(value)))
          break
      }
    })
  }

  const updateDashboardSummaryCell = (
    rowId: string,
    columnId: string,
    value: string,
  ) => {
    patchBundle((draft) => {
      const summary = draft.dashboard.sectionSummaries.find(
        (item) => item.section === rowId,
      )
      if (!summary) return

      switch (columnId) {
        case 'section':
          summary.section = value.trim()
          break
        case 'headline':
          summary.headline = value
          break
        case 'value':
          summary.value = value
          break
        case 'trend':
          summary.trend = value
            .split('|')
            .map((item) => item.trim())
            .filter(Boolean)
            .map(parseNumberInput)
          break
      }
    })
  }

  const updateIndicatorCell = (rowId: string, columnId: string, value: string) => {
    patchBundle((draft) => {
      const [sectionId, groupId, indicatorId, yearLabel] = rowId.split('::')
      const { section, indicator } = getSectionAndIndicator(
        draft,
        sectionId as IndicatorSectionId,
        groupId,
        indicatorId,
      )
      if (!section || !indicator) return

      const year = Number(yearLabel)
      const point = indicator.timeSeries.find((item) => item.year === year)
      if (!point) return

      switch (columnId) {
        case 'lastUpdated':
          section.lastUpdated = value
          break
        case 'indicatorLabel':
          indicator.label = value
          break
        case 'description':
          indicator.description = value
          break
        case 'unit':
          indicator.unit = value
          break
        case 'source':
          indicator.source = value
          break
        case 'latestValue':
          indicator.latestValue = parseOptionalNumberInput(value) ?? undefined
          break
        case 'delta':
          indicator.delta = parseOptionalNumberInput(value) ?? undefined
          break
        case 'deltaDirection':
          indicator.deltaDirection =
            (value as 'up' | 'down' | 'neutral' | '') || undefined
          break
        case 'year': {
          const nextYear = Math.max(0, Math.trunc(parseNumberInput(value)))
          point.year = nextYear
          indicator.timeSeries.sort((left, right) => left.year - right.year)
          break
        }
        case 'value':
          point.value = parseNumberInput(value)
          break
      }
    })
  }

  const updateMapCell = (rowId: string, columnId: string, value: string) => {
    patchBundle((draft) => {
      const [sectionId, groupId, indicatorId, yearLabel, municipioSlug] =
        rowId.split('::')
      const { section, indicator } = getSectionAndIndicator(
        draft,
        sectionId as IndicatorSectionId,
        groupId,
        indicatorId,
      )
      if (!section || !indicator) return

      const currentYear = Number(yearLabel)
      const mapSeries =
        getIndicatorMapSeries(
          indicator,
          Number(section.lastUpdated.slice(0, 4)) || new Date().getFullYear(),
        ) ?? {}

      const currentYearValues = { ...(mapSeries[String(currentYear)] ?? {}) }
      const currentValue = currentYearValues[municipioSlug] ?? 0
      delete currentYearValues[municipioSlug]
      if (Object.keys(currentYearValues).length > 0) {
        mapSeries[String(currentYear)] = currentYearValues
      } else {
        delete mapSeries[String(currentYear)]
      }

      const nextYear = columnId === 'year'
        ? Math.max(0, Math.trunc(parseNumberInput(value)))
        : currentYear
      const nextMunicipioSlug = columnId === 'municipioSlug'
        ? value.trim().toLowerCase()
        : municipioSlug
      const shouldClearValue = columnId === 'value' && value.trim() === ''
      const nextValue = columnId === 'value'
        ? parseNumberInput(value)
        : currentValue

      if (columnId === 'indicatorLabel') {
        indicator.label = value
      } else if (columnId === 'unit') {
        indicator.unit = value
      } else if (columnId === 'source') {
        indicator.source = value
      } else {
        if (!shouldClearValue && !mapSeries[String(nextYear)]) {
          mapSeries[String(nextYear)] = {}
        }
        if (!shouldClearValue && nextMunicipioSlug) {
          mapSeries[String(nextYear)][nextMunicipioSlug] = nextValue
        }
      }

      indicator.mapSeries = mapSeries
      syncIndicatorMapValues(section.lastUpdated, indicator)
    })
  }

  const updateMunicipioSummaryCell = (
    rowId: string,
    columnId: string,
    value: string,
  ) => {
    patchBundle((draft) => {
      const municipio = draft.municipiosIndex.find((item) => item.slug === rowId)
      const detail = draft.municipioDetails[rowId]
      if (!municipio || !detail) return

      const applyText = (nextValue: string) => {
        ;(municipio as Record<string, unknown>)[columnId] = nextValue
        ;(detail as Record<string, unknown>)[columnId] = nextValue
      }

      const applyNumber = (nextValue: number) => {
        ;(municipio as Record<string, unknown>)[columnId] = nextValue
        ;(detail as Record<string, unknown>)[columnId] = nextValue
      }

      switch (columnId) {
        case 'slug':
        case 'nome':
        case 'regiaoJudiciaria':
          applyText(value)
          break
        case 'populacao':
        case 'area':
        case 'distanciaCapital':
        case 'idhm':
        case 'lat':
        case 'lng':
          applyNumber(parseNumberInput(value))
          break
      }
    })
  }

  const updateMunicipioIndicatorCell = (
    rowId: string,
    columnId: string,
    value: string,
  ) => {
    patchBundle((draft) => {
      const [municipioSlug, section, indicatorId, yearLabel] = rowId.split('::')
      const municipio = draft.municipioDetails[municipioSlug]
      if (!municipio) return

      const indicator = municipio.indicadores.find(
        (item) =>
          item.section === section &&
          item.id === indicatorId &&
          item.year === Number(yearLabel),
      )
      if (!indicator) return

      switch (columnId) {
        case 'section':
          indicator.section = value.trim()
          break
        case 'id':
          indicator.id = value.trim()
          break
        case 'label':
          indicator.label = value
          break
        case 'value':
          indicator.value = parseNumberInput(value)
          break
        case 'unit':
          indicator.unit = value
          break
        case 'year':
          indicator.year = Math.max(0, Math.trunc(parseNumberInput(value)))
          break
      }
    })
  }

  const addDashboardKpi = () => {
    patchBundle((draft) => {
      draft.dashboard.kpis.push({
        id: `kpi_${draft.dashboard.kpis.length + 1}`,
        section: 'educacao',
        label: 'Novo KPI',
        value: 0,
        unit: '',
        year: new Date().getFullYear(),
      })
    })
  }

  const addDashboardSummary = () => {
    patchBundle((draft) => {
      draft.dashboard.sectionSummaries.push({
        section: 'educacao',
        headline: 'Novo resumo',
        value: '',
        trend: [],
      })
    })
  }

  const addIndicatorYearRow = () => {
    patchBundle((draft) => {
      if (!selectedIndicatorGroup || !selectedIndicatorId) return
      const { indicator } = getSectionAndIndicator(
        draft,
        selectedIndicatorSection,
        selectedIndicatorGroup,
        selectedIndicatorId,
      )
      if (!indicator) return

      if (indicator.timeSeries.some((point) => point.year === newSeriesYear)) {
        setStatus(createStatusMessage('error', 'Esse ano ja existe para a variavel selecionada.'))
        return
      }

      const latestPoint = indicator.timeSeries.at(-1)
      indicator.timeSeries.push({
        year: newSeriesYear,
        value: latestPoint?.value ?? 0,
      })
      indicator.timeSeries.sort((left, right) => left.year - right.year)
    })
  }

  const addIndicatorVariable = () => {
    patchBundle((draft) => {
      if (!selectedIndicatorGroup) {
        setStatus(createStatusMessage('error', 'Selecione um grupo antes de adicionar a variavel.'))
        return
      }

      const section = draft.sections[selectedIndicatorSection]
      const group = section.groups.find((item) => item.id === selectedIndicatorGroup)

      if (!group) {
        setStatus(createStatusMessage('error', 'Grupo nao encontrado para a secao selecionada.'))
        return
      }

      const normalizedId = newIndicatorId.trim().toLowerCase().replace(/\s+/g, '_')
      if (!normalizedId) {
        setStatus(createStatusMessage('error', 'Informe um ID para a nova variavel.'))
        return
      }

      if (group.indicators.some((item) => item.id === normalizedId)) {
        setStatus(createStatusMessage('error', 'Ja existe uma variavel com esse ID nesse grupo.'))
        return
      }

      group.indicators.push({
        id: normalizedId,
        label: newIndicatorLabel.trim() || normalizedId,
        description: '',
        unit: newIndicatorUnit.trim(),
        source: newIndicatorSource.trim(),
        latestValue: 0,
        timeSeries: [{ year: newIndicatorYear, value: 0 }],
      })

      setSelectedIndicatorId(normalizedId)
      setNewIndicatorId('')
      setNewIndicatorLabel('')
      setNewIndicatorUnit('')
      setNewIndicatorSource('')
      setNewSeriesYear(newIndicatorYear)
      setStatus(createStatusMessage('success', 'Variavel adicionada na planilha principal.'))
    })
  }

  const removeIndicatorVariable = () => {
    patchBundle((draft) => {
      if (!selectedIndicatorGroup || !selectedIndicatorId) return
      const section = draft.sections[selectedIndicatorSection]
      const group = section.groups.find((item) => item.id === selectedIndicatorGroup)
      if (!group) return

      group.indicators = group.indicators.filter((item) => item.id !== selectedIndicatorId)
      setSelectedIndicatorId(group.indicators[0]?.id ?? '')
      setStatus(createStatusMessage('success', 'Variavel removida.'))
    })
  }

  const addMapYear = () => {
    patchBundle((draft) => {
      const { sectionId, groupId, indicatorId } =
        parseMapVariableKey(selectedMapVariableKey)
      const { section, indicator } = getSectionAndIndicator(
        draft,
        sectionId,
        groupId,
        indicatorId,
      )
      if (!section || !indicator) return

      const mapSeries =
        getIndicatorMapSeries(
          indicator,
          Number(section.lastUpdated.slice(0, 4)) || new Date().getFullYear(),
        ) ?? {}
      const years = Object.keys(mapSeries).map(Number).sort((left, right) => left - right)
      const latestYear = years[years.length - 1] ?? new Date().getFullYear()
      const nextYear = latestYear + 1
      mapSeries[String(nextYear)] = {
        ...(mapSeries[String(latestYear)] ?? {}),
      }
      indicator.mapSeries = mapSeries
      syncIndicatorMapValues(section.lastUpdated, indicator)
      setSelectedMapYear(nextYear)
    })
  }

  const addMapMunicipioRow = () => {
    patchBundle((draft) => {
      const { sectionId, groupId, indicatorId } =
        parseMapVariableKey(selectedMapVariableKey)
      const { section, indicator } = getSectionAndIndicator(
        draft,
        sectionId,
        groupId,
        indicatorId,
      )
      if (!section || !indicator) return

      const mapSeries =
        getIndicatorMapSeries(
          indicator,
          Number(section.lastUpdated.slice(0, 4)) || new Date().getFullYear(),
        ) ?? {}
      if (!mapSeries[String(selectedMapYear)]) {
        mapSeries[String(selectedMapYear)] = {}
      }

      const usedSlugs = new Set(Object.keys(mapSeries[String(selectedMapYear)]))
      const nextMunicipio = draft.municipiosIndex.find(
        (municipio) => !usedSlugs.has(municipio.slug),
      )
      if (!nextMunicipio) return

      mapSeries[String(selectedMapYear)][nextMunicipio.slug] = 0
      indicator.mapSeries = mapSeries
      syncIndicatorMapValues(section.lastUpdated, indicator)
    })
  }

  const addMunicipioIndicator = () => {
    patchBundle((draft) => {
      if (!selectedMunicipioSlug) return
      const municipio = draft.municipioDetails[selectedMunicipioSlug]
      if (!municipio) return

      municipio.indicadores.push({
        section: 'educacao',
        id: `novo_indicador_${municipio.indicadores.length + 1}`,
        label: 'Novo indicador',
        value: 0,
        unit: '',
        year: new Date().getFullYear(),
      })
    })
  }

  const removeDashboardKpi = (rowId: string) => {
    patchBundle((draft) => {
      draft.dashboard.kpis = draft.dashboard.kpis.filter((item) => item.id !== rowId)
    })
  }

  const removeDashboardSummary = (rowId: string) => {
    patchBundle((draft) => {
      draft.dashboard.sectionSummaries = draft.dashboard.sectionSummaries.filter(
        (item) => item.section !== rowId,
      )
    })
  }

  const removeIndicatorRow = (rowId: string) => {
    patchBundle((draft) => {
      const [sectionId, groupId, indicatorId, yearLabel] = rowId.split('::')
      const { indicator } = getSectionAndIndicator(
        draft,
        sectionId as IndicatorSectionId,
        groupId,
        indicatorId,
      )
      if (!indicator) return
      indicator.timeSeries = indicator.timeSeries.filter(
        (point) => point.year !== Number(yearLabel),
      )
    })
  }

  const removeMapRow = (rowId: string) => {
    patchBundle((draft) => {
      const [sectionId, groupId, indicatorId, yearLabel, municipioSlug] =
        rowId.split('::')
      const { section, indicator } = getSectionAndIndicator(
        draft,
        sectionId as IndicatorSectionId,
        groupId,
        indicatorId,
      )
      if (!section || !indicator) return

      const mapSeries =
        getIndicatorMapSeries(
          indicator,
          Number(section.lastUpdated.slice(0, 4)) || new Date().getFullYear(),
        ) ?? {}
      const yearKey = String(Number(yearLabel))
      const yearValues = { ...(mapSeries[yearKey] ?? {}) }
      delete yearValues[municipioSlug]
      if (Object.keys(yearValues).length > 0) {
        mapSeries[yearKey] = yearValues
      } else {
        delete mapSeries[yearKey]
      }
      indicator.mapSeries = mapSeries
      syncIndicatorMapValues(section.lastUpdated, indicator)
    })
  }

  const removeMunicipioIndicatorRow = (rowId: string) => {
    patchBundle((draft) => {
      const [municipioSlug, section, indicatorId, yearLabel] = rowId.split('::')
      const municipio = draft.municipioDetails[municipioSlug]
      if (!municipio) return
      municipio.indicadores = municipio.indicadores.filter(
        (item) =>
          !(
            item.section === section &&
            item.id === indicatorId &&
            item.year === Number(yearLabel)
          ),
      )
    })
  }

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      let importedBundle: PortalDataBundle
      if (file.name.endsWith('.xlsx')) {
        importedBundle = await importBundleFromWorkbook(file)
      } else if (file.name.endsWith('.zip')) {
        importedBundle = await importBundleFromZip(file)
      } else if (file.name.endsWith('.json')) {
        importedBundle = await importBundleFromJson(file)
      } else {
        throw new Error('Formato de arquivo não suportado.')
      }

      setBundle(importedBundle)
      setStatus(createStatusMessage('success', `Arquivo ${file.name} importado.`))
      event.target.value = ''
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao importar arquivo.'
      setStatus(createStatusMessage('error', message))
      event.target.value = ''
    }
  }

  const handleMunicipalTemplateImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !bundle) return

    try {
      const importedBundle = await importMunicipalTemplateWorkbook(file, bundle)
      setBundle(importedBundle)
      setStatus(
        createStatusMessage('success', `Planilha municipal ${file.name} importada.`),
      )
      event.target.value = ''
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Falha ao importar planilha municipal.'
      setStatus(createStatusMessage('error', message))
      event.target.value = ''
    }
  }

  const dashboardKpiColumns: Array<EditableColumn<EditableDashboardKpiRow>> = [
    { id: 'id', header: 'ID', accessor: (row) => row.id, editable: true },
    {
      id: 'section',
      header: 'Seção',
      accessor: (row) => row.section,
      editable: true,
    },
    { id: 'label', header: 'Rótulo', accessor: (row) => row.label, editable: true },
    { id: 'value', header: 'Valor', accessor: (row) => row.value, editable: true },
    { id: 'unit', header: 'Unidade', accessor: (row) => row.unit, editable: true },
    {
      id: 'delta',
      header: 'Delta',
      accessor: (row) => row.delta ?? '',
      editable: true,
      type: 'number',
    },
    {
      id: 'deltaDirection',
      header: 'Direção do delta',
      accessor: (row) => row.deltaDirection,
      editable: true,
      type: 'select',
      options: [
        { value: '', label: 'Vazio' },
        { value: 'up', label: 'up' },
        { value: 'down', label: 'down' },
        { value: 'neutral', label: 'neutral' },
      ],
    },
    {
      id: 'positiveDirection',
      header: 'Direção positiva',
      accessor: (row) => row.positiveDirection,
      editable: true,
      type: 'select',
      options: [
        { value: '', label: 'Vazio' },
        { value: 'up', label: 'up' },
        { value: 'down', label: 'down' },
      ],
    },
    {
      id: 'year',
      header: 'Ano',
      accessor: (row) => row.year,
      editable: true,
      type: 'number',
    },
  ]

  const dashboardSummaryColumns: Array<EditableColumn<EditableDashboardSummaryRow>> = [
    { id: 'section', header: 'Seção', accessor: (row) => row.section, editable: true },
    {
      id: 'headline',
      header: 'Headline',
      accessor: (row) => row.headline,
      editable: true,
    },
    { id: 'value', header: 'Valor', accessor: (row) => row.value, editable: true },
    {
      id: 'trend',
      header: 'Tendência',
      accessor: (row) => row.trend,
      editable: true,
    },
  ]

  const indicatorColumns: Array<EditableColumn<EditableIndicatorRow>> = [
    { id: 'lastUpdated', header: 'Atualizado em', accessor: (row) => row.lastUpdated, editable: true },
    { id: 'indicatorLabel', header: 'Indicador', accessor: (row) => row.indicatorLabel, editable: true },
    { id: 'description', header: 'Descrição', accessor: (row) => row.description, editable: true },
    { id: 'unit', header: 'Unidade', accessor: (row) => row.unit, editable: true },
    { id: 'source', header: 'Fonte', accessor: (row) => row.source, editable: true },
    {
      id: 'latestValue',
      header: 'Último valor',
      accessor: (row) => row.latestValue ?? '',
      editable: true,
      type: 'number',
    },
    {
      id: 'delta',
      header: 'Delta',
      accessor: (row) => row.delta ?? '',
      editable: true,
      type: 'number',
    },
    {
      id: 'deltaDirection',
      header: 'Direção do delta',
      accessor: (row) => row.deltaDirection,
      editable: true,
      type: 'select',
      options: [
        { value: '', label: 'Vazio' },
        { value: 'up', label: 'up' },
        { value: 'down', label: 'down' },
        { value: 'neutral', label: 'neutral' },
      ],
    },
    {
      id: 'year',
      header: 'Ano',
      accessor: (row) => row.year,
      editable: true,
      type: 'number',
    },
    {
      id: 'value',
      header: 'Valor',
      accessor: (row) => row.value,
      editable: true,
      type: 'number',
    },
  ]

  const municipalTemplateColumns: Array<EditableColumn<EditableMunicipalTemplateRow>> = [
    { id: 'municipioNome', header: 'Município', accessor: (row) => row.municipioNome },
    { id: 'municipioSlug', header: 'Slug', accessor: (row) => row.municipioSlug },
    { id: 'indicatorLabel', header: 'Indicador', accessor: (row) => row.indicatorLabel, editable: true },
    { id: 'unit', header: 'Unidade', accessor: (row) => row.unit, editable: true },
    { id: 'source', header: 'Fonte', accessor: (row) => row.source, editable: true },
    { id: 'year', header: 'Ano', accessor: (row) => row.year, editable: true, type: 'number' },
    { id: 'value', header: 'Valor', accessor: (row) => row.value, editable: true, type: 'number' },
  ]

  const municipioColumns: Array<EditableColumn<EditableMunicipioSummaryRow>> = [
    { id: 'slug', header: 'Slug', accessor: (row) => row.slug, editable: true },
    { id: 'nome', header: 'Nome', accessor: (row) => row.nome, editable: true },
    {
      id: 'populacao',
      header: 'População',
      accessor: (row) => row.populacao,
      editable: true,
      type: 'number',
    },
    {
      id: 'area',
      header: 'Área',
      accessor: (row) => row.area,
      editable: true,
      type: 'number',
    },
    {
      id: 'regiaoJudiciaria',
      header: 'Região',
      accessor: (row) => row.regiaoJudiciaria,
      editable: true,
    },
    {
      id: 'distanciaCapital',
      header: 'Distância da capital',
      accessor: (row) => row.distanciaCapital,
      editable: true,
      type: 'number',
    },
    {
      id: 'idhm',
      header: 'IDHM',
      accessor: (row) => row.idhm,
      editable: true,
      type: 'number',
    },
    { id: 'lat', header: 'Latitude', accessor: (row) => row.lat, editable: true, type: 'number' },
    { id: 'lng', header: 'Longitude', accessor: (row) => row.lng, editable: true, type: 'number' },
  ]

  const municipioIndicatorColumns: Array<EditableColumn<EditableMunicipioIndicatorRow>> = [
    { id: 'section', header: 'Seção', accessor: (row) => row.section, editable: true },
    { id: 'id', header: 'ID', accessor: (row) => row.id, editable: true },
    { id: 'label', header: 'Rótulo', accessor: (row) => row.label, editable: true },
    {
      id: 'value',
      header: 'Valor',
      accessor: (row) => row.value,
      editable: true,
      type: 'number',
    },
    { id: 'unit', header: 'Unidade', accessor: (row) => row.unit, editable: true },
    { id: 'year', header: 'Ano', accessor: (row) => row.year, editable: true, type: 'number' },
  ]

  if (isError) {
    return (
      <AdminShell>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-10 shadow-sm">
          <p className="text-sm text-rose-700 font-jakarta">
            Nao foi possivel carregar os dados do portal.
          </p>
          {errorMessage && (
            <p className="mt-2 text-sm text-rose-600 font-jakarta">{errorMessage}</p>
          )}
        </div>
      </AdminShell>
    )
  }

  if (isLoading || !bundle) {
    return (
      <AdminShell>
        <div className="rounded-2xl border border-areia-200 bg-white p-10 shadow-sm">
          <p className="text-sm text-areia-500 font-jakarta">Carregando caderno de dados...</p>
        </div>
      </AdminShell>
    )
  }

  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {TABS.map((tab) => (
          <TabButton
            key={tab.id}
            active={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </TabButton>
        ))}
      </div>

      <div className="mb-6 rounded-2xl border border-areia-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-areia-800 font-fraunces">
          Fluxo simplificado
        </p>
        <p className="mt-2 text-sm text-areia-500 font-jakarta">
          Primeiro cadastre ou remova variaveis na planilha principal. Depois escolha o ano e
          preencha a planilha municipal para os municipios. Se preferir trabalhar no Excel,
          baixe o modelo municipal, preencha e importe de volta.
        </p>
      </div>

      {status && (
        <div
          className={cn(
            'mb-6 rounded-2xl border px-4 py-3 text-sm font-medium font-jakarta shadow-sm',
            status.kind === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700',
          )}
        >
          {status.message}
        </div>
      )}

      {duplicateMapRows.length > 0 && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 font-jakarta shadow-sm">
          Existem linhas duplicadas no dataset cartográfico. Corrija combinações repetidas de
          indicador + ano + município antes de exportar.
        </div>
      )}

      <div className="space-y-6">
        {activeTab === 'indicadores' && (
          <SectionCard
            title="Planilha principal de variáveis"
            description="Cadastre a variavel, defina o ano e edite os valores anuais como numa planilha."
            actions={
              <>
                <ActionButton onClick={addIndicatorVariable}>Adicionar variavel</ActionButton>
                <ActionButton onClick={addIndicatorYearRow}>Adicionar ano</ActionButton>
                <ActionButton variant="danger" onClick={removeIndicatorVariable}>
                  Excluir variavel
                </ActionButton>
              </>
            }
          >
            <div className="mb-4 grid grid-cols-1 gap-3 rounded-2xl border border-areia-200 bg-areia-50 p-4 lg:grid-cols-3">
              <select
                value={selectedIndicatorSection}
                onChange={(event) =>
                  setSelectedIndicatorSection(event.currentTarget.value as IndicatorSectionId)
                }
                className="rounded-xl border border-areia-200 bg-areia-50 px-3 py-2 text-sm font-jakarta"
              >
                {INDICATOR_SECTION_IDS.map((sectionId) => (
                  <option key={sectionId} value={sectionId}>
                    {formatSectionLabel(sectionId)}
                  </option>
                ))}
              </select>
              <input
                value={newIndicatorId}
                onChange={(event) => setNewIndicatorId(event.currentTarget.value)}
                placeholder="ID da nova variavel"
                className="rounded-xl border border-areia-200 bg-white px-3 py-2 text-sm font-jakarta"
              />
              <input
                value={newIndicatorLabel}
                onChange={(event) => setNewIndicatorLabel(event.currentTarget.value)}
                placeholder="Nome da nova variavel"
                className="rounded-xl border border-areia-200 bg-white px-3 py-2 text-sm font-jakarta"
              />
              <input
                value={newIndicatorUnit}
                onChange={(event) => setNewIndicatorUnit(event.currentTarget.value)}
                placeholder="Unidade"
                className="rounded-xl border border-areia-200 bg-white px-3 py-2 text-sm font-jakarta"
              />
              <input
                value={newIndicatorSource}
                onChange={(event) => setNewIndicatorSource(event.currentTarget.value)}
                placeholder="Fonte"
                className="rounded-xl border border-areia-200 bg-white px-3 py-2 text-sm font-jakarta"
              />
              <input
                type="number"
                value={newIndicatorYear}
                onChange={(event) => setNewIndicatorYear(parseNumberInput(event.currentTarget.value))}
                placeholder="Ano inicial"
                className="rounded-xl border border-areia-200 bg-white px-3 py-2 text-sm font-jakarta"
              />
            </div>

            <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
              <select
                value={selectedIndicatorGroup}
                onChange={(event) => setSelectedIndicatorGroup(event.currentTarget.value)}
                className="rounded-xl border border-areia-200 bg-areia-50 px-3 py-2 text-sm font-jakarta"
              >
                {selectedGroupOptions.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.label}
                  </option>
                ))}
              </select>

              <select
                value={selectedIndicatorId}
                onChange={(event) => setSelectedIndicatorId(event.currentTarget.value)}
                className="rounded-xl border border-areia-200 bg-areia-50 px-3 py-2 text-sm font-jakarta"
              >
                {selectedIndicatorOptions.map((indicator) => (
                  <option key={indicator.id} value={indicator.id}>
                    {indicator.label}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={newSeriesYear}
                onChange={(event) => setNewSeriesYear(parseNumberInput(event.currentTarget.value))}
                placeholder="Ano para adicionar"
                className="rounded-xl border border-areia-200 bg-areia-50 px-3 py-2 text-sm font-jakarta"
              />
              <div className="rounded-xl border border-areia-200 bg-white px-3 py-2 text-sm text-areia-500 font-jakarta">
                {selectedIndicatorId
                  ? `Variavel ativa: ${selectedIndicatorId}`
                  : 'Selecione ou crie uma variavel'}
              </div>
            </div>

            <EditableDataTable
              data={filteredIndicatorRows}
              columns={indicatorColumns}
              emptyMessage="Nenhuma série encontrada para o filtro atual."
              onCellChange={updateIndicatorCell}
              rowActions={(row) => (
                <ActionButton
                  variant="danger"
                  onClick={() => removeIndicatorRow(row.rowId)}
                >
                  Remover
                </ActionButton>
              )}
            />
          </SectionCard>
        )}

        {activeTab === 'mapa' && (
          <SectionCard
            title="Planilha municipal"
            description="Escolha a variavel e o ano. Depois preencha uma linha por municipio, como no Excel."
            actions={
              <>
                <ActionButton onClick={addMapYear}>Adicionar ano ao mapa</ActionButton>
                <ActionButton
                  onClick={() => {
                    void downloadMunicipalTemplateWorkbook(
                      bundle,
                      selectedMapVariableKey,
                      selectedMapYear,
                    )
                    setStatus(createStatusMessage('success', 'Modelo municipal exportado.'))
                  }}
                >
                  Baixar modelo Excel
                </ActionButton>
                <label className="inline-flex cursor-pointer items-center rounded-full border border-areia-200 bg-white px-3 py-2 text-xs font-semibold text-areia-700 shadow-sm transition hover:border-areia-300 font-jakarta">
                  Importar modelo Excel
                  <input
                    type="file"
                    accept=".xlsx"
                    className="hidden"
                    onChange={handleMunicipalTemplateImport}
                  />
                </label>
              </>
            }
          >
            <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,2fr)_180px_minmax(0,1fr)]">
              <select
                value={selectedMapVariableKey}
                onChange={(event) => setSelectedMapVariableKey(event.currentTarget.value)}
                className="rounded-xl border border-areia-200 bg-areia-50 px-3 py-2 text-sm font-jakarta"
              >
                {mapVariableOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.sectionLabel} — {option.indicatorLabel}
                  </option>
                ))}
              </select>

              <select
                value={selectedMapYear}
                onChange={(event) => setSelectedMapYear(Number(event.currentTarget.value))}
                className="rounded-xl border border-areia-200 bg-areia-50 px-3 py-2 text-sm font-jakarta"
              >
                {(selectedMapOption?.years ?? []).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>

              <input
                value={mapMunicipioFilter}
                onChange={(event) => setMapMunicipioFilter(event.currentTarget.value)}
                placeholder="Filtrar município por slug"
                className="rounded-xl border border-areia-200 bg-areia-50 px-3 py-2 text-sm font-jakarta"
              />
            </div>

            {selectedMapOption && (
              <div className="mb-4 rounded-xl border border-areia-200 bg-areia-50 px-4 py-3 text-sm text-areia-600 font-jakarta">
                <span className="font-semibold text-areia-800">
                  {selectedMapOption.indicatorLabel}
                </span>{' '}
                · {selectedMapOption.source} · anos disponiveis:{' '}
                {selectedMapOption.years.join(', ')}
              </div>
            )}

            <EditableDataTable
              data={filteredMapRows}
              columns={municipalTemplateColumns}
              emptyMessage="Nenhuma linha municipal encontrada para a variavel/ano atual."
              onCellChange={updateMapCell}
              rowActions={(row) => (
                <ActionButton variant="danger" onClick={() => updateMapCell(row.rowId, 'value', '')}>
                  Limpar
                </ActionButton>
              )}
            />
          </SectionCard>
        )}

        {activeTab === 'importar' && (
          <SectionCard
            title="Modelos e importacao"
            description="Use o Excel completo para backup geral ou o modelo municipal para preenchimento mais rapido."
          >
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-areia-200 bg-areia-50 p-5">
                <p className="text-sm font-semibold text-areia-800 font-fraunces">
                  Importar arquivo
                </p>
                <p className="mt-1 text-sm text-areia-500 font-jakarta">
                  Formatos suportados: <code>.xlsx</code>, <code>.json</code> e <code>.zip</code>.
                </p>
                <label className="mt-4 inline-flex cursor-pointer items-center rounded-full border border-areia-200 bg-white px-4 py-2 text-sm font-medium text-areia-700 shadow-sm hover:border-areia-300 font-jakarta">
                  Importar planilha completa
                  <input
                    type="file"
                    accept=".xlsx,.json,.zip"
                    className="hidden"
                    onChange={handleImport}
                  />
                </label>
              </div>

              <div className="rounded-2xl border border-areia-200 bg-areia-50 p-5">
                <p className="text-sm font-semibold text-areia-800 font-fraunces">
                  Exportar artefatos
                </p>
                <p className="mt-1 text-sm text-areia-500 font-jakarta">
                  Baixe uma planilha completa do portal ou o bundle pronto para publicar.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <ActionButton
                    onClick={() => {
                      void downloadBundleAsWorkbook(bundle)
                      setStatus(createStatusMessage('success', 'Planilha exportada.'))
                    }}
                  >
                    Exportar XLSX
                  </ActionButton>
                  <ActionButton
                    onClick={() => {
                      void downloadBundleAsZip(bundle)
                      setStatus(createStatusMessage('success', 'ZIP exportado.'))
                    }}
                  >
                    Exportar ZIP
                  </ActionButton>
                  <ActionButton
                    onClick={() => {
                      downloadBundleAsJson(bundle)
                      setStatus(createStatusMessage('success', 'JSON exportado.'))
                    }}
                  >
                    Exportar JSON
                  </ActionButton>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-areia-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-areia-800 font-fraunces">
                Modelo municipal
              </p>
              <p className="mt-1 text-sm text-areia-500 font-jakarta">
                Escolha uma variavel na aba Planilha municipal, baixe o modelo em Excel, preencha
                os municipios e importe de volta por la mesma.
              </p>
            </div>
          </SectionCard>
        )}
      </div>
    </AdminShell>
  )
}
