import { handleIndicatorSectionRequest } from '../../src/lib/server/indicator-sections-handler'

export default async function handler(
  request: Parameters<typeof handleIndicatorSectionRequest>[0],
  response: Parameters<typeof handleIndicatorSectionRequest>[1],
) {
  return handleIndicatorSectionRequest(request, response)
}
