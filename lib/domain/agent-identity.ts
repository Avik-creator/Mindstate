export type AgentVerification = 'unverified' | 'consistent' | 'inconsistent'

export type IdentityInput = {
  declaredRuntime?: string | null
  observedUserAgent?: string | null
  observedRequests?: number | null
}

const tokens = (value: string) => value.toLowerCase().match(/[a-z0-9]+/g) ?? []

// Corroborates a self-report against the transport. It does not prove identity: an agent can
// still send whatever User-Agent it likes. It only says whether the two stories agree.
export function verifyAgentIdentity(input: IdentityInput): { status: AgentVerification; reason: string } {
  if (!input.observedRequests) return { status: 'unverified', reason: 'No authenticated requests observed yet' }
  if (!input.declaredRuntime) return { status: 'unverified', reason: 'Agent has not reported a runtime' }
  if (!input.observedUserAgent) return { status: 'unverified', reason: 'Client sent no User-Agent header' }

  const declared = tokens(input.declaredRuntime).filter((token) => token.length > 2)
  if (!declared.length) return { status: 'unverified', reason: 'Reported runtime has nothing to match on' }

  const observed = new Set(tokens(input.observedUserAgent))
  const matched = declared.filter((token) => observed.has(token))

  if (matched.length === declared.length) {
    return { status: 'consistent', reason: `User-Agent matches the reported runtime` }
  }
  if (matched.length > 0) {
    return { status: 'consistent', reason: `User-Agent partly matches the reported runtime` }
  }
  return { status: 'inconsistent', reason: `Reports "${input.declaredRuntime}" but connects as "${input.observedUserAgent}"` }
}
