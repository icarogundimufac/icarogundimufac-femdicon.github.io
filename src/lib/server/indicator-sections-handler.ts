import { isIndicatorSectionId } from '@/lib/constants/indicator-sections'
import { hasValidAdminSession } from '@/lib/server/admin-session'
import {
  type ServerlessRequest,
  type ServerlessResponse,
  getHeader,
  getQueryParam,
  json,
  readJsonBody,
} from '@/lib/server/http'
import {
  getStoredIndicatorSection,
  isIndicatorSectionPayload,
  isSectionStoreConfigured,
  saveIndicatorSectionToStore,
} from '@/lib/server/indicator-sections-store'

interface SaveSectionBody {
  payload?: unknown
}

export async function handleIndicatorSectionRequest(
  request: ServerlessRequest,
  response: ServerlessResponse,
) {
  const sectionId = getQueryParam(request, 'sectionId')

  if (!sectionId || !isIndicatorSectionId(sectionId)) {
    return json(response, 400, { message: 'Secao invalida.' })
  }

  try {
    if (request.method === 'GET') {
      if (!isSectionStoreConfigured()) {
        return json(response, 404, { message: 'Secao ainda nao persistida.' })
      }

      const section = await getStoredIndicatorSection(sectionId)

      if (!section) {
        return json(response, 404, { message: 'Secao nao encontrada.' })
      }

      return json(response, 200, section)
    }

    if (request.method === 'PUT') {
      if (!hasValidAdminSession(getHeader(request, 'cookie'))) {
        return json(response, 401, { message: 'Sessao administrativa invalida.' })
      }

      if (!isSectionStoreConfigured()) {
        return json(response, 503, { message: 'Banco de dados nao configurado.' })
      }

      const body = await readJsonBody<SaveSectionBody>(request)
      const payload = body?.payload

      if (!isIndicatorSectionPayload(payload) || payload.id !== sectionId) {
        return json(response, 400, { message: 'Payload da secao invalido.' })
      }

      const savedSection = await saveIndicatorSectionToStore(sectionId, payload)
      return json(response, 200, { ok: true, payload: savedSection })
    }

    return json(response, 405, { message: 'Metodo nao suportado.' })
  } catch (error) {
    return json(response, 500, {
      message:
        error instanceof Error
          ? error.message
          : 'Falha ao manipular a secao no servidor.',
    })
  }
}
