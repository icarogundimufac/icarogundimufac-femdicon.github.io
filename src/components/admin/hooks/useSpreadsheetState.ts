import { useCallback, useState } from 'react'

export type SheetId =
  | 'municipios'
  | 'municipio_indicadores'
  | 'mapa'
  | 'indicadores'
  | 'dashboard_kpis'
  | 'dashboard_resumos'

export interface SelectedCell {
  rowIndex: number
  columnId: string
}

export interface SheetDefinition {
  id: SheetId
  label: string
}

export const SHEET_DEFINITIONS: SheetDefinition[] = [
  { id: 'municipios', label: 'Municipios' },
  { id: 'municipio_indicadores', label: 'Ind. por Municipio' },
  { id: 'mapa', label: 'Mapa' },
  { id: 'indicadores', label: 'Indicadores' },
  { id: 'dashboard_kpis', label: 'Dashboard KPIs' },
  { id: 'dashboard_resumos', label: 'Dashboard Resumos' },
]

export function useSpreadsheetState() {
  const [activeSheet, setActiveSheet] = useState<SheetId>('municipios')
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null)
  const [editingCell, setEditingCell] = useState<SelectedCell | null>(null)

  const selectCell = useCallback((rowIndex: number, columnId: string) => {
    setSelectedCell({ rowIndex, columnId })
  }, [])

  const startEditing = useCallback((rowIndex: number, columnId: string) => {
    setSelectedCell({ rowIndex, columnId })
    setEditingCell({ rowIndex, columnId })
  }, [])

  const stopEditing = useCallback(() => {
    setEditingCell(null)
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedCell(null)
    setEditingCell(null)
  }, [])

  const changeSheet = useCallback((sheetId: SheetId) => {
    setActiveSheet(sheetId)
    setSelectedCell(null)
    setEditingCell(null)
  }, [])

  return {
    activeSheet,
    selectedCell,
    editingCell,
    selectCell,
    startEditing,
    stopEditing,
    clearSelection,
    changeSheet,
  }
}
