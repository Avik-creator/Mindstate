import { NextResponse } from 'next/server'
import { pruneExpiredRecords } from '@/lib/application/maintenance-service'

export const dynamic = 'force-dynamic'

// Vercel Cron calls this with the project's CRON_SECRET. Without that secret configured the route stays closed.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return NextResponse.json({ error: { code: 'NOT_CONFIGURED', message: 'Maintenance is not configured.' } }, { status: 404 })
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 })
  }
  return NextResponse.json({ data: await pruneExpiredRecords() }, { headers: { 'Cache-Control': 'no-store' } })
}
