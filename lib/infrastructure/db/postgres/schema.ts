import { boolean, index, jsonb, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

export const user = pgTable('user', {
  id: text('id').primaryKey(), name: text('name').notNull(), email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false), image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(), updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})
export const session = pgTable('session', {
  id: text('id').primaryKey(), expiresAt: timestamp('expiresAt').notNull(), token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(), updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'), userAgent: text('userAgent'), userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
})
export const account = pgTable('account', {
  id: text('id').primaryKey(), accountId: text('accountId').notNull(), providerId: text('providerId').notNull(), issuer: text('issuer').notNull(),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }), accessToken: text('accessToken'), refreshToken: text('refreshToken'),
  idToken: text('idToken'), accessTokenExpiresAt: timestamp('accessTokenExpiresAt'), refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'), password: text('password'), createdAt: timestamp('createdAt').notNull().defaultNow(), updatedAt: timestamp('updatedAt').notNull().defaultNow(),
}, (t) => [uniqueIndex('account_issuer_accountId_uidx').on(t.issuer, t.accountId)])
export const verification = pgTable('verification', {
  id: text('id').primaryKey(), identifier: text('identifier').notNull(), value: text('value').notNull(), expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(), updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})
export const projects = pgTable('projects', {
  id: text('id').primaryKey(), userId: text('userId').notNull(), name: text('name').notNull(), description: text('description').notNull().default(''),
  createdAt: timestamp('createdAt').notNull().defaultNow(), updatedAt: timestamp('updatedAt').notNull().defaultNow(),
}, (t) => [index('projects_user_idx').on(t.userId)])
export const agentSessions = pgTable('agent_sessions', {
  id: text('id').primaryKey(), userId: text('userId').notNull(), projectId: text('projectId'), title: text('title').notNull(), agent: text('agent').notNull().default('manual'), status: text('status').notNull().default('active'),
  createdAt: timestamp('createdAt').notNull().defaultNow(), updatedAt: timestamp('updatedAt').notNull().defaultNow(),
}, (t) => [index('sessions_user_idx').on(t.userId)])
export const memories = pgTable('memories', {
  id: text('id').primaryKey(), userId: text('userId').notNull(), projectId: text('projectId'), sessionId: text('sessionId'), title: text('title').notNull(), content: text('content').notNull(),
  type: text('type').notNull().default('context'), tags: jsonb('tags').$type<string[]>().notNull().default([]), source: text('source').notNull().default('manual'), actorType: text('actorType').notNull().default('user'), actorId: text('actorId'),
  createdAt: timestamp('createdAt').notNull().defaultNow(), updatedAt: timestamp('updatedAt').notNull().defaultNow(),
}, (t) => [index('memories_user_updated_idx').on(t.userId, t.updatedAt), index('memories_project_idx').on(t.userId, t.projectId)])
export const handoffs = pgTable('handoffs', {
  id: text('id').primaryKey(), userId: text('userId').notNull(), projectId: text('projectId'), sessionId: text('sessionId'), title: text('title').notNull(), summary: text('summary').notNull(), nextSteps: jsonb('nextSteps').$type<string[]>().notNull().default([]),
  status: text('status').notNull().default('open'), createdAt: timestamp('createdAt').notNull().defaultNow(), updatedAt: timestamp('updatedAt').notNull().defaultNow(),
}, (t) => [index('handoffs_user_idx').on(t.userId)])
export const agents = pgTable('agents', {
  id: text('id').primaryKey(), userId: text('userId').notNull(), name: text('name').notNull(), status: text('status').notNull().default('active'),
  lastSeenAt: timestamp('lastSeenAt'), revokedAt: timestamp('revokedAt'), createdAt: timestamp('createdAt').notNull().defaultNow(),
}, (t) => [index('agents_user_idx').on(t.userId)])
export const agentSignupTokens = pgTable('agent_signup_tokens', {
  id: text('id').primaryKey(), userId: text('userId').notNull(), agentName: text('agentName').notNull(), tokenHash: text('tokenHash').notNull().unique(), scopes: jsonb('scopes').$type<string[]>().notNull(),
  expiresAt: timestamp('expiresAt').notNull(), usedAt: timestamp('usedAt'), createdAt: timestamp('createdAt').notNull().defaultNow(),
}, (t) => [index('agent_signup_tokens_user_idx').on(t.userId)])
export const apiKeys = pgTable('api_keys', {
  id: text('id').primaryKey(), userId: text('userId').notNull(), agentId: text('agentId'), name: text('name').notNull(), prefix: text('prefix').notNull(), keyHash: text('keyHash').notNull().unique(), scopes: jsonb('scopes').$type<string[]>().notNull().default(['memory:read']), lastUsedAt: timestamp('lastUsedAt'), revokedAt: timestamp('revokedAt'), createdAt: timestamp('createdAt').notNull().defaultNow(),
}, (t) => [index('api_keys_user_idx').on(t.userId), index('api_keys_agent_idx').on(t.userId, t.agentId)])
