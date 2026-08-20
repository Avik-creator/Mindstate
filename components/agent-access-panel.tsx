'use client'

import { useState } from 'react'
import { Bot, Check, Copy, KeyRound, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type TokenResult = { token: string; expiresAt: string }

export function AgentAccessPanel() {
  const [name, setName] = useState('Primary agent')
  const [result, setResult] = useState<TokenResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  async function createToken() {
    setLoading(true)
    setError('')
    const response = await fetch('/api/v1/agent-signup-tokens', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ agentName: name, scopes: ['memory:read', 'memory:write'], expiresInMinutes: 15 }),
    })
    const body = await response.json()
    setLoading(false)
    if (!response.ok) return setError(body.error?.message ?? 'Could not create token')
    setResult(body.data)
  }

  async function copyToken() {
    if (!result) return
    await navigator.clipboard.writeText(result.token)
    setCopied(true)
  }

  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-md bg-accent/15 text-accent"><Bot className="size-4" /></div>
        <div><h2 className="text-sm font-semibold">Agent-first access</h2><p className="text-xs text-muted-foreground">One-time enrollment</p></div>
      </div>
      <p className="mt-4 text-xs leading-5 text-muted-foreground">Issue a 15-minute token so an agent can enroll itself in your workspace without your password.</p>
      <div className="mt-4 flex flex-col gap-2">
        <label className="sr-only" htmlFor="agent-name">Agent name</label>
        <Input id="agent-name" value={name} onChange={(event) => setName(event.target.value)} className="h-8 text-xs" />
        <Button size="sm" onClick={createToken} disabled={loading || name.trim().length < 2}>
          {loading ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <KeyRound data-icon="inline-start" />}Issue signup token
        </Button>
      </div>
      {result ? <div className="mt-3 rounded-md bg-secondary p-3"><code className="block break-all font-mono text-[10px]">{result.token}</code><Button variant="ghost" size="sm" className="mt-2 w-full" onClick={copyToken}>{copied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}{copied ? 'Copied' : 'Copy once'}</Button></div> : null}
      {error ? <p role="alert" className="mt-3 text-xs text-destructive">{error}</p> : null}
    </section>
  )
}
