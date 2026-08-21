import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { and, count, eq, gt, isNull, lt, or } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/infrastructure/db/postgres/client'
import { workspaceClaims } from '@/lib/infrastructure/db/postgres/schema'

const CLAIM_TTL_MS = 30 * 60 * 1000
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000
const RATE_LIMIT_MAX = 8
// A reservation held by a request that died mid-flight would otherwise brick the link permanently.
const RESERVATION_LEASE_MS = 5 * 60 * 1000

export const workspaceClaimInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  agentName: z.string().trim().min(1).max(80).optional(),
  agentContext: z.record(z.string().max(40), z.string().max(160)).refine((value) => Object.keys(value).length <= 8).optional(),
}).strict()

export const completeClaimSchema = z.object({
  token: z.string().min(32).max(256),
  password: z.string().min(8).max(128),
}).strict()

function digest(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

export class ClaimRateLimitError extends Error {}
export class ClaimAlreadyCompletedError extends Error {}

export async function createWorkspaceClaim(input: z.infer<typeof workspaceClaimInputSchema>, requester: string, origin: string) {
  const requesterHash = digest(requester)
  const [{ total }] = await db.select({ total: count() }).from(workspaceClaims).where(and(
    eq(workspaceClaims.requesterHash, requesterHash),
    gt(workspaceClaims.createdAt, new Date(Date.now() - RATE_LIMIT_WINDOW_MS)),
  ))
  if (Number(total) >= RATE_LIMIT_MAX) throw new ClaimRateLimitError('Too many requests')

  const token = randomBytes(32).toString('base64url')
  const now = new Date()
  const expiresAt = new Date(now.getTime() + CLAIM_TTL_MS)
  const [row] = await db.insert(workspaceClaims).values({
    id: randomUUID(), email: input.email, name: input.name, agentName: input.agentName,
    agentContext: input.agentContext ?? {}, tokenHash: digest(token), requesterHash, expiresAt,
  }).onConflictDoUpdate({
    target: workspaceClaims.email,
    set: { name: input.name, agentName: input.agentName, agentContext: input.agentContext ?? {}, tokenHash: digest(token), requesterHash, expiresAt, claimStartedAt: null, claimedAt: null, updatedAt: now },
    setWhere: isNull(workspaceClaims.claimedAt),
  }).returning({ id: workspaceClaims.id })
  if (!row) throw new ClaimAlreadyCompletedError('Workspace already claimed')
  return { claimUrl: `${origin}/claim/${token}`, expiresAt }
}

export async function getWorkspaceClaim(token: string) {
  if (token.length < 32 || token.length > 256) return null
  const [claim] = await db.select({ name: workspaceClaims.name, email: workspaceClaims.email, agentName: workspaceClaims.agentName, expiresAt: workspaceClaims.expiresAt, claimedAt: workspaceClaims.claimedAt, claimStartedAt: workspaceClaims.claimStartedAt }).from(workspaceClaims).where(eq(workspaceClaims.tokenHash, digest(token))).limit(1)
  if (!claim) return null
  const now = new Date()
  const reserved = claim.claimStartedAt !== null && claim.claimStartedAt.getTime() > now.getTime() - RESERVATION_LEASE_MS
  return { ...claim, valid: !claim.claimedAt && !reserved && claim.expiresAt > now }
}

export async function reserveWorkspaceClaim(token: string) {
  const now = new Date()
  const leaseFloor = new Date(now.getTime() - RESERVATION_LEASE_MS)
  const [claim] = await db.update(workspaceClaims).set({ claimStartedAt: now, updatedAt: now }).where(and(
    eq(workspaceClaims.tokenHash, digest(token)), isNull(workspaceClaims.claimedAt), gt(workspaceClaims.expiresAt, now),
    or(isNull(workspaceClaims.claimStartedAt), lt(workspaceClaims.claimStartedAt, leaseFloor)),
  )).returning({ id: workspaceClaims.id, name: workspaceClaims.name, email: workspaceClaims.email })
  return claim ?? null
}

export async function completeWorkspaceClaim(id: string) {
  const now = new Date()
  await db.update(workspaceClaims).set({ claimedAt: now, updatedAt: now }).where(eq(workspaceClaims.id, id))
}

export async function releaseWorkspaceClaim(id: string) {
  await db.update(workspaceClaims).set({ claimStartedAt: null, updatedAt: new Date() }).where(and(eq(workspaceClaims.id, id), isNull(workspaceClaims.claimedAt)))
}
