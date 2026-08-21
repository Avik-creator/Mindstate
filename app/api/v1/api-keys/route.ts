import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { desc, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { apiKeyCreateSchema, validationError } from '@/lib/application/contracts'
import { apiGuard } from '@/lib/dal/api-guard'
import { db } from '@/lib/infrastructure/db/postgres/client'
import { apiKeys } from '@/lib/infrastructure/db/postgres/schema'

export async function GET(request: Request) {
  const { actor, response } = await apiGuard(request, undefined, { sessionOnly: true })
  if (!actor) return response
  const data = await db.select({ id: apiKeys.id, name: apiKeys.name, prefix: apiKeys.prefix, lastUsedAt: apiKeys.lastUsedAt, revokedAt: apiKeys.revokedAt, createdAt: apiKeys.createdAt }).from(apiKeys).where(eq(apiKeys.userId, actor.userId)).orderBy(desc(apiKeys.createdAt))
  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  const { actor, response } = await apiGuard(request, undefined, { sessionOnly: true })
  if (!actor) return response
  const parsed = apiKeyCreateSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 })
  const plaintext = `tb_live_${randomBytes(32).toString('base64url')}`
  const prefix = plaintext.slice(0, 16)
  await db.insert(apiKeys).values({ id: randomUUID(), userId: actor.userId, agentId: parsed.data.agentId, name: parsed.data.name, scopes: parsed.data.scopes, prefix, keyHash: createHash('sha256').update(plaintext).digest('hex') })
  return NextResponse.json({ data: { key: plaintext, prefix, name: parsed.data.name, scopes: parsed.data.scopes }, warning: 'Copy this key now. It will not be shown again.' }, { status: 201 })
}
