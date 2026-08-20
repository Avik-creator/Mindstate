import { NextResponse } from 'next/server'

const unavailable = () =>
  NextResponse.json(
    {
      jsonrpc: '2.0',
      error: {
        code: -32001,
        message: 'MCP is scaffolded but unavailable until database, authentication, and API keys are connected.',
      },
      id: null,
    },
    { status: 503 },
  )

export async function GET() {
  return NextResponse.json({
    transport: 'streamable-http',
    runtime: 'nextjs',
    status: 'configuration-required',
    plannedTools: ['search_memories', 'get_context', 'save_memory', 'publish_handoff'],
  })
}

export async function POST() {
  return unavailable()
}

export async function DELETE() {
  return unavailable()
}
