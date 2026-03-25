import { useEffect, useRef, useState } from 'react'
import { MUNICIPIOS } from '@/lib/constants/municipios'
import {
  INDICATOR_SECTION_IDS,
  INDICATOR_SECTION_META,
  type IndicatorSectionId,
} from '@/lib/constants/indicator-sections'
import { getIndicatorMapSeries, parseMapVariableKey } from '@/lib/data/workbook'
import type { PortalDataBundle } from '@/types/admin-data'
import type { SaveMapIndicatorFormParams } from './hooks/useBundleMutations'
import { SpreadsheetGrid, type GridColumn } from './SpreadsheetGrid'

interface MapVariableOption {
  key: string
  sectionId: IndicatorSectionId
  sectionLabel: string
  groupId: string
  indicatorId: string
  indicatorLabel: string
  years: number[]
}

interface MapaFormPanelProps {
  bundle: PortalDataBundle
  mapVariableOptions: MapVariableOption[]
  selectedMapVariableKey: string
  onVariableChange: (key: string) => void
  onSave: (params: SaveMapIndicatorFormParams) => void
}

interface MunicipioValueRow {
  rowId: string
  municipioNome: string
  value: string
}

const municipioValueColumns: GridColumn<MunicipioValueRow>[] = [
  {
    id: 'municipioNome',
    header: 'Município',
    accessor: (row) => row.municipioNome,
    width: 220,
  },
  {
    id: 'value',
    header: 'Valor',
    accessor: (row) => row.value,
    editable: true,
    type: 'number',
    width: 140,
  },
]

const inputClass =
  'rounded-md border border-areia-200 bg-white px-2 py-1 text-[11px] text-areia-700 font-jakarta focus:border-verde-400 focus:outline-none focus:ring-1 focus:ring-verde-200 transition-colors'
const labelClass =
  'text-[10px] font-bold uppercase tracking-[0.12em] text-areia-400 font-jakarta'

export function MapaFormPanel({
  bundle,
  mapVariableOptions,
  selectedMapVariableKey,
  onVariableChange,
  onSave,
}: MapaFormPanelProps) {
  const [mode, setMode] = useState<'edit' | 'new'>('edit')
  const [sectionId, setSectionId] = useState<IndicatorSectionId>('educacao')
  const [groupId, setGroupId] = useState('')
  const [label, setLabel] = useState('')
  const [description, setDescription] = useState('')
  const [unit, setUnit] = useState('')
  const [source, setSource] = useState('')
  const [year, setYear] = useState(new Date().getFullYear())
  const [values, setValues] = useState<Record<string, string>>({})

  // Spreadsheet cell state
  const [selectedCell, setSelectedCell] = useState<{
    rowIndex: number
    columnId: string
  } | null>(null)
  const [editingCell, setEditingCell] = useState<{
    rowIndex: number
    columnId: string
  } | null>(null)

  // Refs para leitura síncrona sem adicionar às deps do effect
  const bundleRef = useRef(bundle)
  bundleRef.current = bundle
  const valuesRef = useRef<Record<string, string>>(values)
  valuesRef.current = values

  // Recarrega todos os campos somente quando a VARIÁVEL muda (não no save nem na troca de ano)
  useEffect(() => {
    if (mode !== 'edit' || !selectedMapVariableKey) return

    const b = bundleRef.current
    const { sectionId: sid, groupId: gid, indicatorId: iid } =
      parseMapVariableKey(selectedMapVariableKey)
    const section = b.sections[sid as IndicatorSectionId]
    if (!section) return
    const group = section.groups.find((g) => g.id === gid)
    const indicator = group?.indicators.find((i) => i.id === iid)
    if (!indicator) return

    const fallbackYear =
      Number(section.lastUpdated.slice(0, 4)) || new Date().getFullYear()
    const mapSeries = getIndicatorMapSeries(indicator, fallbackYear) ?? {}
    const yearKeys = Object.keys(mapSeries).map(Number).sort((a, b) => a - b)
    const lastYear = yearKeys[yearKeys.length - 1] ?? fallbackYear

    setSectionId(sid as IndicatorSectionId)
    setGroupId(gid)
    setLabel(indicator.label)
    setDescription(indicator.description ?? '')
    setUnit(indicator.unit)
    setSource(indicator.source)
    setYear(lastYear)

    const yearValues = mapSeries[String(lastYear)] ?? {}
    setValues(
      Object.fromEntries(
        Object.entries(yearValues).map(([slug, val]) => [slug, String(val)]),
      ),
    )
    setSelectedCell(null)
    setEditingCell(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, selectedMapVariableKey])

  // Reset groupId to first available when sectionId changes in new mode
  useEffect(() => {
    if (mode !== 'new') return
    const groups = bundle.sections[sectionId]?.groups ?? []
    if (groups.length > 0 && !groups.some((g) => g.id === groupId)) {
      setGroupId(groups[0].id)
    }
  }, [sectionId, mode, bundle, groupId])

  const groupOptions = bundle.sections[sectionId]?.groups ?? []
  const filledCount = MUNICIPIOS.filter((m) => values[m.slug]?.trim() !== '').length

  const currentYear = new Date().getFullYear()
  const selectedMapOption = mapVariableOptions.find((o) => o.key === selectedMapVariableKey)
  const yearOptions = Array.from(
    new Set([
      ...(mode === 'edit' ? (selectedMapOption?.years ?? []) : []),
      ...Array.from({ length: currentYear - 2014 }, (_, i) => 2015 + i),
      currentYear,
      currentYear + 1,
    ]),
  ).sort((a, b) => a - b)

  const municipioRows: MunicipioValueRow[] = MUNICIPIOS.map((m) => ({
    rowId: m.slug,
    municipioNome: m.nome,
    value: values[m.slug] ?? '',
  }))

  function handleNewMode() {
    setMode('new')
    setLabel('')
    setDescription('')
    setUnit('')
    setSource('')
    setYear(new Date().getFullYear())
    setValues({})
    setSelectedCell(null)
    setEditingCell(null)
    const groups = bundle.sections[sectionId]?.groups ?? []
    if (groups.length > 0) setGroupId(groups[0].id)
  }

  function handleCancelNew() {
    setMode('edit')
  }

  // Troca de ano: recarrega valores do bundle para o ano selecionado
  function handleYearChange(newYear: number) {
    setYear(newYear)
    if (mode !== 'edit' || !selectedMapVariableKey) return

    const b = bundleRef.current
    const { sectionId: sid, groupId: gid, indicatorId: iid } =
      parseMapVariableKey(selectedMapVariableKey)
    const section = b.sections[sid as IndicatorSectionId]
    if (!section) return
    const group = section.groups.find((g) => g.id === gid)
    const indicator = group?.indicators.find((i) => i.id === iid)
    if (!indicator) return

    const fallbackYear =
      Number(section.lastUpdated.slice(0, 4)) || new Date().getFullYear()
    const mapSeries = getIndicatorMapSeries(indicator, fallbackYear) ?? {}
    const yearValues = mapSeries[String(newYear)] ?? {}
    const loaded = Object.fromEntries(
      Object.entries(yearValues).map(([slug, val]) => [slug, String(val)]),
    )
    valuesRef.current = loaded
    setValues(loaded)
    setSelectedCell(null)
    setEditingCell(null)
  }

  // Atualiza ref sincronamente para garantir captura no save mesmo com célula em edição
  function handleGridCellChange(rowId: string, columnId: string, value: string) {
    if (columnId === 'value') {
      valuesRef.current = { ...valuesRef.current, [rowId]: value }
      setValues(valuesRef.current)
    }
  }

  function handleSave() {
    if (!label.trim() || !groupId) return
    const { indicatorId: iid } =
      mode === 'edit'
        ? parseMapVariableKey(selectedMapVariableKey)
        : { indicatorId: undefined }

    // Usa ref para capturar o valor mais recente, inclusive de célula ainda em edição
    onSave({
      mode,
      sectionId,
      groupId,
      indicatorId: mode === 'edit' ? iid : undefined,
      label,
      description,
      unit,
      source,
      year,
      values: valuesRef.current,
    })

    if (mode === 'new') {
      setMode('edit')
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Variable selector bar */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-areia-200 bg-areia-50/30 px-3 py-1.5">
        <label className={labelClass}>Variável</label>
        <select
          value={mode === 'edit' ? selectedMapVariableKey : ''}
          onChange={(e) => {
            setMode('edit')
            onVariableChange(e.currentTarget.value)
          }}
          disabled={mode === 'new'}
          className={`max-w-[300px] ${inputClass} ${mode === 'new' ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          {mapVariableOptions.map((opt) => (
            <option key={opt.key} value={opt.key}>
              {opt.sectionLabel} — {opt.indicatorLabel}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={mode === 'new' ? handleCancelNew : handleNewMode}
          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold font-jakarta transition-all duration-100 active:scale-[0.97] shadow-sm border ${
            mode === 'new'
              ? 'border-areia-200 bg-white text-areia-500 hover:text-areia-700'
              : 'border-areia-200 bg-white text-areia-600 hover:border-verde-300 hover:text-verde-700'
          }`}
        >
          {mode === 'new' ? 'Cancelar' : '+ Novo indicador'}
        </button>
      </div>

      {/* Compact form fields */}
      <div className="shrink-0 space-y-1.5 border-b border-areia-200 bg-areia-50/20 px-3 py-2">
        {/* Row 1: Seção, Grupo, Nome */}
        <div className="flex flex-wrap items-center gap-2">
          <label className={labelClass}>Seção</label>
          <select
            value={sectionId}
            onChange={(e) => setSectionId(e.currentTarget.value as IndicatorSectionId)}
            disabled={mode === 'edit'}
            className={`${inputClass} ${mode === 'edit' ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {INDICATOR_SECTION_IDS.map((id) => (
              <option key={id} value={id}>
                {INDICATOR_SECTION_META[id].badge}
              </option>
            ))}
          </select>
          <label className={labelClass}>Grupo</label>
          <select
            value={groupId}
            onChange={(e) => setGroupId(e.currentTarget.value)}
            disabled={mode === 'edit'}
            className={`${inputClass} ${mode === 'edit' ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {groupOptions.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label}
              </option>
            ))}
          </select>
          <label className={labelClass}>Nome</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.currentTarget.value)}
            placeholder="Nome do indicador"
            className={`flex-1 min-w-[180px] ${inputClass}`}
          />
        </div>
        {/* Row 2: Unidade, Fonte, Ano, Descrição */}
        <div className="flex flex-wrap items-center gap-2">
          <label className={labelClass}>Unidade</label>
          <input
            type="text"
            value={unit}
            onChange={(e) => setUnit(e.currentTarget.value)}
            placeholder="Ex: pontos"
            className={`w-[90px] ${inputClass}`}
          />
          <label className={labelClass}>Fonte</label>
          <input
            type="text"
            value={source}
            onChange={(e) => setSource(e.currentTarget.value)}
            placeholder="Ex: INEP/MEC"
            className={`w-[120px] ${inputClass}`}
          />
          <label className={labelClass}>Ano</label>
          <select
            value={year}
            onChange={(e) => handleYearChange(Number(e.currentTarget.value))}
            className={`w-[80px] ${inputClass}`}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <label className={labelClass}>Descrição</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
            placeholder="Breve descrição"
            className={`flex-1 min-w-[180px] ${inputClass}`}
          />
        </div>
      </div>

      {/* Grid header with counter */}
      <div className="flex shrink-0 items-center justify-between border-b border-areia-200 bg-areia-50/10 px-3 py-1">
        <span className={labelClass}>Valores por Município</span>
        <span
          className={`text-[11px] font-jakarta tabular-nums ${
            filledCount === 22 ? 'text-verde-600 font-semibold' : 'text-areia-400'
          }`}
        >
          {filledCount}/22 preenchidos
        </span>
      </div>

      {/* Spreadsheet grid for municipality values */}
      <SpreadsheetGrid
        data={municipioRows}
        columns={municipioValueColumns}
        emptyMessage=""
        selectedCell={selectedCell}
        editingCell={editingCell}
        onSelectCell={(i, col) => setSelectedCell({ rowIndex: i, columnId: col })}
        onStartEditing={(i, col) => setEditingCell({ rowIndex: i, columnId: col })}
        onStopEditing={() => setEditingCell(null)}
        onCellChange={handleGridCellChange}
      />

      {/* Save footer */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-areia-200 bg-areia-50/30 px-4 py-2">
        <span className="text-[11px] text-areia-400 font-jakarta">
          {mode === 'new' ? 'Criando novo indicador de mapa' : 'Editando indicador existente'}
        </span>
        <button
          type="button"
          onClick={handleSave}
          disabled={!label.trim() || !groupId}
          className="inline-flex items-center gap-1.5 rounded-lg bg-verde-600 px-4 py-1.5 text-[11px] font-semibold text-white shadow-sm transition-all duration-100 hover:bg-verde-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 font-jakarta"
        >
          Salvar indicador
        </button>
      </div>
    </div>
  )
}
