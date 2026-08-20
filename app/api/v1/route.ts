import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    name: 'Mindstate API',
    version: 'v1',
    status: 'configuration-required',
    capabilities: ['workspace-claims:create', 'agents:enroll', 'memories:read', 'memories:write', 'sessions:read', 'handoffs:write'],
    persistence: true,
    documentation: 'https://mindstate.avikmukherjee.com/skill.md',
    endpoints: {
      createWorkspaceClaim: 'POST /api/v1/workspace-claims',
      enrollAgent: 'POST /api/v1/agents/bootstrap',
      mcp: '/api/mcp',
    },
  })
}
