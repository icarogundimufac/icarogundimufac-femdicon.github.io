import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Header } from '@/components/layout/Header'
import { PageShell, PageContent } from '@/components/layout/PageShell'
import { MunicipiosSearch } from '@/components/municipios/MunicipiosSearch'
import { portalDataClient, queryKeys } from '@/lib/data/client'

export function MunicipiosRoute() {
  const { data: municipios = [] } = useQuery({
    queryKey: queryKeys.municipios,
    queryFn: portalDataClient.getMunicipios,
  })

  const municipiosByPopulacao = useMemo(
    () => [...municipios].sort((left, right) => right.populacao - left.populacao),
    [municipios],
  )

  return (
    <PageShell>
      <Header
        title="Municípios"
        subtitle={`${municipios.length} municípios do Estado do Acre`}
        badge="Território"
      />

      <PageContent>
        <MunicipiosSearch municipios={municipiosByPopulacao} />
      </PageContent>
    </PageShell>
  )
}
