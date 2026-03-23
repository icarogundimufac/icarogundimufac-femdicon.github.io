import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { MapasRoute } from '@/routes/MapasRoute'
import { portalDataClient } from '@/lib/data/client'
import type { IndicatorSection } from '@/types/indicators'
import type { MunicipioSummary } from '@/types/municipio'

vi.mock('@/components/maps/AcreMap', () => ({
  AcreMap: ({
    label,
    unit,
    dataByMunicipio,
  }: {
    label: string
    unit: string
    dataByMunicipio: Record<string, number>
  }) => (
    <div data-testid="acre-map">
      {label} | {unit} | {Object.keys(dataByMunicipio).join(',')}
    </div>
  ),
}))

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

const MUNICIPIOS: MunicipioSummary[] = [
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
]

describe('MapasRoute', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('troca variável e ano com base no catálogo do mapa', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
    const user = userEvent.setup()

    vi.spyOn(portalDataClient, 'getMunicipios').mockResolvedValue(MUNICIPIOS)
    vi.spyOn(portalDataClient, 'getSection').mockImplementation(async (sectionId) => {
      switch (sectionId) {
        case 'educacao':
          return createSection('educacao', 'Educação', [
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
                    '2022': {
                      'rio-branco': 5.1,
                      'cruzeiro-do-sul': 4.8,
                    },
                    '2023': {
                      'rio-branco': 5.6,
                      'cruzeiro-do-sul': 5.1,
                    },
                  },
                },
              ],
            },
          ])
        case 'saude':
          return createSection('saude', 'Saúde', [
            {
              id: 'atencao_basica',
              label: 'Atenção Básica',
              indicators: [
                {
                  id: 'cobertura_ab',
                  label: 'Cobertura AB',
                  description: '',
                  unit: '%',
                  source: 'DATASUS',
                  timeSeries: [],
                  mapSeries: {
                    '2021': {
                      'rio-branco': 70,
                      'cruzeiro-do-sul': 80,
                    },
                    '2023': {
                      'rio-branco': 75,
                      'cruzeiro-do-sul': 83,
                    },
                  },
                },
              ],
            },
          ])
        case 'seguranca':
          return createSection('seguranca', 'Segurança', [])
        case 'orcamento':
          return createSection('orcamento', 'Orçamento', [])
      }
    })

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <MapasRoute />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    await waitFor(() =>
      expect(screen.getByTestId('acre-map')).toHaveTextContent(
        'IDEB por Município (2023) | pts | rio-branco,cruzeiro-do-sul',
      ),
    )

    const selects = screen.getAllByRole('combobox')

    await user.selectOptions(selects[1]!, '2022')

    await waitFor(() =>
      expect(screen.getByTestId('acre-map')).toHaveTextContent(
        'IDEB por Município (2022) | pts | rio-branco,cruzeiro-do-sul',
      ),
    )

    await user.selectOptions(selects[0]!, 'saude::atencao_basica::cobertura_ab')

    await waitFor(() =>
      expect(screen.getByTestId('acre-map')).toHaveTextContent(
        'Cobertura AB (2023) | % | rio-branco,cruzeiro-do-sul',
      ),
    )
  })
})
