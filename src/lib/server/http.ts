export interface ServerlessRequest {
  method?: string
  headers?: Record<string, string | string[] | undefined>
  query?: Record<string, string | string[] | undefined>
  body?: unknown
}

export interface ServerlessResponse {
  status(code: number): ServerlessResponse
  json(body: unknown): void
  setHeader(name: string, value: string | string[]): void
}

export function getHeader(
  request: ServerlessRequest,
  name: string,
) {
  const value = request.headers?.[name]
  if (Array.isArray(value)) return value[0]
  return value
}

export function getQueryParam(
  request: ServerlessRequest,
  key: string,
) {
  const value = request.query?.[key]
  if (Array.isArray(value)) return value[0]
  return value
}

export function json(
  response: ServerlessResponse,
  statusCode: number,
  body: unknown,
) {
  response.status(statusCode).json(body)
}

export async function readJsonBody<T extends Record<string, unknown>>(
  request: ServerlessRequest,
) {
  if (request.body && typeof request.body === 'object') {
    return request.body as T
  }

  if (typeof request.body === 'string') {
    try {
      return JSON.parse(request.body) as T
    } catch {
      return null
    }
  }

  return null
}
