import type { GridColumn } from '../SpreadsheetGrid'
import type {
  EditableDashboardKpiRow,
  EditableDashboardSummaryRow,
} from '@/types/admin-data'

export const dashboardKpiColumns: GridColumn<EditableDashboardKpiRow>[] = [
  { id: 'id', header: 'ID', accessor: (row) => row.id, editable: true, width: 160 },
  {
    id: 'section',
    header: 'Secao',
    accessor: (row) => row.section,
    editable: true,
    width: 110,
  },
  {
    id: 'label',
    header: 'Rotulo',
    accessor: (row) => row.label,
    editable: true,
    width: 200,
  },
  {
    id: 'value',
    header: 'Valor',
    accessor: (row) => row.value,
    editable: true,
    width: 100,
  },
  {
    id: 'unit',
    header: 'Unidade',
    accessor: (row) => row.unit,
    editable: true,
    width: 100,
  },
  {
    id: 'delta',
    header: 'Delta',
    accessor: (row) => row.delta ?? '',
    editable: true,
    type: 'number',
    width: 80,
  },
  {
    id: 'deltaDirection',
    header: 'Dir. Delta',
    accessor: (row) => row.deltaDirection,
    editable: true,
    type: 'select',
    options: [
      { value: '', label: 'Vazio' },
      { value: 'up', label: 'up' },
      { value: 'down', label: 'down' },
      { value: 'neutral', label: 'neutral' },
    ],
    width: 100,
  },
  {
    id: 'positiveDirection',
    header: 'Dir. Positiva',
    accessor: (row) => row.positiveDirection,
    editable: true,
    type: 'select',
    options: [
      { value: '', label: 'Vazio' },
      { value: 'up', label: 'up' },
      { value: 'down', label: 'down' },
    ],
    width: 100,
  },
  {
    id: 'year',
    header: 'Ano',
    accessor: (row) => row.year,
    editable: true,
    type: 'number',
    width: 80,
  },
]

export const dashboardSummaryColumns: GridColumn<EditableDashboardSummaryRow>[] = [
  {
    id: 'section',
    header: 'Secao',
    accessor: (row) => row.section,
    editable: true,
    width: 110,
  },
  {
    id: 'headline',
    header: 'Headline',
    accessor: (row) => row.headline,
    editable: true,
    width: 240,
  },
  {
    id: 'value',
    header: 'Valor',
    accessor: (row) => row.value,
    editable: true,
    width: 160,
  },
  {
    id: 'trend',
    header: 'Tendencia',
    accessor: (row) => row.trend,
    editable: true,
    width: 200,
  },
]
