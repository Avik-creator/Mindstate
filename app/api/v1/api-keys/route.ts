import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { desc, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { actorFromRequest } from '@/lib/dal/request-actor'
import { db } from '@/lib/infrastructure/db/postgres/client'
import { apiKeys } from '@/lib/infrastructure/db/postgres/schema'

export async function GET(request: Request) {
  const actor = await actorFromRequest(request)
  if (!actor || actor.credentialId) return NextResponse.json({ error: 'Session authentication required' }, { status: 401 })
  const data = await db.select({ id: apiKeys.id, name: apiKeys.name, prefix: apiKeys.prefix, lastUsedAt: apiKeys.lastUsedAt, revokedAt: apiKeys.revokedAt, createdAt: apiKeys.createdAt }).from(apiKeys).where(eq(apiKeys.userId, actor.userId)).orderBy(desc(apiKeys.createdAt))
  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  const actor = await actorFromRequest(request)
  if (!actor || actor.credentialId) return NextResponse.json({ error: 'Session authentication required' }, { status: 401 })
  const parsed = z.object({ name: z.string().trim().min(1).max(80) }).safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'A key name is required' }, { status: 400 })
  const plaintext = `tb_live_${randomBytes(24).toString('base64url')}`
  const prefix = plaintext.slice(0, 16)
  await db.insert(apiKeys).values({ id: randomUUID(), userId: actor.userId, name: parsed.data.name, prefix, keyHash: createHash('sha256').update(plaintext).digest('hex') })
  return NextResponse.json({ data: { key: plaintext, prefix, name: parsed.data.name }, warning: 'Copy this key now. It will not be shown again.' }, { status: 201 })
}
