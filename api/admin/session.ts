import { handleAdminSessionRequest } from '../../src/lib/server/admin-session-handler'

export default async function handler(
  request: Parameters<typeof handleAdminSessionRequest>[0],
  response: Parameters<typeof handleAdminSessionRequest>[1],
) {
  return handleAdminSessionRequest(request, response)
}
