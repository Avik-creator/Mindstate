export type MemoryKind = 'decision' | 'context' | 'preference' | 'handoff'

export type Memory = {
  id: string
  title: string
  content: string
  kind: MemoryKind
  project: string
  tags: string[]
  source: 'manual' | 'mcp'
  updatedAt: string
}

export const memories: Memory[] = [
  {
    id: 'mem_01',
    title: 'Keep the data layer replaceable',
    content:
      'Domain and application code must depend on repository contracts, not Neon or Drizzle directly. The Postgres adapter owns provider-specific search and transactions.',
    kind: 'decision',
    project: 'Threadbase',
    tags: ['architecture', 'database'],
    source: 'manual',
    updatedAt: '12 min ago',
  },
  {
    id: 'mem_02',
    title: 'Agent session goal',
    content:
      'Give agents a compact, high-signal context bundle at the beginning of a session and a structured handoff target before the session ends.',
    kind: 'context',
    project: 'Threadbase',
    tags: ['agents', 'sessions'],
    source: 'mcp',
    updatedAt: '38 min ago',
  },
  {
    id: 'mem_03',
    title: 'Interface preference',
    content:
      'Keep the dashboard quiet and utilitarian. Dense enough for scanning, with manual entry always one action away and no decorative analytics.',
    kind: 'preference',
    project: 'Personal',
    tags: ['design', 'product'],
    source: 'manual',
    updatedAt: 'Yesterday',
  },
  {
    id: 'mem_04',
    title: 'Next session checkpoint',
    content:
      'Connect Neon, create the Better Auth tables, then implement repositories before exposing write operations over MCP.',
    kind: 'handoff',
    project: 'Threadbase',
    tags: ['next', 'backend'],
    source: 'mcp',
    updatedAt: 'Yesterday',
  },
]

export const projects = [
  { name: 'Threadbase', count: 18, active: true },
  { name: 'Personal', count: 7, active: false },
  { name: 'Research', count: 4, active: false },
]

export const sessions = [
  { title: 'Repository boundary design', agent: 'Claude Code', memories: 7, status: 'active', time: 'Now' },
  { title: 'MCP transport research', agent: 'Cursor', memories: 4, status: 'complete', time: '2h ago' },
  { title: 'Product scope and stack', agent: 'v0', memories: 6, status: 'complete', time: 'Yesterday' },
]
