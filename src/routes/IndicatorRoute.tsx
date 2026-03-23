import { useQuery } from '@tanstack/react-query'
import { IndicatorSectionPage } from '@/components/sections/IndicatorSectionPage'
import { portalDataClient, queryKeys } from '@/lib/data/client'
import type { IndicatorSectionId } from '@/lib/constants/indicator-sections'

interface IndicatorRouteProps {
  sectionId: IndicatorSectionId
}

export function IndicatorRoute({ sectionId }: IndicatorRouteProps) {
  const { data } = useQuery({
    queryKey: queryKeys.section(sectionId),
    queryFn: () => portalDataClient.getSection(sectionId),
  })

  return <IndicatorSectionPage sectionId={sectionId} data={data ?? null} />
}
