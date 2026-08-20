import { desc, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { actorFromRequest } from '@/lib/dal/request-actor'
import { db } from '@/lib/infrastructure/db/postgres/client'
import { agents } from '@/lib/infrastructure/db/postgres/schema'

export async function GET(request: Request) {
  const actor = await actorFromRequest(request)
  if (!actor || actor.credentialId) return NextResponse.json({ error: { code: 'SESSION_REQUIRED', message: 'Owner session authentication required' } }, { status: 401 })
  const data = await db.select().from(agents).where(eq(agents.userId, actor.userId)).orderBy(desc(agents.createdAt))
  return NextResponse.json({ data })
}
