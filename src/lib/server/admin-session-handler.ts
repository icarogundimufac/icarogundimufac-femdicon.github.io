import {
  clearAdminSessionCookie,
  createAdminSessionCookie,
  isValidAdminPassword,
} from '@/lib/server/admin-session'
import {
  type ServerlessRequest,
  type ServerlessResponse,
  json,
  readJsonBody,
} from '@/lib/server/http'

interface AdminSessionBody {
  password?: unknown
}

export async function handleAdminSessionRequest(
  request: ServerlessRequest,
  response: ServerlessResponse,
) {
  if (request.method === 'DELETE') {
    response.setHeader('Set-Cookie', clearAdminSessionCookie())
    return json(response, 200, { ok: true })
  }

  if (request.method !== 'POST') {
    return json(response, 405, { message: 'Metodo nao suportado.' })
  }

  const body = await readJsonBody<AdminSessionBody>(request)
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!isValidAdminPassword(password)) {
    response.setHeader('Set-Cookie', clearAdminSessionCookie())
    return json(response, 401, { message: 'Senha incorreta.' })
  }

  response.setHeader('Set-Cookie', createAdminSessionCookie())
  return json(response, 200, { ok: true })
}
