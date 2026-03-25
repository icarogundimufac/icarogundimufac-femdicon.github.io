import { handleAdminSessionRequest } from '@/lib/server/admin-session-handler'

vi.mock('@/lib/server/admin-session', () => ({
  clearAdminSessionCookie: vi.fn(() => 'portal-admin-session=; Max-Age=0'),
  createAdminSessionCookie: vi.fn(() => 'portal-admin-session=valid-token'),
  isValidAdminPassword: vi.fn((password: string) => password === 'SEPLANAC'),
}))

function createResponse() {
  return {
    statusCode: 200,
    payload: undefined as unknown,
    headers: {} as Record<string, string | string[]>,
    status(code: number) {
      this.statusCode = code
      return this
    },
    json(body: unknown) {
      this.payload = body
    },
    setHeader(name: string, value: string | string[]) {
      this.headers[name] = value
    },
  }
}

describe('handleAdminSessionRequest', () => {
  it('abre a sessao e define cookie quando a senha esta correta', async () => {
    const response = createResponse()

    await handleAdminSessionRequest(
      {
        method: 'POST',
        body: { password: 'SEPLANAC' },
      },
      response,
    )

    expect(response.statusCode).toBe(200)
    expect(response.headers['Set-Cookie']).toBe('portal-admin-session=valid-token')
    expect(response.payload).toEqual({ ok: true })
  })

  it('recusa a sessao quando a senha esta incorreta', async () => {
    const response = createResponse()

    await handleAdminSessionRequest(
      {
        method: 'POST',
        body: { password: 'errada' },
      },
      response,
    )

    expect(response.statusCode).toBe(401)
    expect(response.payload).toEqual({ message: 'Senha incorreta.' })
  })
})
