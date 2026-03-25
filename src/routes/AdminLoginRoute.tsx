import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Eye, EyeOff, ShieldAlert } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { authenticateAdmin, isAdminAuthenticated } from '@/lib/auth/admin-auth'
import { cn } from '@/lib/utils/cn'

function getNextPath(search: string, stateNext?: string) {
  const params = new URLSearchParams(search)
  const nextFromQuery = params.get('next')

  if (stateNext && stateNext.startsWith('/')) return stateNext
  if (nextFromQuery && nextFromQuery.startsWith('/')) return nextFromQuery
  return '/admin/dados'
}

export function AdminLoginRoute() {
  const navigate = useNavigate()
  const location = useLocation()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const nextPath = useMemo(
    () =>
      getNextPath(
        location.search,
        (location.state as { next?: string } | null)?.next,
      ),
    [location.search, location.state],
  )

  useEffect(() => {
    if (isAdminAuthenticated()) {
      navigate(nextPath, { replace: true })
    }
  }, [navigate, nextPath])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)

    if (await authenticateAdmin(password)) {
      setIsSubmitting(false)
      navigate(nextPath, { replace: true })
      return
    }

    setIsSubmitting(false)
    setError('Senha incorreta.')
  }

  const hasPassword = password.trim().length > 0

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#efe9dc] font-jakarta text-areia-800">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.88),_transparent_32%),linear-gradient(180deg,_#f4efe4_0%,_#ece5d7_100%)]" />
      <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-white/55 blur-3xl" />
      <div className="absolute bottom-[-4rem] right-[-3rem] h-52 w-52 rounded-full bg-ouro-100/70 blur-3xl" />

      <div className="relative flex min-h-screen items-center justify-center px-4 py-8">
        <div className="w-full max-w-[380px] animate-fade-in animate-slide-up">
          <div className="relative overflow-hidden rounded-[28px] border border-white/90 bg-[linear-gradient(180deg,#ffffff_0%,#fbfaf7_100%)] p-8 shadow-[0_26px_80px_rgba(56,52,44,0.14)]">
            <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-verde-300/80 to-transparent" />

            <div className="flex justify-start">
              <Link
                to="/"
                className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm text-areia-400 transition hover:bg-areia-100 hover:text-verde-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Link>
            </div>

            <div className="mt-5 rounded-[22px] border border-verde-700/20 bg-verde-800 px-6 py-6 text-white shadow-[0_18px_36px_rgba(15,91,54,0.18)]">
              <h1 className="text-[1.95rem] font-semibold leading-[1.08]">
                Entrar no admin
              </h1>
              <p className="mt-3 max-w-[28ch] text-sm leading-6 text-white/76">
                Digite sua senha para continuar no painel de indicadores.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label
                  htmlFor="admin-password"
                  className="mb-2 block text-sm font-medium text-areia-700"
                >
                  Senha
                </label>

                <div
                  className={cn(
                    'group flex h-14 items-center rounded-[18px] border bg-white px-4 shadow-[inset_0_1px_2px_rgba(31,24,17,0.03)] transition-all',
                    error
                      ? 'border-rose-300 focus-within:border-rose-400 focus-within:ring-4 focus-within:ring-rose-100'
                      : 'border-areia-200 focus-within:border-verde-500 focus-within:ring-4 focus-within:ring-verde-100',
                  )}
                >
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.currentTarget.value)
                      if (error) setError('')
                    }}
                    placeholder="Digite sua senha"
                    className="h-full w-full bg-transparent text-[15px] text-areia-800 outline-none placeholder:text-areia-400"
                    autoFocus
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-areia-400 transition hover:bg-areia-100 hover:text-verde-700"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {error ? (
                  <div className="mt-3 flex items-center gap-2 text-sm text-rose-700">
                    <ShieldAlert className="h-4 w-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                ) : (
                  <p className="mt-3 text-xs leading-5 text-areia-400">
                    O acesso permanece ativo apenas nesta sessao.
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={!hasPassword || isSubmitting}
                className={cn(
                  'flex h-12 w-full items-center justify-center rounded-[18px] text-sm font-semibold transition-all',
                  hasPassword && !isSubmitting
                    ? 'bg-verde-700 text-white shadow-[0_16px_30px_rgba(21,114,68,0.22)] hover:-translate-y-0.5 hover:bg-verde-800'
                    : 'cursor-not-allowed bg-areia-200 text-areia-400',
                )}
              >
                {isSubmitting ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
