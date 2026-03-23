import { useEffect, useMemo, useState } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { PageShell, PageContent } from '@/components/layout/PageShell'
import { AcreMap } from '@/components/maps/AcreMap'
import { INDICATOR_SECTION_IDS } from '@/lib/constants/indicator-sections'
import { portalDataClient, queryKeys } from '@/lib/data/client'
import {
  DEFAULT_MAP_VARIABLE_KEY,
  getMapVariableData,
  getMapVariableOptions,
  normalizeIndicatorSection,
} from '@/lib/data/portal-data'
import type { PortalDataBundle } from '@/types/admin-data'

export function MapasRoute() {
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
  const [selectedVariableKey, setSelectedVariableKey] = useState(
    DEFAULT_MAP_VARIABLE_KEY,
  )
  const [selectedYear, setSelectedYear] = useState(2023)

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
      dashboard: {
        lastUpdated: new Date().toISOString().slice(0, 10),
        kpis: [],
        sectionSummaries: [],
      },
      sections,
      municipiosIndex,
      municipioDetails,
    } satisfies PortalDataBundle
  }, [municipiosIndex, sectionQueries])

  const variableOptions = useMemo(
    () => (bundle ? getMapVariableOptions(bundle) : []),
    [bundle],
  )
  const selectedVariable = variableOptions.find(
    (option) => option.key === selectedVariableKey,
  )
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

  const colorScale = selectedVariable?.sectionId === 'saude'
    ? 'heat'
    : selectedVariable?.sectionId === 'seguranca'
      ? 'estrela'
      : 'verde'

  return (
    <PageShell>
      <PageContent>
        <div className="mb-4">
          <p className="text-xs text-areia-400 font-jakarta">
            O mapa coroplético usa o GeoJSON público derivado do shapefile original em{' '}
            <code className="bg-areia-200 rounded px-1 text-[11px]">
              ACRESHAPE/AC_Municipios_2024.shp
            </code>{' '}
            e a base de satélite do Esri World Imagery, carregando a malha a partir de{' '}
            <code className="bg-areia-200 rounded px-1 text-[11px]">
              public/shapefiles/acre-municipios.geojson
            </code>{' '}
            . Se você atualizar a malha, rode{' '}
            <code className="bg-areia-200 rounded px-1 text-[11px]">npm run sync:shapefile</code>.
          </p>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,2fr)_180px]">
          <select
            value={selectedVariableKey}
            onChange={(event) => setSelectedVariableKey(event.currentTarget.value)}
            className="rounded-xl border border-areia-200 bg-white px-3 py-2 text-sm text-areia-700 shadow-sm font-jakarta"
          >
            {variableOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.sectionLabel} — {option.indicatorLabel}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(event) => setSelectedYear(Number(event.currentTarget.value))}
            className="rounded-xl border border-areia-200 bg-white px-3 py-2 text-sm text-areia-700 shadow-sm font-jakarta"
          >
            {(selectedVariable?.years ?? []).map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {selectedVariable && (
          <div className="mb-4 rounded-xl border border-areia-200 bg-white px-4 py-3 text-sm text-areia-500 shadow-sm font-jakarta">
            <span className="font-semibold text-areia-800">
              {selectedVariable.indicatorLabel}
            </span>{' '}
            · {selectedVariable.source} · anos disponíveis: {selectedVariable.years.join(', ')}
          </div>
        )}

        <AcreMap
          dataByMunicipio={mapData.dataByMunicipio}
          unit={mapData.unit}
          label={mapData.label}
          colorScale={colorScale}
          height={560}
        />
      </PageContent>
    </PageShell>
  )
}
