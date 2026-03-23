import { Header } from '@/components/layout/Header'
import { PageShell, PageContent } from '@/components/layout/PageShell'
import { ChartCard } from '@/components/charts/ChartCard'
import { LazyAreaChart } from '@/components/charts/LazyAreaChart'
import { LazyBarChart } from '@/components/charts/LazyBarChart'
import { LazyLineChart } from '@/components/charts/LazyLineChart'
import { KpiCard } from '@/components/dashboard/KpiCard'
import {
  INDICATOR_SECTION_META,
  type IndicatorSectionId,
} from '@/lib/constants/indicator-sections'
import { formatCompactCurrency } from '@/lib/utils/format'
import type { Indicator, IndicatorSection } from '@/types/indicators'

interface IndicatorSectionPageProps {
  sectionId: IndicatorSectionId
  data: IndicatorSection | null
}

type KpiItem = {
  id: string
  section: string
  label: string
  value: number | string
  unit: string
  delta?: number
  deltaDirection?: 'up' | 'down' | 'neutral'
  positiveDirection?: 'up' | 'down'
  year: number
}

function getIndicator(
  data: IndicatorSection,
  groupId: string,
  indicatorId: string,
): Indicator | undefined {
  return data.groups
    .find((group) => group.id === groupId)
    ?.indicators.find((indicator) => indicator.id === indicatorId)
}

function getTimeSeries(
  data: IndicatorSection,
  groupId: string,
  indicatorId: string,
) {
  return (
    getIndicator(data, groupId, indicatorId)?.timeSeries.map((point) => ({
      year: point.year,
      value: point.value,
    })) ?? []
  )
}

function getByMunicipio(
  data: IndicatorSection,
  groupId: string,
  indicatorId: string,
) {
  return getIndicator(data, groupId, indicatorId)?.byMunicipio ?? {}
}

function getSectionKpis(
  sectionId: IndicatorSectionId,
  data: IndicatorSection,
): KpiItem[] {
  switch (sectionId) {
    case 'educacao':
      return data.groups.flatMap((group) =>
        group.indicators
          .filter((indicator) => indicator.latestValue !== undefined)
          .slice(0, 2)
          .map((indicator) => ({
            id: indicator.id,
            section: sectionId,
            label: indicator.label,
            value: indicator.latestValue!,
            unit: indicator.unit,
            delta: indicator.delta,
            deltaDirection: indicator.deltaDirection,
            year: indicator.timeSeries.at(-1)?.year ?? 2023,
          })),
      )
    case 'saude':
      return data.groups.flatMap((group) =>
        group.indicators
          .filter((indicator) => indicator.latestValue !== undefined)
          .slice(0, 2)
          .map((indicator) => ({
            id: indicator.id,
            section: sectionId,
            label: indicator.label,
            value: indicator.latestValue!,
            unit: indicator.unit,
            delta: indicator.delta,
            deltaDirection: indicator.deltaDirection,
            positiveDirection: indicator.id.includes('mortalidade')
              ? 'down'
              : 'up',
            year: indicator.timeSeries.at(-1)?.year ?? 2023,
          })),
      )
    case 'seguranca':
      return data.groups.flatMap((group) =>
        group.indicators
          .filter((indicator) => indicator.latestValue !== undefined)
          .slice(0, 2)
          .map((indicator) => ({
            id: indicator.id,
            section: sectionId,
            label: indicator.label,
            value: indicator.latestValue!,
            unit: indicator.unit,
            delta: indicator.delta,
            deltaDirection: indicator.deltaDirection,
            positiveDirection: 'down',
            year: indicator.timeSeries.at(-1)?.year ?? 2023,
          })),
      )
    case 'orcamento':
      return data.groups.flatMap((group) =>
        group.indicators
          .filter((indicator) => indicator.latestValue !== undefined)
          .slice(0, 1)
          .map((indicator) => ({
            id: indicator.id,
            section: sectionId,
            label: indicator.label,
            value: formatCompactCurrency(indicator.latestValue!),
            unit: '',
            delta: indicator.delta,
            deltaDirection: indicator.deltaDirection,
            year: indicator.timeSeries.at(-1)?.year ?? 2023,
          })),
      )
  }
}

function formatMunicipioLabel(slug: string, maxLength: number) {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .slice(0, maxLength)
}

function renderSectionCharts(
  sectionId: IndicatorSectionId,
  data: IndicatorSection,
) {
  switch (sectionId) {
    case 'educacao': {
      const idebSeries = getTimeSeries(data, 'desempenho', 'ideb_anos_iniciais')
      const matriculasSeries = getTimeSeries(data, 'matriculas', 'matriculas_total')
      const municipioIdeb = getByMunicipio(data, 'desempenho', 'ideb_municipios')
      const municipioChartData = Object.entries(municipioIdeb)
        .map(([slug, value]) => ({
          label: formatMunicipioLabel(slug, 16),
          value: value as number,
        }))
        .sort((left, right) => right.value - left.value)
        .slice(0, 10)

      return (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {idebSeries.length > 0 && (
              <ChartCard
                title="Evolução do IDEB — Anos Iniciais"
                subtitle="Média estadual do Índice de Desenvolvimento da Educação Básica"
                source="INEP/MEC"
              >
                <LazyLineChart
                  data={idebSeries}
                  color="#229157"
                  unit="pontos"
                  height={240}
                  referenceValue={6}
                  referenceLabel="Meta 6.0"
                />
              </ChartCard>
            )}

            {matriculasSeries.length > 0 && (
              <ChartCard
                title="Total de Matrículas"
                subtitle="Educação básica pública — rede estadual e municipal"
                source="INEP/Censo Escolar"
              >
                <LazyLineChart
                  data={matriculasSeries}
                  color="#0f5b36"
                  unit="alunos"
                  height={240}
                />
              </ChartCard>
            )}
          </div>

          {municipioChartData.length > 0 && (
            <ChartCard
              title="IDEB por Município — Anos Iniciais (2023)"
              subtitle="10 municípios com maior índice"
              source="INEP/MEC"
            >
              <LazyBarChart
                data={municipioChartData}
                color="#229157"
                unit="pontos"
                height={280}
              />
            </ChartCard>
          )}
        </>
      )
    }
    case 'saude': {
      const mortalidadeSeries = getTimeSeries(
        data,
        'mortalidade',
        'mortalidade_infantil',
      )
      const vacinacaoSeries = getTimeSeries(
        data,
        'prevencao',
        'cobertura_vacinacao',
      )
      const coberturaData = getByMunicipio(
        data,
        'atencao_basica',
        'cobertura_ab',
      )
      const coberturaChart = Object.entries(coberturaData)
        .map(([slug, value]) => ({
          label: formatMunicipioLabel(slug, 14),
          value: value as number,
        }))
        .sort((left, right) => right.value - left.value)
        .slice(0, 10)

      return (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {mortalidadeSeries.length > 0 && (
              <ChartCard
                title="Taxa de Mortalidade Infantil"
                subtitle="Óbitos por 1.000 nascidos vivos — tendência estadual"
                source="SIM/DATASUS"
              >
                <LazyLineChart
                  data={mortalidadeSeries}
                  color="#c0392b"
                  unit="/1.000 NV"
                  height={240}
                />
              </ChartCard>
            )}

            {vacinacaoSeries.length > 0 && (
              <ChartCard
                title="Cobertura Vacinal"
                subtitle="Cobertura vacinal média do calendário básico (%)"
                source="PNI/DATASUS"
              >
                <LazyLineChart
                  data={vacinacaoSeries}
                  color="#229157"
                  unit="%"
                  height={240}
                  referenceValue={95}
                  referenceLabel="Meta 95%"
                />
              </ChartCard>
            )}
          </div>

          {coberturaChart.length > 0 && (
            <ChartCard
              title="Cobertura de Atenção Básica por Município (%)"
              subtitle="Percentual de cobertura pelas equipes de saúde da família"
              source="CNES/DATASUS"
            >
              <LazyBarChart
                data={coberturaChart}
                color="#229157"
                unit="%"
                height={280}
              />
            </ChartCard>
          )}
        </>
      )
    }
    case 'seguranca': {
      const homicidiosSeries = getTimeSeries(
        data,
        'crimes_violentos',
        'taxa_homicidios',
      )
      const roubosSeries = getTimeSeries(
        data,
        'crimes_patrimonio',
        'taxa_roubos',
      )

      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {homicidiosSeries.length > 0 && (
            <ChartCard
              title="Taxa de Homicídios"
              subtitle="Óbitos por causas externas (homicídios) por 100 mil hab."
              source="SIM/DATASUS · SENASP"
            >
              <LazyLineChart
                data={homicidiosSeries}
                color="#c0392b"
                unit="/100 mil hab."
                height={260}
              />
            </ChartCard>
          )}

          {roubosSeries.length > 0 && (
            <ChartCard
              title="Taxa de Roubos"
              subtitle="Registros de roubo por 100 mil habitantes"
              source="SSP/AC · SINESP"
            >
              <LazyLineChart
                data={roubosSeries}
                color="#e74c3c"
                unit="/100 mil hab."
                height={260}
              />
            </ChartCard>
          )}
        </div>
      )
    }
    case 'orcamento': {
      const receitaSeries = getTimeSeries(data, 'receitas', 'receita_total')
      const despesaSeries = getTimeSeries(data, 'despesas', 'despesa_total')
      const funcaoData = getByMunicipio(data, 'despesas', 'despesa_funcao')
      const funcaoChart = Object.entries(funcaoData)
        .map(([key, value]) => ({
          label: key.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
          value: value as number,
        }))
        .sort((left, right) => right.value - left.value)

      return (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {receitaSeries.length > 0 && (
              <ChartCard
                title="Evolução da Receita Total"
                subtitle="Receita total arrecadada pelo Estado do Acre (R$)"
                source="SEFAZ/AC · SICONFI"
              >
                <LazyAreaChart
                  data={receitaSeries}
                  color="#0f5b36"
                  height={240}
                  format="currency"
                />
              </ChartCard>
            )}

            {despesaSeries.length > 0 && (
              <ChartCard
                title="Evolução da Despesa Total"
                subtitle="Despesa total empenhada pelo Estado do Acre (R$)"
                source="SEFAZ/AC · SICONFI"
              >
                <LazyAreaChart
                  data={despesaSeries}
                  color="#229157"
                  height={240}
                  format="currency"
                />
              </ChartCard>
            )}
          </div>

          {funcaoChart.length > 0 && (
            <ChartCard
              title="Despesa por Função"
              subtitle="Distribuição das despesas por área de atuação — último exercício"
              source="SEFAZ/AC"
            >
              <LazyBarChart
                data={funcaoChart}
                color="#229157"
                height={320}
                horizontal
              />
            </ChartCard>
          )}
        </>
      )
    }
  }
}

export function IndicatorSectionPage({
  sectionId,
  data,
}: IndicatorSectionPageProps) {
  const meta = INDICATOR_SECTION_META[sectionId]

  if (!data) {
    return (
      <PageShell>
        <Header
          title={meta.title}
          subtitle={meta.subtitle}
          badge={meta.badge}
        />
        <PageContent>
          <p className="text-areia-400 font-jakarta text-sm">
            Dados não disponíveis. Verifique o arquivo{' '}
            <code>{meta.missingDataPath}</code>.
          </p>
        </PageContent>
      </PageShell>
    )
  }

  const kpis = getSectionKpis(sectionId, data)

  return (
    <PageShell>
      <Header
        title={meta.title}
        subtitle={meta.subtitle}
        badge={meta.badge}
      />

      <PageContent>
        {kpis.length > 0 && (
          <section className="mb-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {kpis.slice(0, 4).map((kpi) => (
                <KpiCard key={kpi.id} kpi={kpi} />
              ))}
            </div>
          </section>
        )}

        {renderSectionCharts(sectionId, data)}
      </PageContent>
    </PageShell>
  )
}
