import type { QueryResultRow } from '@vercel/postgres'
import { isIndicatorSectionId, type IndicatorSectionId } from '@/lib/constants/indicator-sections'
import { isPostgresConfigured, postgresQuery } from '@/lib/server/postgres'
import type { IndicatorSection } from '@/types/indicators'

interface IndicatorSectionRow extends QueryResultRow {
  payload: IndicatorSection
}

let ensureTablePromise: Promise<void> | null = null

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function isSectionStoreConfigured() {
  return isPostgresConfigured()
}

export function isIndicatorSectionPayload(value: unknown): value is IndicatorSection {
  if (!isRecord(value)) return false

  return (
    typeof value.id === 'string' &&
    typeof value.label === 'string' &&
    typeof value.lastUpdated === 'string' &&
    Array.isArray(value.groups)
  )
}

async function ensureIndicatorSectionsTable() {
  if (!isPostgresConfigured()) {
    throw new Error('Banco de dados nao configurado.')
  }

  if (!ensureTablePromise) {
    ensureTablePromise = postgresQuery`
      CREATE TABLE IF NOT EXISTS indicator_sections (
        section_id TEXT PRIMARY KEY,
        payload JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `.then(() => undefined).catch((error) => {
      ensureTablePromise = null
      throw error
    })
  }

  return ensureTablePromise
}

export async function getStoredIndicatorSection(
  sectionId: IndicatorSectionId,
) {
  await ensureIndicatorSectionsTable()

  const result = await postgresQuery<IndicatorSectionRow>`
    SELECT payload
    FROM indicator_sections
    WHERE section_id = ${sectionId}
    LIMIT 1
  `

  const payload = result.rows[0]?.payload
  return isIndicatorSectionPayload(payload) ? payload : null
}

export async function saveIndicatorSectionToStore(
  sectionId: IndicatorSectionId,
  payload: IndicatorSection,
) {
  if (!isIndicatorSectionId(sectionId)) {
    throw new Error('Secao invalida.')
  }

  if (!isIndicatorSectionPayload(payload)) {
    throw new Error('Payload da secao invalido.')
  }

  await ensureIndicatorSectionsTable()

  await postgresQuery`
    INSERT INTO indicator_sections (section_id, payload, updated_at)
    VALUES (${sectionId}, ${JSON.stringify(payload)}::jsonb, NOW())
    ON CONFLICT (section_id)
    DO UPDATE SET
      payload = EXCLUDED.payload,
      updated_at = NOW()
  `

  return payload
}
