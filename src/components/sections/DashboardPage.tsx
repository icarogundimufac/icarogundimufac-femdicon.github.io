import { useEffect, useMemo, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { PageShell, PageContent } from '@/components/layout/PageShell'
import { SectionSummary } from '@/components/dashboard/SectionSummary'
import { AcreMap } from '@/components/maps/AcreMap'
import {
  DEFAULT_MAP_VARIABLE_KEY,
  getMapVariableData,
} from '@/lib/data/portal-data'
import type { PortalDataBundle, MapVariableOption } from '@/types/admin-data'
import type { DashboardData, KpiData } from '@/types/dashboard'

interface DashboardPageProps {
  data: DashboardData | null
  bundle: PortalDataBundle | null
  variableOptions: MapVariableOption[]
}

const SECTION_COLOR: Record<string, string> = {
  educacao: '#3b82f6',
  saude: '#10b981',
  seguranca: '#f97316',
  orcamento: '#f59e0b',
  municipios: '#8b5cf6',
  default: '#229157',
}

function KpiSidebarItem({ kpi }: { kpi: KpiData }) {
  const color = SECTION_COLOR[kpi.section] ?? SECTION_COLOR.default
  const isUp = kpi.deltaDirection === 'up'
  const isDown = kpi.deltaDirection === 'down'

  return (
    <div className="flex items-center justify-between gap-3 py-3 px-4 border-b border-areia-100 last:border-0">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
        <span className="text-xs text-areia-600 font-jakarta leading-tight truncate">
          {kpi.label}
        </span>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="text-sm font-bold text-[#1F6B3A] font-fraunces tabular-nums">
          {typeof kpi.value === 'number'
            ? kpi.value.toLocaleString('pt-BR')
            : kpi.value}
        </span>
        {kpi.unit && (
          <span className="text-[10px] text-areia-400 font-jakarta">{kpi.unit}</span>
        )}
        {kpi.delta !== undefined && (
          <span
            className={`text-[10px] font-semibold font-jakarta ${
              isUp
                ? 'text-verde-600'
                : isDown
                  ? 'text-estrela-500'
                  : 'text-areia-400'
            }`}
          >
            {isUp ? '▲' : isDown ? '▼' : '—'}
          </span>
        )}
      </div>
    </div>
  )
}

export function DashboardPage({ data, bundle, variableOptions }: DashboardPageProps) {
  const [selectedVariableKey, setSelectedVariableKey] = useState(DEFAULT_MAP_VARIABLE_KEY)
  const [selectedYear, setSelectedYear] = useState(2023)

  const selectedVariable = variableOptions.find(
    (option) => option.key === selectedVariableKey,
  )

  useEffect(() => {
    if (variableOptions.length === 0) return

    const preferred =
      variableOptions.find((option) => option.key === selectedVariableKey) ??
      variableOptions.find((option) => option.key === DEFAULT_MAP_VARIABLE_KEY) ??
      variableOptions[0]

    if (preferred.key !== selectedVariableKey) {
      setSelectedVariableKey(preferred.key)
      return
    }

    if (!preferred.years.includes(selectedYear)) {
      setSelectedYear(preferred.years[preferred.years.length - 1] ?? 0)
    }
  }, [selectedVariableKey, selectedYear, variableOptions])

  const mapData = useMemo(
    () =>
      bundle
        ? getMapVariableData(bundle, selectedVariableKey, selectedYear)
        : {
            dataByMunicipio: {} as Record<string, number>,
            label: 'Indicador',
            unit: '',
            source: '',
          },
    [bundle, selectedVariableKey, selectedYear],
  )

  const colorScale =
    selectedVariable?.sectionId === 'saude'
      ? 'heat'
      : selectedVariable?.sectionId === 'seguranca'
        ? 'estrela'
        : 'verde'

  // Group variable options by section for <optgroup>
  const optionsBySection = useMemo(() => {
    const groups: Record<string, { label: string; options: MapVariableOption[] }> = {}
    for (const option of variableOptions) {
      if (!groups[option.sectionId]) {
        groups[option.sectionId] = { label: option.sectionLabel, options: [] }
      }
      groups[option.sectionId].options.push(option)
    }
    return Object.values(groups)
  }, [variableOptions])

  return (
    <PageShell>
      <Header
        title="Dashboard"
        subtitle="Visão geral dos principais indicadores do Estado do Acre"
        badge="SEPLAN/AC"
      />

      <PageContent>
        <section className="mb-8">
          <div className="flex gap-5 items-stretch">
            <div className="flex-[2] min-w-0 bg-white rounded-xl border border-areia-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-areia-100 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-areia-800 font-jakarta shrink-0">
                  Mapa do Estado do Acre
                </p>

                <div className="flex items-center gap-2 min-w-0">
                  <select
                    value={selectedVariableKey}
                    onChange={(event) => setSelectedVariableKey(event.currentTarget.value)}
                    className="min-w-0 max-w-[260px] truncate rounded-lg border border-areia-200 bg-areia-50/60 px-2.5 py-1 text-[12px] text-areia-700 font-jakarta transition hover:border-areia-300 focus:border-verde-400 focus:ring-1 focus:ring-verde-400/30 focus:outline-none"
                  >
                    {optionsBySection.map((group) => (
                      <optgroup key={group.label} label={group.label}>
                        {group.options.map((option) => (
                          <option key={option.key} value={option.key}>
                            {option.indicatorLabel}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>

                  <select
                    value={selectedYear}
                    onChange={(event) => setSelectedYear(Number(event.currentTarget.value))}
                    className="w-[72px] rounded-lg border border-areia-200 bg-areia-50/60 px-2 py-1 text-[12px] text-areia-700 font-jakarta tabular-nums transition hover:border-areia-300 focus:border-verde-400 focus:ring-1 focus:ring-verde-400/30 focus:outline-none"
                  >
                    {(selectedVariable?.years ?? []).map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>

                  {selectedVariable && (
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-[#F2C230]/40 bg-[#F2C230]/10 text-[#1F6B3A] font-jakarta shrink-0 whitespace-nowrap">
                      Fonte: {selectedVariable.source}
                    </span>
                  )}
                </div>
              </div>
              <AcreMap
                dataByMunicipio={mapData.dataByMunicipio}
                unit={mapData.unit}
                label={mapData.label}
                colorScale={colorScale}
                height={460}
              />
            </div>

            {data?.kpis && data.kpis.length > 0 && (
              <div className="flex-[1] min-w-0 bg-white rounded-xl border border-areia-200 shadow-sm overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-areia-100">
                  <p className="text-xs font-bold uppercase tracking-widest text-areia-400 font-jakarta">
                    Indicadores-chave
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {data.kpis.map((kpi) => (
                    <KpiSidebarItem key={kpi.id} kpi={kpi} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {data?.sectionSummaries && data.sectionSummaries.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-areia-400 font-jakarta mb-4">
              Áreas temáticas
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {data.sectionSummaries.map((summary) => (
                <SectionSummary key={summary.section} summary={summary} />
              ))}
            </div>
          </section>
        )}

        {!data && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="text-5xl mb-4 opacity-30">📊</span>
            <h2 className="text-xl font-semibold text-areia-600 font-fraunces mb-2">
              Portal em configuração
            </h2>
            <p className="text-sm text-areia-400 font-jakarta max-w-sm">
              Os arquivos de dados ainda não foram carregados. Verifique o diretório{' '}
              <code className="bg-areia-200 rounded px-1.5 py-0.5 text-xs">/public/data</code>.
            </p>
          </div>
        )}
      </PageContent>
    </PageShell>
  )
}
