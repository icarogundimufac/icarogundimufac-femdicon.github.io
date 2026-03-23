import type { Dispatch, SetStateAction } from 'react'
import {
  getIndicatorLatestByMunicipio,
  getIndicatorMapSeries,
  parseMapVariableKey,
} from '@/lib/data/workbook'
import type { IndicatorSectionId } from '@/lib/constants/indicator-sections'
import type { PortalDataBundle } from '@/types/admin-data'
import type { Indicator } from '@/types/indicators'

export interface StatusMessage {
  kind: 'success' | 'error'
  message: string
}

function parseNumberInput(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function parseOptionalNumberInput(value: string) {
  if (value.trim() === '') return null
  return parseNumberInput(value)
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

export function useBundleMutations(
  bundle: PortalDataBundle | null,
  setBundle: Dispatch<SetStateAction<PortalDataBundle | null>>,
  setStatus: (status: StatusMessage | null) => void,
) {
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

  const addIndicatorYearRow = (
    sectionId: IndicatorSectionId,
    groupId: string,
    indicatorId: string,
    year: number,
  ) => {
    patchBundle((draft) => {
      if (!groupId || !indicatorId) return
      const { indicator } = getSectionAndIndicator(draft, sectionId, groupId, indicatorId)
      if (!indicator) return

      if (indicator.timeSeries.some((point) => point.year === year)) {
        setStatus({ kind: 'error', message: 'Esse ano ja existe para a variavel selecionada.' })
        return
      }

      const latestPoint = indicator.timeSeries.at(-1)
      indicator.timeSeries.push({ year, value: latestPoint?.value ?? 0 })
      indicator.timeSeries.sort((left, right) => left.year - right.year)
    })
  }

  const addIndicatorVariable = (
    sectionId: IndicatorSectionId,
    groupId: string,
    newId: string,
    newLabel: string,
    newUnit: string,
    newSource: string,
    newYear: number,
  ) => {
    patchBundle((draft) => {
      if (!groupId) {
        setStatus({ kind: 'error', message: 'Selecione um grupo antes de adicionar a variavel.' })
        return
      }

      const section = draft.sections[sectionId]
      const group = section.groups.find((item) => item.id === groupId)

      if (!group) {
        setStatus({ kind: 'error', message: 'Grupo nao encontrado para a secao selecionada.' })
        return
      }

      const normalizedId = newId.trim().toLowerCase().replace(/\s+/g, '_')
      if (!normalizedId) {
        setStatus({ kind: 'error', message: 'Informe um ID para a nova variavel.' })
        return
      }

      if (group.indicators.some((item) => item.id === normalizedId)) {
        setStatus({ kind: 'error', message: 'Ja existe uma variavel com esse ID nesse grupo.' })
        return
      }

      group.indicators.push({
        id: normalizedId,
        label: newLabel.trim() || normalizedId,
        description: '',
        unit: newUnit.trim(),
        source: newSource.trim(),
        latestValue: 0,
        timeSeries: [{ year: newYear, value: 0 }],
      })

      setStatus({ kind: 'success', message: 'Variavel adicionada na planilha principal.' })
    })
  }

  const removeIndicatorVariable = (
    sectionId: IndicatorSectionId,
    groupId: string,
    indicatorId: string,
  ) => {
    patchBundle((draft) => {
      if (!groupId || !indicatorId) return
      const section = draft.sections[sectionId]
      const group = section.groups.find((item) => item.id === groupId)
      if (!group) return

      group.indicators = group.indicators.filter((item) => item.id !== indicatorId)
      setStatus({ kind: 'success', message: 'Variavel removida.' })
    })
  }

  const addMapYear = (selectedMapVariableKey: string) => {
    patchBundle((draft) => {
      const { sectionId, groupId, indicatorId } =
        parseMapVariableKey(selectedMapVariableKey)
      const { section, indicator } = getSectionAndIndicator(draft, sectionId, groupId, indicatorId)
      if (!section || !indicator) return

      const mapSeries =
        getIndicatorMapSeries(
          indicator,
          Number(section.lastUpdated.slice(0, 4)) || new Date().getFullYear(),
        ) ?? {}
      const years = Object.keys(mapSeries).map(Number).sort((left, right) => left - right)
      const latestYear = years[years.length - 1] ?? new Date().getFullYear()
      const nextYear = latestYear + 1
      mapSeries[String(nextYear)] = { ...(mapSeries[String(latestYear)] ?? {}) }
      indicator.mapSeries = mapSeries
      syncIndicatorMapValues(section.lastUpdated, indicator)
    })
  }

  const addMapMunicipioRow = (selectedMapVariableKey: string, selectedMapYear: number) => {
    patchBundle((draft) => {
      const { sectionId, groupId, indicatorId } =
        parseMapVariableKey(selectedMapVariableKey)
      const { section, indicator } = getSectionAndIndicator(draft, sectionId, groupId, indicatorId)
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

  const addMunicipioIndicator = (selectedMunicipioSlug: string) => {
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

  return {
    updateDashboardKpiCell,
    updateDashboardSummaryCell,
    updateIndicatorCell,
    updateMapCell,
    updateMunicipioSummaryCell,
    updateMunicipioIndicatorCell,
    addDashboardKpi,
    addDashboardSummary,
    addIndicatorYearRow,
    addIndicatorVariable,
    removeIndicatorVariable,
    addMapYear,
    addMapMunicipioRow,
    addMunicipioIndicator,
    removeDashboardKpi,
    removeDashboardSummary,
    removeIndicatorRow,
    removeMapRow,
    removeMunicipioIndicatorRow,
  }
}
