import type { GridColumn } from '../SpreadsheetGrid'
import type { EditableMunicipioIndicatorRow } from '@/types/admin-data'

export const municipioIndicadoresColumns: GridColumn<EditableMunicipioIndicatorRow>[] = [
  {
    id: 'municipioNome',
    header: 'Municipio',
    accessor: (row) => row.municipioNome,
    width: 160,
  },
  {
    id: 'section',
    header: 'Secao',
    accessor: (row) => row.section,
    editable: true,
    width: 110,
  },
  { id: 'id', header: 'ID', accessor: (row) => row.id, editable: true, width: 160 },
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
    type: 'number',
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
    id: 'year',
    header: 'Ano',
    accessor: (row) => row.year,
    editable: true,
    type: 'number',
    width: 80,
  },
]
