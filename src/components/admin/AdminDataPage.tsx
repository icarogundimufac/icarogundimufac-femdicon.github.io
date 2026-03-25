import { useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils/cn'
import {
  DEFAULT_MAP_VARIABLE_KEY,
  buildMapVariableKey,
  bundleToMunicipalTemplateRows,
  bundleToDashboardKpiRows,
  bundleToDashboardSummaryRows,
  bundleToIndicatorRows,
  bundleToMunicipioIndicatorRows,
  bundleToMunicipioSummaryRows,
  getIndicatorMapSeries,
} from '@/lib/data/workbook'
import {
  INDICATOR_SECTION_IDS,
  type IndicatorSectionId,
} from '@/lib/constants/indicator-sections'
import { queryKeys } from '@/lib/data/client'
import type { PortalDataBundle } from '@/types/admin-data'

import { useBundleMutations, type StatusMessage } from './hooks/useBundleMutations'
import { useImportExport } from './hooks/useImportExport'
import { useSectionPersistence } from './hooks/useSectionPersistence'
import { useSpreadsheetState, SHEET_DEFINITIONS, type SheetId } from './hooks/useSpreadsheetState'

import { SpreadsheetShell } from './SpreadsheetShell'
import { SpreadsheetToolbar } from './SpreadsheetToolbar'
import { FormulaBar } from './FormulaBar'
import { SpreadsheetGrid } from './SpreadsheetGrid'
import { SheetTabBar } from './SheetTabBar'

import { MapaFormPanel } from './MapaFormPanel'

import { municipiosColumns } from './sheets/MunicipiosSheet'
import { municipioIndicadoresColumns } from './sheets/MunicipioIndicadoresSheet'
import { mapaColumns } from './sheets/MapaSheet'
import { indicadoresColumns } from './sheets/IndicadoresSheet'
import { dashboardKpiColumns, dashboardSummaryColumns } from './sheets/DashboardSheet'

interface AdminDataPageProps {
  initialBundle: PortalDataBundle | null
  isLoading?: boolean
  isError?: boolean
  errorMessage?: string | null
}

function formatSectionLabel(sectionId: string) {
  return sectionId.replace(/^\w/, (char) => char.toUpperCase())
}

export function AdminDataPage({
  initialBundle,
  isLoading = false,
  isError = false,
  errorMessage = null,
}: AdminDataPageProps) {
  const [bundle, setBundle] = useState<PortalDataBundle | null>(initialBundle)
  const [status, setStatus] = useState<StatusMessage | null>(null)

  // Sheet-specific filter state
  const [selectedIndicatorSection, setSelectedIndicatorSection] =
    useState<IndicatorSectionId>('educacao')
  const [selectedIndicatorGroup, setSelectedIndicatorGroup] = useState('')
  const [selectedIndicatorId, setSelectedIndicatorId] = useState('')
  const [selectedMapVariableKey, setSelectedMapVariableKey] = useState(DEFAULT_MAP_VARIABLE_KEY)
  const [selectedMapYear, setSelectedMapYear] = useState<number>(2023)
  const [mapMunicipioFilter, setMapMunicipioFilter] = useState('')
  const [selectedMunicipioSlug, setSelectedMunicipioSlug] = useState('')

  const prevMapVariableKeyRef = useRef(selectedMapVariableKey)

  const queryClient = useQueryClient()

  const spreadsheet = useSpreadsheetState()
  const mutations = useBundleMutations(bundle, setBundle, setStatus)
  const importExport = useImportExport(bundle, setBundle, setStatus)
  const { requestImmediateSectionPersist } = useSectionPersistence({
    bundle,
    queryClient,
    setStatus,
  })

  useEffect(() => {
    if (initialBundle) setBundle(initialBundle)
  }, [initialBundle])

  useEffect(() => {
    if (!bundle) return
    queryClient.setQueryData(queryKeys.portalDataBundle, bundle)
  }, [bundle, queryClient])

  // Auto-dismiss status after 4s
  useEffect(() => {
    if (!status) return
    const timer = setTimeout(() => setStatus(null), 4000)
    return () => clearTimeout(timer)
  }, [status])

  // Memoized rows
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
              ...indicator.timeSeries.map((p) => p.year),
              ...Object.keys(getIndicatorMapSeries(indicator, fallbackYear) ?? {}).map(Number),
            ]),
          ).sort((a, b) => a - b)
          if (years.length === 0) return []
          return [{
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
          }]
        }),
      )
    }).sort((a, b) => a.indicatorLabel.localeCompare(b.indicatorLabel))
  }, [bundle])

  // Sync selection effects
  const selectedSection = bundle?.sections[selectedIndicatorSection]
  const selectedGroupOptions = selectedSection?.groups ?? []
  const selectedIndicatorOptions =
    selectedGroupOptions.find((g) => g.id === selectedIndicatorGroup)?.indicators ?? []
  const selectedMapOption = mapVariableOptions.find((o) => o.key === selectedMapVariableKey)

  useEffect(() => {
    if (!selectedGroupOptions.length) return
    if (!selectedGroupOptions.some((g) => g.id === selectedIndicatorGroup)) {
      setSelectedIndicatorGroup(selectedGroupOptions[0]?.id ?? '')
    }
  }, [selectedGroupOptions, selectedIndicatorGroup])

  useEffect(() => {
    if (!selectedIndicatorOptions.length) return
    if (!selectedIndicatorOptions.some((i) => i.id === selectedIndicatorId)) {
      setSelectedIndicatorId(selectedIndicatorOptions[0]?.id ?? '')
    }
  }, [selectedIndicatorOptions, selectedIndicatorId])

  useEffect(() => {
    if (municipioRows.length === 0) return
    if (!municipioRows.some((m) => m.slug === selectedMunicipioSlug)) {
      setSelectedMunicipioSlug(municipioRows[0]?.slug ?? '')
    }
  }, [municipioRows, selectedMunicipioSlug])

  useEffect(() => {
    if (mapVariableOptions.length === 0) return
    if (!mapVariableOptions.some((o) => o.key === selectedMapVariableKey)) {
      const fallback =
        mapVariableOptions.find((o) => o.key === DEFAULT_MAP_VARIABLE_KEY) ??
        mapVariableOptions[0]
      setSelectedMapVariableKey(fallback.key)
      setSelectedMapYear(fallback.years[fallback.years.length - 1] ?? 0)
      prevMapVariableKeyRef.current = fallback.key
      return
    }
    // Só reseta o ano quando a variável mudou — preserva o ano digitado pelo usuário
    if (prevMapVariableKeyRef.current !== selectedMapVariableKey) {
      prevMapVariableKeyRef.current = selectedMapVariableKey
      const current = mapVariableOptions.find((o) => o.key === selectedMapVariableKey)
      if (current && current.years.length > 0) {
        setSelectedMapYear(current.years[current.years.length - 1])
      }
    }
  }, [mapVariableOptions, selectedMapVariableKey])

  // Filtered rows for active sheet
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
              !mapMunicipioFilter ||
              row.municipioSlug.includes(mapMunicipioFilter.toLowerCase()) ||
              row.municipioNome.toLowerCase().includes(mapMunicipioFilter.toLowerCase()),
          )
        : [],
    [bundle, mapMunicipioFilter, selectedMapVariableKey, selectedMapYear],
  )

  const filteredMunicipioIndicatorRows = useMemo(
    () => municipioIndicatorRows.filter((row) => row.municipioSlug === selectedMunicipioSlug),
    [municipioIndicatorRows, selectedMunicipioSlug],
  )

  // Resolve active sheet data
  const activeSheetDef = SHEET_DEFINITIONS.find((s) => s.id === spreadsheet.activeSheet)!

  const rowCounts: Record<SheetId, number> = {
    municipios: municipioRows.length,
    municipio_indicadores: filteredMunicipioIndicatorRows.length,
    mapa: filteredMapRows.length,
    indicadores: filteredIndicatorRows.length,
    dashboard_kpis: dashboardKpiRows.length,
    dashboard_resumos: dashboardSummaryRows.length,
  }

  // --- Determine what to render for the active sheet ---
  function getActiveSheetConfig() {
    switch (spreadsheet.activeSheet) {
      case 'municipios':
        return {
          data: municipioRows,
          columns: municipiosColumns,
          emptyMessage: 'Nenhum municipio encontrado.',
          onCellChange: mutations.updateMunicipioSummaryCell,
          onAddRow: undefined,
          onRemoveRow: undefined,
          showTemplate: false,
          sheetControls: null,
        }
      case 'municipio_indicadores':
        return {
          data: filteredMunicipioIndicatorRows,
          columns: municipioIndicadoresColumns,
          emptyMessage: 'Nenhum indicador encontrado para o municipio selecionado.',
          onCellChange: mutations.updateMunicipioIndicatorCell,
          onAddRow: () => mutations.addMunicipioIndicator(selectedMunicipioSlug),
          onRemoveRow: undefined,
          showTemplate: false,
          sheetControls: (
            <div className="flex items-center gap-2 border-b border-areia-200 bg-areia-50/30 px-3 py-1.5">
              <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-areia-400 font-jakarta">
                Municipio
              </label>
              <select
                value={selectedMunicipioSlug}
                onChange={(e) => setSelectedMunicipioSlug(e.currentTarget.value)}
                className="rounded-md border border-areia-200 bg-white px-2 py-1 text-[11px] text-areia-700 font-jakarta"
              >
                {municipioRows.map((m) => (
                  <option key={m.slug} value={m.slug}>{m.nome}</option>
                ))}
              </select>
            </div>
          ),
        }
      case 'mapa':
        return {
          data: filteredMapRows,
          columns: mapaColumns,
          emptyMessage: 'Nenhuma linha municipal encontrada.',
          onCellChange: mutations.updateMapCell,
          onAddRow: undefined,
          onRemoveRow: undefined,
          showTemplate: false,
          sheetControls: null,
        }
      case 'indicadores':
        return {
          data: filteredIndicatorRows,
          columns: indicadoresColumns,
          emptyMessage: 'Nenhuma serie encontrada para o filtro atual.',
          onCellChange: mutations.updateIndicatorCell,
          onAddRow: () =>
            mutations.addIndicatorYearRow(
              selectedIndicatorSection,
              selectedIndicatorGroup,
              selectedIndicatorId,
              new Date().getFullYear(),
            ),
          onRemoveRow: undefined,
          showTemplate: false,
          sheetControls: (
            <div className="flex flex-wrap items-center gap-2 border-b border-areia-200 bg-areia-50/30 px-3 py-1.5">
              <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-areia-400 font-jakarta">
                Secao
              </label>
              <select
                value={selectedIndicatorSection}
                onChange={(e) =>
                  setSelectedIndicatorSection(e.currentTarget.value as IndicatorSectionId)
                }
                className="rounded-md border border-areia-200 bg-white px-2 py-1 text-[11px] text-areia-700 font-jakarta"
              >
                {INDICATOR_SECTION_IDS.map((id) => (
                  <option key={id} value={id}>{formatSectionLabel(id)}</option>
                ))}
              </select>
              <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-areia-400 font-jakarta ml-1">
                Grupo
              </label>
              <select
                value={selectedIndicatorGroup}
                onChange={(e) => setSelectedIndicatorGroup(e.currentTarget.value)}
                className="rounded-md border border-areia-200 bg-white px-2 py-1 text-[11px] text-areia-700 font-jakarta"
              >
                {selectedGroupOptions.map((g) => (
                  <option key={g.id} value={g.id}>{g.label}</option>
                ))}
              </select>
              <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-areia-400 font-jakarta ml-1">
                Indicador
              </label>
              <select
                value={selectedIndicatorId}
                onChange={(e) => setSelectedIndicatorId(e.currentTarget.value)}
                className="max-w-[200px] rounded-md border border-areia-200 bg-white px-2 py-1 text-[11px] text-areia-700 font-jakarta"
              >
                {selectedIndicatorOptions.map((i) => (
                  <option key={i.id} value={i.id}>{i.label}</option>
                ))}
              </select>
            </div>
          ),
        }
      case 'dashboard_kpis':
        return {
          data: dashboardKpiRows,
          columns: dashboardKpiColumns,
          emptyMessage: 'Nenhum KPI encontrado.',
          onCellChange: mutations.updateDashboardKpiCell,
          onAddRow: mutations.addDashboardKpi,
          onRemoveRow: undefined,
          showTemplate: false,
          sheetControls: null,
        }
      case 'dashboard_resumos':
        return {
          data: dashboardSummaryRows,
          columns: dashboardSummaryColumns,
          emptyMessage: 'Nenhum resumo encontrado.',
          onCellChange: mutations.updateDashboardSummaryCell,
          onAddRow: mutations.addDashboardSummary,
          onRemoveRow: undefined,
          showTemplate: false,
          sheetControls: null,
        }
    }
  }

  // --- Error/Loading states ---
  if (isError) {
    return (
      <SpreadsheetShell>
        <div className="flex flex-1 items-center justify-center">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-10 shadow-sm">
            <p className="text-sm text-rose-700 font-jakarta">
              Nao foi possivel carregar os dados do portal.
            </p>
            {errorMessage && (
              <p className="mt-2 text-sm text-rose-600 font-jakarta">{errorMessage}</p>
            )}
          </div>
        </div>
      </SpreadsheetShell>
    )
  }

  if (isLoading || !bundle) {
    return (
      <SpreadsheetShell>
        <div className="flex flex-1 items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-verde-200 border-t-verde-600" />
            <p className="text-sm text-areia-500 font-jakarta">Carregando caderno de dados...</p>
          </div>
        </div>
      </SpreadsheetShell>
    )
  }

  const config = getActiveSheetConfig()
  const handleMapIndicatorSave = (
    params: Parameters<typeof mutations.saveMapIndicatorForm>[0],
  ) => {
    requestImmediateSectionPersist(params.sectionId)
    mutations.saveMapIndicatorForm(params)
  }

  return (
    <SpreadsheetShell>
      {/* Status toast */}
      {status && (
        <div
          className={cn(
            'mx-2 mt-2 rounded-lg border px-3 py-2 text-[11px] font-semibold font-jakarta shadow-sm animate-fade-in',
            status.kind === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700',
          )}
        >
          {status.message}
        </div>
      )}

      {/* Toolbar */}
      <SpreadsheetToolbar
        onImport={importExport.handleImport}
        onImportTemplate={importExport.handleMunicipalTemplateImport}
        onExportXlsx={importExport.exportWorkbook}
        onExportZip={importExport.exportZip}
        onExportJson={importExport.exportJson}
        onDownloadTemplate={() =>
          importExport.exportMunicipalTemplate(selectedMapVariableKey, selectedMapYear)
        }
        onAddRow={config.onAddRow}
        showTemplateActions={config.showTemplate}
        templateLabel={
          selectedMapOption
            ? `Modelo: ${selectedMapOption.indicatorLabel} ${selectedMapYear}`
            : 'Baixar modelo'
        }
      />

      {/* Formula bar */}
      <FormulaBar
        selectedCell={spreadsheet.selectedCell}
        sheetLabel={activeSheetDef.label}
        rowCount={rowCounts[spreadsheet.activeSheet]}
      />

      {/* Sheet-specific controls */}
      {config.sheetControls}

      {/* Grid or form panel */}
      {spreadsheet.activeSheet === 'mapa' ? (
        <MapaFormPanel
          bundle={bundle}
          mapVariableOptions={mapVariableOptions}
          selectedMapVariableKey={selectedMapVariableKey}
          onVariableChange={setSelectedMapVariableKey}
          onSave={handleMapIndicatorSave}
        />
      ) : (
        <SpreadsheetGrid
          data={config.data}
          columns={config.columns}
          emptyMessage={config.emptyMessage}
          selectedCell={spreadsheet.selectedCell}
          editingCell={spreadsheet.editingCell}
          onSelectCell={spreadsheet.selectCell}
          onStartEditing={spreadsheet.startEditing}
          onStopEditing={spreadsheet.stopEditing}
          onCellChange={config.onCellChange}
        />
      )}

      {/* Sheet tabs */}
      <SheetTabBar
        activeSheet={spreadsheet.activeSheet}
        onSheetChange={spreadsheet.changeSheet}
        rowCounts={rowCounts}
      />
    </SpreadsheetShell>
  )
}
