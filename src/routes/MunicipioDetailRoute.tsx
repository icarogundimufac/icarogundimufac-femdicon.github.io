import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Header } from '@/components/layout/Header'
import { PageShell, PageContent } from '@/components/layout/PageShell'
import { Card } from '@/components/ui/Card'
import { SectionTag } from '@/components/ui/SectionTag'
import { portalDataClient, queryKeys } from '@/lib/data/client'
import { formatNumber } from '@/lib/utils/format'

export function MunicipioDetailRoute() {
  const { slug = '' } = useParams()

  const { data: municipios = [] } = useQuery({
    queryKey: queryKeys.municipios,
    queryFn: portalDataClient.getMunicipios,
  })

  const { data: detail } = useQuery({
    queryKey: queryKeys.municipio(slug),
    queryFn: () => portalDataClient.getMunicipio(slug),
    enabled: Boolean(slug),
  })

  const summary = municipios.find((municipio) => municipio.slug === slug)

  if (!summary) {
    return (
      <PageShell>
        <PageContent>
          <Card className="p-8 text-center">
            <p className="text-sm text-areia-400 font-jakarta">
              Município não encontrado.
            </p>
          </Card>
        </PageContent>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <div className="px-8 pt-6 pb-2">
        <Link
          to="/municipios"
          className="inline-flex items-center gap-1.5 text-xs text-areia-400 hover:text-verde-600 font-jakarta transition-colors mb-4"
        >
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M13 8H3M7 12l-4-4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Municípios
        </Link>
      </div>

      <Header
        title={summary.nome}
        subtitle={`${summary.regiaoJudiciaria} · Estado do Acre`}
        badge="Município"
      />

      <PageContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'População', value: formatNumber(summary.populacao), unit: 'hab.' },
            { label: 'Área', value: formatNumber(summary.area), unit: 'km²' },
            { label: 'IDHM', value: summary.idhm.toFixed(3), unit: '' },
            {
              label: 'Dist. Rio Branco',
              value: summary.distanciaCapital === 0 ? 'Capital' : formatNumber(summary.distanciaCapital),
              unit: summary.distanciaCapital === 0 ? '' : 'km',
            },
          ].map((item) => (
            <Card key={item.label} className="p-5">
              <p className="text-xs text-areia-400 font-jakarta mb-1">{item.label}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-verde-900 font-fraunces tabular-nums">
                  {item.value}
                </span>
                {item.unit && (
                  <span className="text-xs text-areia-400 font-jakarta">{item.unit}</span>
                )}
              </div>
            </Card>
          ))}
        </div>

        {detail?.indicadores && detail.indicadores.length > 0 ? (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-areia-400 font-jakarta mb-4">
              Indicadores do município
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {detail.indicadores.map((indicator) => (
                <Card key={`${indicator.section}-${indicator.id}`} className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <SectionTag section={indicator.section} />
                    <span className="text-[10px] text-areia-400 font-jakarta">
                      {indicator.year}
                    </span>
                  </div>
                  <p className="text-xs text-areia-500 font-jakarta mb-1">{indicator.label}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-verde-900 font-fraunces tabular-nums">
                      {typeof indicator.value === 'number'
                        ? indicator.value.toLocaleString('pt-BR')
                        : indicator.value}
                    </span>
                    {indicator.unit && (
                      <span className="text-xs text-areia-400 font-jakarta">{indicator.unit}</span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </section>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-sm text-areia-400 font-jakarta">
              Dados detalhados para {summary.nome} ainda não disponíveis.
            </p>
            <p className="text-xs text-areia-300 font-jakarta mt-1">
              Adicione o arquivo{' '}
              <code className="bg-areia-100 rounded px-1">data/municipios/{slug}.json</code>
            </p>
          </Card>
        )}
      </PageContent>
    </PageShell>
  )
}
