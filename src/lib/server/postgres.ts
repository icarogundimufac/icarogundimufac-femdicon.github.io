import { sql, type QueryResult, type QueryResultRow } from '@vercel/postgres'

type Primitive = string | number | boolean | null | undefined

export function isPostgresConfigured() {
  return Boolean(
    process.env.POSTGRES_URL ||
      process.env.POSTGRES_PRISMA_URL ||
      process.env.POSTGRES_URL_NON_POOLING,
  )
}

export function postgresQuery<O extends QueryResultRow>(
  strings: TemplateStringsArray,
  ...values: Primitive[]
) {
  return sql<O>(strings, ...values) as Promise<QueryResult<O>>
}
