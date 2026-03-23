import {
  applyMunicipalTemplateRowsToBundle,
  buildBundleJsonFiles,
  bundleToMunicipalTemplateRows,
  bundleToWorkbookSheets,
  validateMapRows,
  workbookSheetsToBundle,
} from '@/lib/data/workbook'
import type { PortalDataBundle } from '@/types/admin-data'
import type { IndicatorSection } from '@/types/indicators'

function createSection(
  section: IndicatorSection['id'],
  label: string,
  groups: IndicatorSection['groups'],
): IndicatorSection {
  return {
    id: section,
    label,
    lastUpdated: '2024-03-01',
    groups,
  }
}

function createBundle(): PortalDataBundle {
  return {
    dashboard: {
      lastUpdated: '2024-03-01',
      kpis: [
        {
          id: 'kpi_1',
          section: 'educacao',
          label: 'IDEB',
          value: 5.6,
          unit: 'pts',
          year: 2023,
        },
      ],
      sectionSummaries: [
        {
          section: 'educacao',
          headline: 'IDEB',
          value: '5,6',
          trend: [4.8, 5.1, 5.6],
        },
      ],
    },
    sections: {
      educacao: createSection('educacao', 'Educação', [
        {
          id: 'desempenho',
          label: 'Desempenho',
          indicators: [
            {
              id: 'ideb_municipios',
              label: 'IDEB por Município (2023)',
              description: 'Mapa',
              unit: 'pts',
              source: 'INEP',
              latestValue: 5.6,
              timeSeries: [
                { year: 2022, value: 5.1 },
                { year: 2023, value: 5.6 },
              ],
              mapSeries: {
                '2022': { 'rio-branco': 5.1 },
                '2023': { 'rio-branco': 5.6 },
              },
              byMunicipio: { 'rio-branco': 5.6 },
            },
          ],
        },
      ]),
      saude: createSection('saude', 'Saúde', []),
      seguranca: createSection('seguranca', 'Segurança', []),
      orcamento: createSection('orcamento', 'Orçamento', []),
    },
    municipiosIndex: [
      {
        slug: 'rio-branco',
        nome: 'Rio Branco',
        populacao: 1,
        area: 1,
        regiaoJudiciaria: 'A',
        distanciaCapital: 0,
        idhm: 0.7,
        lat: 0,
        lng: 0,
      },
    ],
    municipioDetails: {
      'rio-branco': {
        slug: 'rio-branco',
        nome: 'Rio Branco',
        populacao: 1,
        area: 1,
        regiaoJudiciaria: 'A',
        distanciaCapital: 0,
        idhm: 0.7,
        lat: 0,
        lng: 0,
        indicadores: [
          {
            section: 'educacao',
            id: 'ideb_municipios',
            label: 'IDEB',
            value: 5.6,
            unit: 'pts',
            year: 2023,
          },
        ],
      },
    },
  }
}

describe('workbook helpers', () => {
  it('faz roundtrip entre bundle e sheets mantendo mapSeries e byMunicipio', () => {
    const bundle = createBundle()

    const sheets = bundleToWorkbookSheets(bundle)
    const rebuilt = workbookSheetsToBundle(sheets)
    const indicator =
      rebuilt.sections.educacao.groups[0]?.indicators[0]

    expect(indicator?.mapSeries).toEqual({
      '2022': { 'rio-branco': 5.1 },
      '2023': { 'rio-branco': 5.6 },
    })
    expect(indicator?.byMunicipio).toEqual({ 'rio-branco': 5.6 })
    expect(rebuilt.dashboard.sectionSummaries[0]?.trend).toEqual([4.8, 5.1, 5.6])
  })

  it('gera arquivos json públicos mantendo byMunicipio compatível', () => {
    const files = buildBundleJsonFiles(createBundle())
    const educacao = JSON.parse(files['public/data/educacao.json'])

    expect(educacao.groups[0].indicators[0].mapSeries['2023']['rio-branco']).toBe(5.6)
    expect(educacao.groups[0].indicators[0].byMunicipio['rio-branco']).toBe(5.6)
    expect(files['public/data/municipios/rio-branco.json']).toContain('"rio-branco"')
  })

  it('detecta duplicidades em linhas cartográficas', () => {
    const rows = [
      {
        rowId: 'a',
        sectionId: 'educacao',
        sectionLabel: 'Educação',
        groupId: 'desempenho',
        groupLabel: 'Desempenho',
        indicatorId: 'ideb_municipios',
        indicatorLabel: 'IDEB',
        unit: 'pts',
        source: 'INEP',
        year: 2023,
        municipioSlug: 'rio-branco',
        value: 5.6,
      },
      {
        rowId: 'b',
        sectionId: 'educacao',
        sectionLabel: 'Educação',
        groupId: 'desempenho',
        groupLabel: 'Desempenho',
        indicatorId: 'ideb_municipios',
        indicatorLabel: 'IDEB',
        unit: 'pts',
        source: 'INEP',
        year: 2023,
        municipioSlug: 'rio-branco',
        value: 5.7,
      },
    ]

    expect(validateMapRows(rows)).toEqual([
      'educacao::desempenho::ideb_municipios::2023::rio-branco',
    ])
  })

  it('gera uma planilha modelo municipal com todos os municipios do ano selecionado', () => {
    const bundle = createBundle()
    bundle.municipiosIndex.push({
      slug: 'cruzeiro-do-sul',
      nome: 'Cruzeiro do Sul',
      populacao: 1,
      area: 1,
      regiaoJudiciaria: 'A',
      distanciaCapital: 0,
      idhm: 0.7,
      lat: 0,
      lng: 0,
    })

    const rows = bundleToMunicipalTemplateRows(
      bundle,
      'educacao::desempenho::ideb_municipios',
      2023,
    )

    expect(rows).toHaveLength(2)
    expect(rows[0]?.municipioSlug).toBe('rio-branco')
    expect(rows[0]?.value).toBe(5.6)
    expect(rows[1]?.municipioSlug).toBe('cruzeiro-do-sul')
    expect(rows[1]?.value).toBe('')
  })

  it('aplica a planilha municipal ao bundle sem perder a estrutura da variavel', () => {
    const bundle = createBundle()
    bundle.municipiosIndex.push({
      slug: 'cruzeiro-do-sul',
      nome: 'Cruzeiro do Sul',
      populacao: 1,
      area: 1,
      regiaoJudiciaria: 'A',
      distanciaCapital: 0,
      idhm: 0.7,
      lat: 0,
      lng: 0,
    })

    const rebuilt = applyMunicipalTemplateRowsToBundle(bundle, [
      {
        rowId: 'educacao::desempenho::ideb_municipios::2023::rio-branco',
        sectionId: 'educacao',
        sectionLabel: 'Educação',
        groupId: 'desempenho',
        groupLabel: 'Desempenho',
        indicatorId: 'ideb_municipios',
        indicatorLabel: 'IDEB por Município (2023)',
        unit: 'pts',
        source: 'INEP',
        year: 2023,
        municipioSlug: 'rio-branco',
        municipioNome: 'Rio Branco',
        value: 5.8,
      },
      {
        rowId: 'educacao::desempenho::ideb_municipios::2023::cruzeiro-do-sul',
        sectionId: 'educacao',
        sectionLabel: 'Educação',
        groupId: 'desempenho',
        groupLabel: 'Desempenho',
        indicatorId: 'ideb_municipios',
        indicatorLabel: 'IDEB por Município (2023)',
        unit: 'pts',
        source: 'INEP',
        year: 2023,
        municipioSlug: 'cruzeiro-do-sul',
        municipioNome: 'Cruzeiro do Sul',
        value: 4.9,
      },
    ])

    const indicator = rebuilt.sections.educacao.groups[0]?.indicators[0]
    expect(indicator?.mapSeries?.['2023']).toEqual({
      'rio-branco': 5.8,
      'cruzeiro-do-sul': 4.9,
    })
    expect(indicator?.byMunicipio).toEqual({
      'rio-branco': 5.8,
      'cruzeiro-do-sul': 4.9,
    })
    expect(indicator?.timeSeries.some((point) => point.year === 2023)).toBe(true)
  })
})
