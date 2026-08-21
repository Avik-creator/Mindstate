import { sql } from 'drizzle-orm'
import { bigint, boolean, customType, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

const tsvector = customType<{ data: string }>({ dataType: () => 'tsvector' })

export const user = pgTable('user', {
  id: text('id').primaryKey(), name: text('name').notNull(), email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false), image: text('image'),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
})
export const session = pgTable('session', {
  id: text('id').primaryKey(), expiresAt: timestamp('expiresAt', { withTimezone: true }).notNull(), token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
  ipAddress: text('ipAddress'), userAgent: text('userAgent'), userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
})
export const account = pgTable('account', {
  id: text('id').primaryKey(), accountId: text('accountId').notNull(), providerId: text('providerId').notNull(), issuer: text('issuer').notNull(),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }), accessToken: text('accessToken'), refreshToken: text('refreshToken'),
  idToken: text('idToken'), accessTokenExpiresAt: timestamp('accessTokenExpiresAt', { withTimezone: true }), refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt', { withTimezone: true }),
  scope: text('scope'), password: text('password'), createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex('account_issuer_accountId_uidx').on(t.issuer, t.accountId)])
export const verification = pgTable('verification', {
  id: text('id').primaryKey(), identifier: text('identifier').notNull(), value: text('value').notNull(), expiresAt: timestamp('expiresAt', { withTimezone: true }).notNull(),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
})
export const projects = pgTable('projects', {
  id: text('id').primaryKey(), userId: text('userId').notNull(), name: text('name').notNull(), description: text('description').notNull().default(''),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('projects_user_idx').on(t.userId)])
export const agentSessions = pgTable('agent_sessions', {
  id: text('id').primaryKey(), userId: text('userId').notNull(), projectId: text('projectId'), agentId: text('agentId'), title: text('title').notNull(), agent: text('agent').notNull().default('manual'), status: text('status').notNull().default('active'),
  metadata: jsonb('metadata').$type<Record<string, string>>().notNull().default({}), lastHeartbeatAt: timestamp('lastHeartbeatAt', { withTimezone: true }).notNull().defaultNow(), endedAt: timestamp('endedAt', { withTimezone: true }),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('sessions_user_idx').on(t.userId), index('sessions_live_idx').on(t.userId, t.status, t.lastHeartbeatAt), index('sessions_agent_idx').on(t.userId, t.agentId)])
export const memories = pgTable('memories', {
  id: text('id').primaryKey(), userId: text('userId').notNull(), projectId: text('projectId'), sessionId: text('sessionId'), title: text('title').notNull(), content: text('content').notNull(),
  type: text('type').notNull().default('context'), tags: jsonb('tags').$type<string[]>().notNull().default([]), source: text('source').notNull().default('manual'), actorType: text('actorType').notNull().default('user'), actorId: text('actorId'),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
  searchVector: tsvector('searchVector').generatedAlwaysAs(sql`setweight(to_tsvector('english', coalesce("title", '')), 'A') || setweight(to_tsvector('english', coalesce("content", '')), 'B')`),
}, (t) => [index('memories_user_updated_idx').on(t.userId, t.updatedAt), index('memories_project_idx').on(t.userId, t.projectId), index('memories_search_idx').using('gin', t.searchVector)])
export const handoffs = pgTable('handoffs', {
  id: text('id').primaryKey(), userId: text('userId').notNull(), projectId: text('projectId'), sessionId: text('sessionId'), title: text('title').notNull(), summary: text('summary').notNull(), nextSteps: jsonb('nextSteps').$type<string[]>().notNull().default([]),
  status: text('status').notNull().default('open'),
  claimedBySessionId: text('claimedBySessionId'), claimedByAgentId: text('claimedByAgentId'), claimedAt: timestamp('claimedAt', { withTimezone: true }),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('handoffs_user_idx').on(t.userId), index('handoffs_status_idx').on(t.userId, t.status), index('handoffs_project_idx').on(t.userId, t.projectId), index('handoffs_claim_idx').on(t.userId, t.claimedBySessionId)])
export const agents = pgTable('agents', {
  id: text('id').primaryKey(), userId: text('userId').notNull(), name: text('name').notNull(), status: text('status').notNull().default('active'),
  category: text('category').notNull().default('general'), runtimeName: text('runtimeName'), runtimeVersion: text('runtimeVersion'),
  capabilities: jsonb('capabilities').$type<string[]>().notNull().default([]), detectionSignals: jsonb('detectionSignals').$type<string[]>().notNull().default([]), confidence: text('confidence').notNull().default('low'),
  observedUserAgent: text('observedUserAgent'), observedSurfaces: jsonb('observedSurfaces').$type<string[]>().notNull().default([]), observedRequests: integer('observedRequests').notNull().default(0),
  lastSeenAt: timestamp('lastSeenAt', { withTimezone: true }), revokedAt: timestamp('revokedAt', { withTimezone: true }), createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('agents_user_idx').on(t.userId), index('agents_category_idx').on(t.userId, t.category)])
export const workspaceClaims = pgTable('workspace_claims', {
  id: text('id').primaryKey(), email: text('email').notNull(), name: text('name').notNull(), agentName: text('agentName'),
  agentContext: jsonb('agentContext').$type<Record<string, string>>().notNull().default({}), tokenHash: text('tokenHash').notNull().unique(), requesterHash: text('requesterHash').notNull(),
  expiresAt: timestamp('expiresAt', { withTimezone: true }).notNull(), claimStartedAt: timestamp('claimStartedAt', { withTimezone: true }), claimedAt: timestamp('claimedAt', { withTimezone: true }),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex('workspace_claims_email_uidx').on(t.email), index('workspace_claims_requester_idx').on(t.requesterHash, t.createdAt), index('workspace_claims_expiry_idx').on(t.expiresAt)])

export const agentSignupTokens = pgTable('agent_signup_tokens', {
  id: text('id').primaryKey(), userId: text('userId').notNull(), agentName: text('agentName').notNull(), tokenHash: text('tokenHash').notNull().unique(), scopes: jsonb('scopes').$type<string[]>().notNull(),
  expiresAt: timestamp('expiresAt', { withTimezone: true }).notNull(), usedAt: timestamp('usedAt', { withTimezone: true }), createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('agent_signup_tokens_user_idx').on(t.userId)])
export const apiKeys = pgTable('api_keys', {
  id: text('id').primaryKey(), userId: text('userId').notNull(), agentId: text('agentId'), name: text('name').notNull(), prefix: text('prefix').notNull(), keyHash: text('keyHash').notNull().unique(), scopes: jsonb('scopes').$type<string[]>().notNull().default(['memory:read']), lastUsedAt: timestamp('lastUsedAt', { withTimezone: true }), revokedAt: timestamp('revokedAt', { withTimezone: true }), createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('api_keys_user_idx').on(t.userId), index('api_keys_agent_idx').on(t.userId, t.agentId)])

// Better Auth's own rate-limit store. Database-backed so limits bound the deployment, not one warm instance.
export const rateLimit = pgTable('rateLimit', {
  id: text('id').primaryKey(), key: text('key').notNull(), count: integer('count').notNull().default(0),
  lastRequest: bigint('lastRequest', { mode: 'number' }).notNull(),
}, (t) => [uniqueIndex('rateLimit_key_uidx').on(t.key)])

// Fixed-window quota for credentialled API traffic, keyed per credential per window.
export const apiRateLimits = pgTable('api_rate_limits', {
  key: text('key').primaryKey(), count: integer('count').notNull().default(0),
  expiresAt: timestamp('expiresAt', { withTimezone: true }).notNull(),
}, (t) => [index('api_rate_limits_expiry_idx').on(t.expiresAt)])

// Append-only. Destructive actions are recorded here because the rows they act on are gone.
export const auditEvents = pgTable('audit_events', {
  id: text('id').primaryKey(), userId: text('userId').notNull(),
  actorType: text('actorType').notNull(), actorId: text('actorId'), credentialId: text('credentialId'),
  action: text('action').notNull(), targetType: text('targetType').notNull(), targetId: text('targetId').notNull(),
  summary: text('summary').notNull().default(''), metadata: jsonb('metadata').$type<Record<string, string>>().notNull().default({}),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('audit_user_created_idx').on(t.userId, t.createdAt), index('audit_target_idx').on(t.userId, t.targetType, t.targetId)])
