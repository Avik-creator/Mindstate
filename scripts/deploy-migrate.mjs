// Applies pending migrations during a Vercel production build, after the build succeeds and
// before the deployment is promoted. A failure here fails the deploy, so the old code keeps
// serving rather than new code meeting an old schema.
//
// Deliberately does nothing anywhere else:
//   - a local `pnpm build` must never migrate, and .env may point at production
//   - preview deploys may share the production DATABASE_URL, so a preview of an unmerged
//     branch could otherwise migrate production ahead of the code that needs it
import { execFileSync } from 'node:child_process'
import { Pool } from 'pg'

const { VERCEL, VERCEL_ENV, DATABASE_URL } = process.env

if (!VERCEL) {
  console.log('[migrate] skipped: not a Vercel build')
  process.exit(0)
}

if (VERCEL_ENV !== 'production') {
  console.log(`[migrate] skipped: VERCEL_ENV is "${VERCEL_ENV ?? 'unset'}", not "production"`)
  process.exit(0)
}

if (!DATABASE_URL) {
  console.error('[migrate] DATABASE_URL is not set for this environment')
  process.exit(1)
}

// Arbitrary but fixed, so every deploy of this project contends for the same lock.
const LOCK_KEY = 4021970113
const WAIT_MS = 120_000
const POLL_MS = 2_000

const pool = new Pool({ connectionString: DATABASE_URL, max: 1 })
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Two production deploys running at once would otherwise both migrate. The advisory lock is
// held on this connection for the duration and released when it closes, even on a crash.
async function acquireLock(client) {
  const deadline = Date.now() + WAIT_MS
  for (;;) {
    const { rows } = await client.query('select pg_try_advisory_lock($1) as ok', [LOCK_KEY])
    if (rows[0].ok) return true
    if (Date.now() >= deadline) return false
    console.log('[migrate] another deployment holds the migration lock, waiting')
    await sleep(POLL_MS)
  }
}

const client = await pool.connect()
try {
  if (!(await acquireLock(client))) {
    console.error(`[migrate] could not acquire the migration lock within ${WAIT_MS / 1000}s`)
    process.exit(1)
  }

  console.log('[migrate] lock acquired, applying pending migrations')
  // drizzle-kit, not the programmatic migrator, so bookkeeping matches every migration applied so far.
  execFileSync('pnpm', ['exec', 'drizzle-kit', 'migrate'], { stdio: 'inherit' })
  console.log('[migrate] up to date')
} catch {
  console.error('[migrate] failed — deployment aborted, existing version stays live')
  process.exitCode = 1
} finally {
  await client.query('select pg_advisory_unlock($1)', [LOCK_KEY]).catch(() => {})
  client.release()
  await pool.end()
}
