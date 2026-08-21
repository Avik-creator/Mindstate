import 'server-only'
import { betterAuth } from 'better-auth'
import { pool } from '@/lib/infrastructure/db/postgres/client'

// Deployment-derived, never a literal domain: a fork must not point its auth at somebody else's host.
const deploymentUrl =
  process.env.BETTER_AUTH_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined) ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ??
  process.env.V0_RUNTIME_URL

const configuredOrigins = (process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? '').split(',').map((value) => value.trim()).filter(Boolean)

// Any local port, so a dev server started off 3000 is not silently rejected. Development only.
const developmentOrigins = ['http://localhost:*', 'http://127.0.0.1:*', process.env.V0_RUNTIME_URL, process.env.V0_DEV_APP_URL, process.env.V0_BUILD_URL, process.env.V0_SANDBOX_URL]

export const auth = betterAuth({
  database: pool,
  ...(deploymentUrl ? { baseURL: deploymentUrl } : {}),
  emailAndPassword: { enabled: true, autoSignIn: true },
  trustedOrigins: [
    ...configuredOrigins,
    ...(deploymentUrl ? [deploymentUrl] : []),
    ...(process.env.NODE_ENV === 'development' ? developmentOrigins.filter((value): value is string => Boolean(value)) : []),
  ],
  session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
  // In-memory buckets, so limits are per serverless instance rather than global.
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    customRules: {
      '/sign-in/email': { window: 60, max: 5 },
      '/sign-up/email': { window: 3600, max: 10 },
    },
  },
  ...(process.env.NODE_ENV === 'development' ? { advanced: { defaultCookieAttributes: { sameSite: 'none' as const, secure: true } } } : {}),
})
