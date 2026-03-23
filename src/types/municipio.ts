export interface MunicipioSummary {
  slug: string
  nome: string
  populacao: number
  area: number
  regiaoJudiciaria: string
  distanciaCapital: number
  idhm: number
  lat: number
  lng: number
}

export interface MunicipioIndicador {
  section: string
  id: string
  label: string
  value: number
  unit: string
  year: number
}

export interface MunicipioDetail extends MunicipioSummary {
  indicadores: MunicipioIndicador[]
}
