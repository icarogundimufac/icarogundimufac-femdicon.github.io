import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { formatNumber } from '@/lib/utils/format'
import type { MunicipioSummary } from '@/types/municipio'

interface MunicipiosSearchProps {
  municipios: MunicipioSummary[]
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" strokeLinecap="round" />
    </svg>
  )
}

export function MunicipiosSearch({ municipios }: MunicipiosSearchProps) {
  const [search, setSearch] = useState('')

  const filteredMunicipios = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return municipios
    }

    return municipios.filter((municipio) =>
      municipio.nome.toLowerCase().includes(query),
    )
  }, [municipios, search])

  return (
    <>
      <div className="mb-6 max-w-sm">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-areia-400">
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder="Buscar município..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-areia-200 rounded-lg text-areia-700 placeholder:text-areia-400 focus:outline-none focus:ring-2 focus:ring-verde-500/30 focus:border-verde-500 font-jakarta transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredMunicipios.map((municipio) => (
          <Link key={municipio.slug} to={`/municipios/${municipio.slug}`}>
            <Card hover className="p-5 cursor-pointer group">
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="font-semibold text-verde-900 font-fraunces text-sm leading-tight group-hover:text-verde-600 transition-colors">
                  {municipio.nome}
                </h3>
                <svg
                  viewBox="0 0 16 16"
                  className="w-3.5 h-3.5 text-areia-300 group-hover:text-verde-500 flex-shrink-0 mt-0.5 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-jakarta">
                  <span className="text-areia-400">População</span>
                  <span className="font-semibold text-areia-700 tabular-nums">
                    {formatNumber(municipio.populacao)}
                  </span>
                </div>
                <div className="flex justify-between text-xs font-jakarta">
                  <span className="text-areia-400">Área</span>
                  <span className="font-semibold text-areia-700 tabular-nums">
                    {formatNumber(municipio.area)} km²
                  </span>
                </div>
                <div className="flex justify-between text-xs font-jakarta">
                  <span className="text-areia-400">IDHM</span>
                  <span className="font-semibold text-areia-700 tabular-nums">
                    {municipio.idhm.toFixed(3)}
                  </span>
                </div>
                <div className="flex justify-between text-xs font-jakarta">
                  <span className="text-areia-400">Dist. capital</span>
                  <span className="font-semibold text-areia-700 tabular-nums">
                    {municipio.distanciaCapital === 0
                      ? '—'
                      : `${formatNumber(municipio.distanciaCapital)} km`}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-areia-100">
                <span className="text-[10px] uppercase tracking-widest font-semibold text-areia-400 font-jakarta">
                  {municipio.regiaoJudiciaria}
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {filteredMunicipios.length === 0 && (
        <div className="text-center py-16">
          <p className="text-areia-400 font-jakarta text-sm">
            Nenhum município encontrado para &ldquo;{search}&rdquo;.
          </p>
        </div>
      )}
    </>
  )
}
