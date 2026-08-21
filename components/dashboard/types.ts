export type View = 'Overview' | 'Memories' | 'Projects' | 'Sessions' | 'Handoffs' | 'Agents'

export type Memory = {
  id: string
  title: string
  content: string
  type: 'decision' | 'context' | 'preference' | 'handoff'
  projectId: string | null
  tags: string[]
  source: string
  updatedAt: string
}

export type Project = {
  id: string
  name: string
  description: string
  memoryCount: number
  sessionCount: number
  handoffCount: number
  updatedAt: string
}

export type Session = {
  id: string
  title: string
  agent: string
  presence: 'live' | 'stale' | 'completed'
  memoryCount: number
  lastHeartbeatAt: string
}

export type Handoff = {
  id: string
  title: string
  summary: string
  status: 'open' | 'closed'
  projectId: string | null
  nextSteps: string[]
  updatedAt: string
}

export type Agent = {
  id: string
  name: string
  status: string
  category: string
  runtimeName: string | null
  capabilities: string[]
  confidence: string
  lastSeenAt: string | null
  revokedAt: string | null
}

export type ApiKey = {
  id: string
  name: string
  prefix: string
  lastUsedAt: string | null
  revokedAt: string | null
  createdAt: string
}

export type MemoryPage = {
  data: Memory[]
  page: { limit: number; offset: number; total: number }
}

export type Summary = {
  memories: number
  projects: number
  agents: number
  openHandoffs: number
  sessions: { live: number; stale: number; completed: number }
}

export const VIEWS: View[] = ['Overview', 'Memories', 'Projects', 'Sessions', 'Handoffs', 'Agents']

export function isView(value: string | undefined): value is View {
  return !!value && (VIEWS as string[]).includes(value)
}
