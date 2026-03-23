import { QueryClient } from '@tanstack/react-query'
import {
  portalDataClient,
  prefetchPathData,
  queryKeys,
} from '@/lib/data/client'

describe('portalDataClient', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('carrega uma seção pelo caminho esperado', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ id: 'educacao', groups: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )

    const data = await portalDataClient.getSection('educacao')

    expect(fetchSpy).toHaveBeenCalledWith('/data/educacao.json')
    expect(data).toEqual({ id: 'educacao', groups: [] })
  })

  it('retorna null para arquivo opcional inexistente', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status: 404 }),
    )

    const data = await portalDataClient.getMunicipio('nao-existe')

    expect(data).toBeNull()
  })

  it('retorna null para arquivo opcional quando o dev server devolve HTML no lugar do JSON', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('<!doctype html><html></html>', {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      }),
    )

    const data = await portalDataClient.getMunicipio('sena-madureira')

    expect(data).toBeNull()
  })

  it('prefaz os dados corretos para a rota de mapas', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })

    await prefetchPathData(queryClient, '/mapas')

    expect(fetchSpy).toHaveBeenCalledWith('/data/educacao.json')
    expect(fetchSpy).toHaveBeenCalledWith('/data/saude.json')
    expect(fetchSpy).toHaveBeenCalledWith('/data/seguranca.json')
    expect(fetchSpy).toHaveBeenCalledWith('/data/orcamento.json')
    expect(fetchSpy).toHaveBeenCalledWith('/data/municipios/index.json')
    expect(fetchSpy).toHaveBeenCalledWith('/shapefiles/acre-municipios.geojson')
    expect(queryClient.getQueryData(queryKeys.section('educacao'))).toEqual({ ok: true })
  })
})
