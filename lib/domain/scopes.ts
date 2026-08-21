// Scope vocabulary for agent credentials. Owner sessions are unscoped and hold all of them.
export const SCOPES = [
  'memory:read',
  'memory:write',
  'session:read',
  'session:write',
  'project:read',
  'project:write',
  'handoff:read',
  'handoff:write',
  'agent:write',
] as const

export type Scope = (typeof SCOPES)[number]

// Scopes the original four-scope vocabulary implied. Drives the one-time data migration, not runtime checks.
export const LEGACY_SCOPE_EXPANSION: Record<string, Scope[]> = {
  'memory:read': ['project:read', 'handoff:read'],
  'memory:write': ['project:write', 'handoff:write', 'agent:write'],
}

// Owner sessions carry no credentialId and are unscoped, so they pass every check.
export function can(actor: { credentialId?: string; scopes?: Scope[] }, scope: Scope) {
  return !actor.credentialId || actor.scopes?.includes(scope) === true
}
