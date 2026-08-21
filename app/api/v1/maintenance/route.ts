import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { pruneExpiredRecords } from '@/lib/application/maintenance-service'

export const dynamic = 'force-dynamic'

// Constant time, so the comparison cannot leak the secret a character at a time.
function bearerMatches(header: string | null, secret: string) {
  const expected = Buffer.from(`Bearer ${secret}`)
  const actual = Buffer.from(header ?? '')
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

// Vercel Cron calls this with the project's CRON_SECRET. Without that secret configured the route stays closed.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return NextResponse.json({ error: { code: 'NOT_CONFIGURED', message: 'Maintenance is not configured.' } }, { status: 404 })
  if (!bearerMatches(request.headers.get('authorization'), secret)) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 })
  }
  return NextResponse.json({ data: await pruneExpiredRecords() }, { headers: { 'Cache-Control': 'no-store' } })
}
