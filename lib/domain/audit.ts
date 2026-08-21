// Actions that destroy or disable something. Reversible edits are not audited here.
export const AUDIT_ACTIONS = [
  'memory.delete',
  'project.delete',
  'agent.revoke',
  'api_key.revoke',
] as const

export type AuditAction = (typeof AUDIT_ACTIONS)[number]

export type AuditEntry = {
  action: AuditAction
  targetType: 'memory' | 'project' | 'agent' | 'api_key'
  targetId: string
  // What was destroyed, captured before it goes, since the row will not be there to look at.
  summary?: string
  metadata?: Record<string, string>
}
