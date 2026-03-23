import type { GridColumn } from '../SpreadsheetGrid'
import type { EditableMunicipalTemplateRow } from '@/types/admin-data'

export const mapaColumns: GridColumn<EditableMunicipalTemplateRow>[] = [
  {
    id: 'municipioNome',
    header: 'Municipio',
    accessor: (row) => row.municipioNome,
    width: 160,
  },
  {
    id: 'municipioSlug',
    header: 'Slug',
    accessor: (row) => row.municipioSlug,
    width: 140,
  },
  {
    id: 'indicatorLabel',
    header: 'Indicador',
    accessor: (row) => row.indicatorLabel,
    editable: true,
    width: 200,
  },
  {
    id: 'unit',
    header: 'Unidade',
    accessor: (row) => row.unit,
    editable: true,
    width: 100,
  },
  {
    id: 'source',
    header: 'Fonte',
    accessor: (row) => row.source,
    editable: true,
    width: 140,
  },
  {
    id: 'year',
    header: 'Ano',
    accessor: (row) => row.year,
    editable: true,
    type: 'number',
    width: 80,
  },
  {
    id: 'value',
    header: 'Valor',
    accessor: (row) => row.value,
    editable: true,
    type: 'number',
    width: 100,
  },
]
