import { useMemo } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { DashboardPage } from '@/components/sections/DashboardPage'
import { INDICATOR_SECTION_IDS } from '@/lib/constants/indicator-sections'
import { portalDataClient, queryKeys } from '@/lib/data/client'
import {
  getMapVariableOptions,
  normalizeIndicatorSection,
} from '@/lib/data/portal-data'
import type { PortalDataBundle } from '@/types/admin-data'

export function DashboardRoute() {
  const { data: dashboardData } = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: portalDataClient.getDashboard,
  })

  const sectionQueries = useQueries({
    queries: INDICATOR_SECTION_IDS.map((sectionId) => ({
      queryKey: queryKeys.section(sectionId),
      queryFn: () => portalDataClient.getSection(sectionId),
    })),
  })

  const { data: municipiosIndex = [] } = useQuery({
    queryKey: queryKeys.municipios,
    queryFn: portalDataClient.getMunicipios,
  })

  const bundle = useMemo(() => {
    if (sectionQueries.some((query) => query.isLoading)) return null

    const sections = Object.fromEntries(
      sectionQueries.map((query, index) => {
        const sectionId = INDICATOR_SECTION_IDS[index]
        return [
          sectionId,
          normalizeIndicatorSection(
            query.data ?? {
              id: sectionId,
              label: sectionId,
              lastUpdated: new Date().toISOString().slice(0, 10),
              groups: [],
            },
          ),
        ]
      }),
    ) as PortalDataBundle['sections']

    const municipioDetails = Object.fromEntries(
      municipiosIndex.map((municipio) => [
        municipio.slug,
        { ...municipio, indicadores: [] },
      ]),
    )

    return {
      dashboard: dashboardData ?? {
        lastUpdated: new Date().toISOString().slice(0, 10),
        kpis: [],
        sectionSummaries: [],
      },
      sections,
      municipiosIndex,
      municipioDetails,
    } satisfies PortalDataBundle
  }, [dashboardData, municipiosIndex, sectionQueries])

  const variableOptions = useMemo(
    () => (bundle ? getMapVariableOptions(bundle) : []),
    [bundle],
  )

  return (
    <DashboardPage
      data={dashboardData ?? null}
      bundle={bundle}
      variableOptions={variableOptions}
    />
  )
}
