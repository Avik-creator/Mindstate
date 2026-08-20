import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    name: 'Threadbase API',
    version: 'v1',
    status: 'configuration-required',
    capabilities: ['memories:read', 'memories:write', 'sessions:read', 'handoffs:write'],
    persistence: false,
  })
}
