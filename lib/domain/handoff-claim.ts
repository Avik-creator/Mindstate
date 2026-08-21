export type ClaimState = 'unclaimed' | 'held' | 'expired'

export type ClaimView = {
  state: ClaimState
  agentId: string | null
  sessionId: string | null
  claimedAt: string | Date | null
}

// A claim is only as alive as the session holding it. When that session stops heartbeating the
// work returns to the pool, which is why claiming requires a live session rather than a timer.
export function claimState(input: { claimedBySessionId: string | null; holderIsLive: boolean }): ClaimState {
  if (!input.claimedBySessionId) return 'unclaimed'
  return input.holderIsLive ? 'held' : 'expired'
}

export function isAvailable(input: { status: string; claim: ClaimState }) {
  return input.status === 'open' && input.claim !== 'held'
}
