import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { MunicipiosSearch } from '@/components/municipios/MunicipiosSearch'
import type { MunicipioSummary } from '@/types/municipio'

const MUNICIPIOS: MunicipioSummary[] = [
  {
    slug: 'rio-branco',
    nome: 'Rio Branco',
    populacao: 419452,
    area: 8834,
    regiaoJudiciaria: 'Alto Acre',
    distanciaCapital: 0,
    idhm: 0.727,
    lat: -9.9754,
    lng: -67.8249,
  },
  {
    slug: 'cruzeiro-do-sul',
    nome: 'Cruzeiro do Sul',
    populacao: 88432,
    area: 8779,
    regiaoJudiciaria: 'Juruá',
    distanciaCapital: 635,
    idhm: 0.664,
    lat: -7.6306,
    lng: -72.671,
  },
]

describe('MunicipiosSearch', () => {
  it('filtra municípios pelo texto digitado', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <MunicipiosSearch municipios={MUNICIPIOS} />
      </MemoryRouter>,
    )

    await user.type(screen.getByPlaceholderText('Buscar município...'), 'Rio')

    expect(screen.getByText('Rio Branco')).toBeInTheDocument()
    expect(screen.queryByText('Cruzeiro do Sul')).not.toBeInTheDocument()
  })
})
