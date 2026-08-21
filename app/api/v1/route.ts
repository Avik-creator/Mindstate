import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/infrastructure/db/postgres/client'

export const dynamic = 'force-dynamic'

// Reports what it actually observes. The previous version returned a hardcoded status and persistence flag.
export async function GET() {
  const database = await db.execute(sql`select 1`).then(() => 'reachable' as const).catch(() => 'unreachable' as const)

  return NextResponse.json({
    name: 'Mindstate API',
    version: 'v1',
    status: database === 'reachable' ? 'ok' : 'degraded',
    database,
    documentation: '/skill.md',
    authentication: { rest: 'Bearer <agent api key> or an owner session', mcp: 'Bearer <agent api key>' },
    endpoints: {
      createWorkspaceClaim: 'POST /api/v1/workspace-claims',
      enrollAgent: 'POST /api/v1/agents/bootstrap',
      memories: 'GET|POST /api/v1/memories',
      projects: 'GET|POST /api/v1/projects',
      handoffs: 'GET|POST /api/v1/handoffs',
      sessions: 'GET|POST /api/v1/sessions',
      mcp: '/api/mcp',
    },
  }, { status: database === 'reachable' ? 200 : 503, headers: { 'Cache-Control': 'no-store' } })
}
