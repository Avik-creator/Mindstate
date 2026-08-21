// Read-only production schema check. Runs no DDL and writes nothing.
// Usage: node scripts/inspect-db.mjs
import { Pool } from 'pg'
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync('.env', 'utf8')
    .split('\n')
    .filter((line) => line.includes('='))
    .map((line) => {
      const at = line.indexOf('=')
      return [line.slice(0, at).trim(), line.slice(at + 1).trim().replace(/^["']|["']$/g, '')]
    }),
)

const pool = new Pool({ connectionString: env.DATABASE_URL, max: 1 })
const q = async (sql) => (await pool.query(sql)).rows

try {
  const tables = (await q(`select table_name from information_schema.tables where table_schema='public' order by 1`)).map((r) => r.table_name)
  const has = (t) => (tables.includes(t) ? 'PRESENT' : 'MISSING')

  console.log('tables:', tables.join(', '), '\n')
  console.log('-- what the deployed code requires --')
  console.log('  rateLimit        ', has('rateLimit'), has('rateLimit') === 'MISSING' ? '<- breaks sign-in' : '')
  console.log('  api_rate_limits  ', has('api_rate_limits'), has('api_rate_limits') === 'MISSING' ? '<- breaks every agent request' : '')

  const sv = await q(`select 1 from information_schema.columns where table_name='memories' and column_name='searchVector'`)
  console.log('  memories.searchVector', sv.length ? 'PRESENT' : 'MISSING  <- breaks memory list and search')

  const ts = await q(`select data_type, count(*)::int as n from information_schema.columns
    where table_schema='public' and data_type like 'timestamp%' group by 1 order by 2 desc`)
  console.log('  timestamp columns    ', ts.map((r) => `${r.n} ${r.data_type}`).join(', '))

  console.log('\n-- drizzle bookkeeping (decides whether migrate is safe) --')
  const bk = await q(`select table_schema from information_schema.tables where table_name='__drizzle_migrations'`)
  if (!bk.length) {
    console.log('  __drizzle_migrations: MISSING')
    console.log('  => drizzle-kit migrate would replay from 0000 and fail on existing tables')
  } else {
    const rows = await q(`select created_at from "${bk[0].table_schema}".__drizzle_migrations order by created_at`)
    console.log(`  __drizzle_migrations in schema "${bk[0].table_schema}": ${rows.length} migrations recorded`)
  }
} finally {
  await pool.end()
}
