// Applies pending migrations during a Vercel production build, after the build succeeds and
// before the deployment is promoted. A failure here fails the deploy, so the old code keeps
// serving rather than new code meeting an old schema.
//
// Deliberately does nothing anywhere else:
//   - a local `pnpm build` must never migrate, and .env may point at production
//   - preview deploys may share the production DATABASE_URL, so a preview of an unmerged
//     branch could otherwise migrate production ahead of the code that needs it
import { execFileSync } from 'node:child_process'

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

console.log('[migrate] applying pending migrations')
try {
  // drizzle-kit, not the programmatic migrator, so bookkeeping matches every migration applied so far.
  execFileSync('pnpm', ['exec', 'drizzle-kit', 'migrate'], { stdio: 'inherit' })
  console.log('[migrate] up to date')
} catch {
  console.error('[migrate] failed — deployment aborted, existing version stays live')
  process.exit(1)
}
