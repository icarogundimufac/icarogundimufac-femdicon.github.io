import { useQuery } from '@tanstack/react-query'
import { DashboardPage } from '@/components/sections/DashboardPage'
import { portalDataClient, queryKeys } from '@/lib/data/client'

export function DashboardRoute() {
  const { data: dashboardData } = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: portalDataClient.getDashboard,
  })

  const { data: educacaoData } = useQuery({
    queryKey: queryKeys.section('educacao'),
    queryFn: () => portalDataClient.getSection('educacao'),
  })

  return <DashboardPage data={dashboardData ?? null} educacaoData={educacaoData ?? null} />
}
