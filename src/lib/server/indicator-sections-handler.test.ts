import type { IndicatorSection } from '@/types/indicators'
import { handleIndicatorSectionRequest } from '@/lib/server/indicator-sections-handler'

const saveIndicatorSectionToStore = vi.fn()
const getStoredIndicatorSection = vi.fn()
const hasValidAdminSession = vi.fn()
const isSectionStoreConfigured = vi.fn()

vi.mock('@/lib/server/admin-session', () => ({
  hasValidAdminSession: (...args: unknown[]) => hasValidAdminSession(...args),
}))

vi.mock('@/lib/server/indicator-sections-store', () => ({
  getStoredIndicatorSection: (...args: unknown[]) => getStoredIndicatorSection(...args),
  isIndicatorSectionPayload: (value: unknown) =>
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { id?: unknown }).id === 'string' &&
    Array.isArray((value as { groups?: unknown }).groups),
  isSectionStoreConfigured: () => isSectionStoreConfigured(),
  saveIndicatorSectionToStore: (...args: unknown[]) => saveIndicatorSectionToStore(...args),
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

function createSection(id: IndicatorSection['id']): IndicatorSection {
  return {
    id,
    label: 'Educacao',
    lastUpdated: '2024-03-01',
    groups: [],
  }
}

describe('handleIndicatorSectionRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna a secao persistida no GET', async () => {
    isSectionStoreConfigured.mockReturnValue(true)
    getStoredIndicatorSection.mockResolvedValue(createSection('educacao'))
    const response = createResponse()

    await handleIndicatorSectionRequest(
      { method: 'GET', query: { sectionId: 'educacao' } },
      response,
    )

    expect(response.statusCode).toBe(200)
    expect(response.payload).toEqual(createSection('educacao'))
  })

  it('recusa escrita sem sessao valida', async () => {
    isSectionStoreConfigured.mockReturnValue(true)
    hasValidAdminSession.mockReturnValue(false)
    const response = createResponse()

    await handleIndicatorSectionRequest(
      {
        method: 'PUT',
        query: { sectionId: 'educacao' },
        headers: { cookie: '' },
        body: { payload: createSection('educacao') },
      },
      response,
    )

    expect(response.statusCode).toBe(401)
    expect(saveIndicatorSectionToStore).not.toHaveBeenCalled()
  })

  it('persiste a secao no PUT autenticado', async () => {
    isSectionStoreConfigured.mockReturnValue(true)
    hasValidAdminSession.mockReturnValue(true)
    saveIndicatorSectionToStore.mockResolvedValue(createSection('educacao'))
    const response = createResponse()

    await handleIndicatorSectionRequest(
      {
        method: 'PUT',
        query: { sectionId: 'educacao' },
        headers: { cookie: 'portal-admin-session=valid' },
        body: { payload: createSection('educacao') },
      },
      response,
    )

    expect(response.statusCode).toBe(200)
    expect(response.payload).toEqual({
      ok: true,
      payload: createSection('educacao'),
    })
  })
})
