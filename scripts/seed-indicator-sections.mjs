import fs from 'node:fs/promises'
import path from 'node:path'
import { sql } from '@vercel/postgres'

const SECTION_IDS = ['educacao', 'saude', 'seguranca', 'orcamento']

function isDatabaseConfigured() {
  return Boolean(
    process.env.POSTGRES_URL ||
      process.env.POSTGRES_PRISMA_URL ||
      process.env.POSTGRES_URL_NON_POOLING,
  )
}

async function main() {
  if (!isDatabaseConfigured()) {
    throw new Error(
      'Configure POSTGRES_URL (ou variavel equivalente da Vercel Postgres) antes de rodar o seed.',
    )
  }

  await sql`
    CREATE TABLE IF NOT EXISTS indicator_sections (
      section_id TEXT PRIMARY KEY,
      payload JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  for (const sectionId of SECTION_IDS) {
    const filePath = path.join(process.cwd(), 'public', 'data', `${sectionId}.json`)
    const payload = await fs.readFile(filePath, 'utf8')

    await sql`
      INSERT INTO indicator_sections (section_id, payload, updated_at)
      VALUES (${sectionId}, ${payload}::jsonb, NOW())
      ON CONFLICT (section_id)
      DO UPDATE SET
        payload = EXCLUDED.payload,
        updated_at = NOW()
    `

    console.log(`Seeded ${sectionId}`)
  }

  console.log('Indicador sections seed completed.')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
