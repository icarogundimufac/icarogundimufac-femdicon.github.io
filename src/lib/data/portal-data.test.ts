import {
  getMapVariableData,
  getMapVariableOptions,
  normalizeIndicatorSection,
} from '@/lib/data/portal-data'
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

describe('portal-data helpers', () => {
  it('normaliza indicadores legados com byMunicipio para mapSeries', () => {
    const section = createSection('educacao', 'Educação', [
      {
        id: 'desempenho',
        label: 'Desempenho',
        indicators: [
          {
            id: 'ideb_municipios',
            label: 'IDEB por município',
            description: 'Indicador legado',
            unit: 'pts',
            source: 'INEP',
            timeSeries: [],
            byMunicipio: {
              'rio-branco': 5.6,
            },
          },
        ],
      },
    ])

    const normalized = normalizeIndicatorSection(section)
    const indicator = normalized.groups[0]?.indicators[0]

    expect(indicator?.mapSeries).toEqual({
      '2024': {
        'rio-branco': 5.6,
      },
    })
    expect(indicator?.byMunicipio).toEqual({
      'rio-branco': 5.6,
    })
  })

  it('gera catálogo do mapa apenas com variáveis municipais válidas', () => {
    const bundle: PortalDataBundle = {
      dashboard: { lastUpdated: '2024-03-01', kpis: [], sectionSummaries: [] },
      sections: {
        educacao: createSection('educacao', 'Educação', [
          {
            id: 'desempenho',
            label: 'Desempenho',
            indicators: [
              {
                id: 'ideb_municipios',
                label: 'IDEB',
                description: '',
                unit: 'pts',
                source: 'INEP',
                timeSeries: [],
                mapSeries: {
                  '2022': { 'rio-branco': 5.2, 'cruzeiro-do-sul': 4.9 },
                  '2023': { 'rio-branco': 5.6, 'cruzeiro-do-sul': 5.1 },
                },
              },
            ],
          },
        ]),
        saude: createSection('saude', 'Saúde', [
          {
            id: 'atencao_basica',
            label: 'Atenção básica',
            indicators: [
              {
                id: 'cobertura_ab',
                label: 'Cobertura AB',
                description: '',
                unit: '%',
                source: 'DATASUS',
                timeSeries: [],
                mapSeries: {
                  '2023': { 'rio-branco': 75, 'cruzeiro-do-sul': 82 },
                },
              },
            ],
          },
        ]),
        seguranca: createSection('seguranca', 'Segurança', []),
        orcamento: createSection('orcamento', 'Orçamento', [
          {
            id: 'despesas',
            label: 'Despesas',
            indicators: [
              {
                id: 'despesa_funcao',
                label: 'Despesa por função',
                description: '',
                unit: 'R$',
                source: 'SEFAZ',
                timeSeries: [],
                byMunicipio: {
                  educacao: 1,
                  saude: 2,
                },
              },
            ],
          },
        ]),
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
        {
          slug: 'cruzeiro-do-sul',
          nome: 'Cruzeiro do Sul',
          populacao: 1,
          area: 1,
          regiaoJudiciaria: 'A',
          distanciaCapital: 0,
          idhm: 0.7,
          lat: 0,
          lng: 0,
        },
      ],
      municipioDetails: {},
    }

    const options = getMapVariableOptions(bundle)

    expect(options.map((option) => option.indicatorId)).toEqual([
      'cobertura_ab',
      'ideb_municipios',
    ])
    expect(options.find((option) => option.indicatorId === 'ideb_municipios')?.years).toEqual([
      2022,
      2023,
    ])
  })

  it('retorna os dados do ano selecionado para o mapa', () => {
    const bundle: PortalDataBundle = {
      dashboard: { lastUpdated: '2024-03-01', kpis: [], sectionSummaries: [] },
      sections: {
        educacao: createSection('educacao', 'Educação', [
          {
            id: 'desempenho',
            label: 'Desempenho',
            indicators: [
              {
                id: 'ideb_municipios',
                label: 'IDEB por Município (2023)',
                description: '',
                unit: 'pts',
                source: 'INEP',
                timeSeries: [],
                mapSeries: {
                  '2022': { 'rio-branco': 5.1 },
                  '2023': { 'rio-branco': 5.6 },
                },
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
      municipioDetails: {},
    }

    const result = getMapVariableData(
      bundle,
      'educacao::desempenho::ideb_municipios',
      2022,
    )

    expect(result.label).toBe('IDEB por Município (2022)')
    expect(result.dataByMunicipio).toEqual({ 'rio-branco': 5.1 })
    expect(result.unit).toBe('pts')
  })
})
