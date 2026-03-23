import type { GridColumn } from '../SpreadsheetGrid'
import type { EditableMunicipioSummaryRow } from '@/types/admin-data'

export const municipiosColumns: GridColumn<EditableMunicipioSummaryRow>[] = [
  { id: 'slug', header: 'Slug', accessor: (row) => row.slug, editable: true, width: 140 },
  { id: 'nome', header: 'Nome', accessor: (row) => row.nome, editable: true, width: 180 },
  {
    id: 'populacao',
    header: 'Populacao',
    accessor: (row) => row.populacao,
    editable: true,
    type: 'number',
    width: 110,
  },
  {
    id: 'area',
    header: 'Area (km2)',
    accessor: (row) => row.area,
    editable: true,
    type: 'number',
    width: 100,
  },
  {
    id: 'regiaoJudiciaria',
    header: 'Regiao',
    accessor: (row) => row.regiaoJudiciaria,
    editable: true,
    width: 140,
  },
  {
    id: 'distanciaCapital',
    header: 'Dist. Capital (km)',
    accessor: (row) => row.distanciaCapital,
    editable: true,
    type: 'number',
    width: 130,
  },
  {
    id: 'idhm',
    header: 'IDHM',
    accessor: (row) => row.idhm,
    editable: true,
    type: 'number',
    width: 80,
  },
  {
    id: 'lat',
    header: 'Latitude',
    accessor: (row) => row.lat,
    editable: true,
    type: 'number',
    width: 100,
  },
  {
    id: 'lng',
    header: 'Longitude',
    accessor: (row) => row.lng,
    editable: true,
    type: 'number',
    width: 100,
  },
]
