import type { QueryClient } from '@tanstack/react-query'
import {
  INDICATOR_SECTION_IDS,
  type IndicatorSectionId,
} from '@/lib/constants/indicator-sections'
import type { DashboardData } from '@/types/dashboard'
import type { IndicatorSection } from '@/types/indicators'
import type { MunicipioDetail, MunicipioSummary } from '@/types/municipio'

export interface PortalDataClient {
  getDashboard: () => Promise<DashboardData | null>
  getSection: (sectionId: IndicatorSectionId) => Promise<IndicatorSection | null>
  getMunicipios: () => Promise<MunicipioSummary[]>
  getMunicipio: (slug: string) => Promise<MunicipioDetail | null>
  getAcreGeoJson: () => Promise<GeoJSON.GeoJsonObject>
}

const DATA_BASE = '/data'
const SECTION_API_BASE = '/api/sections'

function isJsonResponse(response: Response) {
  const contentType = response.headers.get('content-type') ?? ''
  return contentType.toLowerCase().includes('json')
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init)

  if (!response.ok) {
    throw new Error(`Falha ao carregar ${path}`)
  }

  if (!isJsonResponse(response)) {
    throw new Error(`Resposta inválida ao carregar ${path}`)
  }

  return response.json() as Promise<T>
}

async function fetchOptionalJson<T>(path: string, init?: RequestInit): Promise<T | null> {
  const response = await fetch(path, init)

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Falha ao carregar ${path}`)
  }

  if (!isJsonResponse(response)) {
    return null
  }

  return response.json() as Promise<T>
}

async function readResponseMessage(response: Response) {
  if (isJsonResponse(response)) {
    try {
      const body = await response.json() as { message?: unknown }
      if (typeof body.message === 'string') return body.message
    } catch {
      // usa fallback abaixo
    }
  }

  const text = await response.text()
  return text.trim() || `Falha ao carregar ${response.url}`
}

const ADMIN_SECTION_KEY = (sectionId: IndicatorSectionId) =>
  `femdicon:admin:section:${sectionId}`

export function saveAdminSection(sectionId: IndicatorSectionId, section: IndicatorSection) {
  try {
    localStorage.setItem(ADMIN_SECTION_KEY(sectionId), JSON.stringify(section))
  } catch {
    // localStorage indisponível (ex: modo privado com storage bloqueado)
  }
}

export function loadAdminSection(sectionId: IndicatorSectionId): IndicatorSection | null {
  try {
    const raw = localStorage.getItem(ADMIN_SECTION_KEY(sectionId))
    return raw ? (JSON.parse(raw) as IndicatorSection) : null
  } catch {
    return null
  }
}

export function clearAdminSectionCache(sectionId: IndicatorSectionId) {
  try {
    localStorage.removeItem(ADMIN_SECTION_KEY(sectionId))
  } catch {
    // localStorage indisponível
  }
}

async function fetchSectionWithFallback(sectionId: IndicatorSectionId) {
  try {
    const persistedSection = await fetchOptionalJson<IndicatorSection>(
      `${SECTION_API_BASE}/${sectionId}`,
    )

    if (persistedSection) {
      saveAdminSection(sectionId, persistedSection)
      return persistedSection
    }
  } catch {
    // cai para o JSON estatico
  }

  try {
    const staticSection = await fetchOptionalJson<IndicatorSection>(
      `${DATA_BASE}/${sectionId}.json`,
    )

    if (staticSection) {
      saveAdminSection(sectionId, staticSection)
      return staticSection
    }
  } catch {
    // usa cache local como ultimo recurso
  }

  return loadAdminSection(sectionId)
}

export async function persistAdminSection(
  sectionId: IndicatorSectionId,
  section: IndicatorSection,
) {
  const response = await fetch(`${SECTION_API_BASE}/${sectionId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ payload: section }),
  })

  if (!response.ok) {
    const message = await readResponseMessage(response)
    throw new Error(message)
  }

  saveAdminSection(sectionId, section)
}

export const portalDataClient: PortalDataClient = {
  getDashboard: () => fetchOptionalJson<DashboardData>(`${DATA_BASE}/dashboard.json`),
  getSection: (sectionId) => fetchSectionWithFallback(sectionId),
  getMunicipios: () => fetchJson<MunicipioSummary[]>(`${DATA_BASE}/municipios/index.json`),
  getMunicipio: (slug) =>
    fetchOptionalJson<MunicipioDetail>(`${DATA_BASE}/municipios/${slug}.json`),
  getAcreGeoJson: () =>
    fetchJson<GeoJSON.GeoJsonObject>('/shapefiles/acre-municipios.geojson'),
}

export const queryKeys = {
  dashboard: ['dashboard'] as const,
  portalDataBundle: ['portal-data-bundle'] as const,
  section: (sectionId: IndicatorSectionId) => ['section', sectionId] as const,
  municipios: ['municipios'] as const,
  municipio: (slug: string) => ['municipio', slug] as const,
  acreGeoJson: ['acre-geojson'] as const,
}

export function prefetchIndicatorSections(queryClient: QueryClient) {
  return Promise.all(
    INDICATOR_SECTION_IDS.map((sectionId) =>
      queryClient.prefetchQuery({
        queryKey: queryKeys.section(sectionId),
        queryFn: () => portalDataClient.getSection(sectionId),
      }),
    ),
  )
}

export function prefetchPathData(queryClient: QueryClient, href: string) {
  switch (href) {
    case '/':
      return Promise.all([
        queryClient.prefetchQuery({
          queryKey: queryKeys.dashboard,
          queryFn: portalDataClient.getDashboard,
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeys.section('educacao'),
          queryFn: () => portalDataClient.getSection('educacao'),
        }),
      ])
    case '/educacao':
    case '/saude':
    case '/seguranca':
    case '/orcamento': {
      const sectionId = href.slice(1) as IndicatorSectionId
      return queryClient.prefetchQuery({
        queryKey: queryKeys.section(sectionId),
        queryFn: () => portalDataClient.getSection(sectionId),
      })
    }
    case '/mapas':
      return Promise.all([
        ...INDICATOR_SECTION_IDS.map((sectionId) =>
          queryClient.prefetchQuery({
            queryKey: queryKeys.section(sectionId),
            queryFn: () => portalDataClient.getSection(sectionId),
          }),
        ),
        queryClient.prefetchQuery({
          queryKey: queryKeys.municipios,
          queryFn: portalDataClient.getMunicipios,
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeys.acreGeoJson,
          queryFn: portalDataClient.getAcreGeoJson,
        }),
      ])
    case '/municipios':
      return queryClient.prefetchQuery({
        queryKey: queryKeys.municipios,
        queryFn: portalDataClient.getMunicipios,
      })
    default:
      if (href.startsWith('/municipios/')) {
        const slug = href.replace('/municipios/', '')
        return queryClient.prefetchQuery({
          queryKey: queryKeys.municipio(slug),
          queryFn: () => portalDataClient.getMunicipio(slug),
        })
      }

      return Promise.resolve()
  }
}
