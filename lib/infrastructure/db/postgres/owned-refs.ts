import 'server-only'

import { and, eq } from 'drizzle-orm'
import { db } from './client'
import { agentSessions, projects } from './schema'
import { ReferenceNotFoundError } from '@/lib/application/contracts'

// projectId and sessionId are plain text columns with no foreign key, so nothing but this
// stops a record being filed against a project or session the caller cannot see.
export async function ownedProject(userId: string, id: string) {
  const [row] = await db.select({ id: projects.id }).from(projects).where(and(eq(projects.userId, userId), eq(projects.id, id))).limit(1)
  return row
}

export async function ownedSession(userId: string, id: string) {
  const [row] = await db.select({ id: agentSessions.id }).from(agentSessions).where(and(eq(agentSessions.userId, userId), eq(agentSessions.id, id))).limit(1)
  return row
}

// A typed error, so a database outage here cannot be reported to the caller as a bad request.
export async function assertOwnedRefs(userId: string, refs: { projectId?: string | null; sessionId?: string | null }) {
  if (refs.projectId && !(await ownedProject(userId, refs.projectId))) throw new ReferenceNotFoundError('PROJECT_NOT_FOUND')
  if (refs.sessionId && !(await ownedSession(userId, refs.sessionId))) throw new ReferenceNotFoundError('SESSION_NOT_FOUND')
}
