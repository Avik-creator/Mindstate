import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { clientAddress } from '../lib/dal/client-address.ts'
import { can, LEGACY_SCOPE_EXPANSION, SCOPES } from '../lib/domain/scopes.ts'
import { toTsQuery } from '../lib/domain/text-search.ts'
import { verifyAgentIdentity } from '../lib/domain/agent-identity.ts'
import { claimState, isAvailable } from '../lib/domain/handoff-claim.ts'
import { CLAIM_LEASE_AFTER_MS, SESSION_STALE_AFTER_MS } from '../lib/domain/agent-session.ts'
import { canonicalEdge, emptyStanding, isCurrent, isDisputed } from '../lib/domain/memory-relation.ts'
import { normalizePage, MAX_LIMIT } from '../lib/domain/pagination.ts'

function request(headers: Record<string, string>) {
  return new Request('https://example.test/api/v1/workspace-claims', { headers })
}

describe('clientAddress', () => {
  it('takes the rightmost forwarded entry, which a client cannot prepend past', () => {
    assert.equal(clientAddress(request({ 'x-forwarded-for': '9.9.9.9, 203.0.113.7' })), '203.0.113.7')
  })

  it('ignores a spoofed leftmost value entirely', () => {
    const spoofed = clientAddress(request({ 'x-forwarded-for': '1.2.3.4, 203.0.113.7' }))
    const rotated = clientAddress(request({ 'x-forwarded-for': '5.6.7.8, 203.0.113.7' }))
    assert.equal(spoofed, rotated)
  })

  it('prefers the Vercel-set header over the client-writable one', () => {
    const address = clientAddress(request({ 'x-vercel-forwarded-for': '203.0.113.7', 'x-forwarded-for': '1.2.3.4' }))
    assert.equal(address, '203.0.113.7')
  })

  it('falls back to x-real-ip, then reports no trustworthy address', () => {
    assert.equal(clientAddress(request({ 'x-real-ip': '203.0.113.7' })), '203.0.113.7')
    assert.equal(clientAddress(request({})), null)
  })
})

describe('toTsQuery', () => {
  it('prefix-matches the final term so incremental typing still hits', () => {
    assert.equal(toTsQuery('migr'), 'migr:*')
    assert.equal(toTsQuery('server side search'), 'server & side & search:*')
  })

  it('strips tsquery operators rather than passing them through', () => {
    assert.equal(toTsQuery('a & b | !c'), 'a & b & c:*')
  })

  it('returns null when nothing searchable remains', () => {
    assert.equal(toTsQuery('   '), null)
    assert.equal(toTsQuery('!!!'), null)
  })
})

describe('can', () => {
  it('grants everything to an owner session, which has no credential', () => {
    assert.equal(can({}, 'agent:write'), true)
  })

  it('grants a credential only what it was issued', () => {
    const key = { credentialId: 'key-1', scopes: ['memory:read' as const] }
    assert.equal(can(key, 'memory:read'), true)
    assert.equal(can(key, 'project:write'), false)
  })

  it('denies a credential carrying no scopes at all', () => {
    assert.equal(can({ credentialId: 'key-1' }, 'memory:read'), false)
  })
})

describe('legacy scope expansion', () => {
  it('only ever expands to scopes that exist', () => {
    for (const expanded of Object.values(LEGACY_SCOPE_EXPANSION)) {
      for (const scope of expanded) assert.ok(SCOPES.includes(scope), `${scope} is not a real scope`)
    }
  })

  it('covers every surface the old vocabulary reached, so migrated keys lose nothing', () => {
    const migrated = new Set(['memory:read', 'memory:write', ...LEGACY_SCOPE_EXPANSION['memory:read'], ...LEGACY_SCOPE_EXPANSION['memory:write']])
    for (const scope of ['project:read', 'project:write', 'handoff:read', 'handoff:write', 'agent:write']) {
      assert.ok(migrated.has(scope), `${scope} would be lost by the migration`)
    }
  })
})

describe('verifyAgentIdentity', () => {
  it('corroborates a declaration that matches the transport', () => {
    const result = verifyAgentIdentity({ declaredRuntime: 'claude code', observedUserAgent: 'claude-code/1.4.2', observedRequests: 4 })
    assert.equal(result.status, 'consistent')
  })

  it('flags a declaration the transport contradicts', () => {
    const result = verifyAgentIdentity({ declaredRuntime: 'claude code', observedUserAgent: 'python-requests/2.31', observedRequests: 4 })
    assert.equal(result.status, 'inconsistent')
    assert.match(result.reason, /python-requests/)
  })

  it('claims nothing when there is nothing to compare', () => {
    assert.equal(verifyAgentIdentity({ declaredRuntime: 'claude code', observedUserAgent: 'claude-code/1', observedRequests: 0 }).status, 'unverified')
    assert.equal(verifyAgentIdentity({ declaredRuntime: null, observedUserAgent: 'claude-code/1', observedRequests: 3 }).status, 'unverified')
    assert.equal(verifyAgentIdentity({ declaredRuntime: 'claude code', observedUserAgent: null, observedRequests: 3 }).status, 'unverified')
  })

  it('ignores short tokens that would match almost anything', () => {
    // "go" would otherwise match inside "google", "mongo", and so on.
    assert.equal(verifyAgentIdentity({ declaredRuntime: 'go', observedUserAgent: 'mongo-driver/1', observedRequests: 2 }).status, 'unverified')
  })
})

describe('normalizePage', () => {
  it('bounds the limit and refuses a negative offset', () => {
    assert.equal(normalizePage({ limit: 5000 }).limit, MAX_LIMIT)
    assert.equal(normalizePage({ limit: 0 }).limit, 1)
    assert.equal(normalizePage({ offset: -10 }).offset, 0)
  })

  it('applies a default when nothing is asked for', () => {
    const page = normalizePage()
    assert.ok(page.limit > 0 && page.limit <= MAX_LIMIT)
    assert.equal(page.offset, 0)
  })
})

describe('handoff claims', () => {
  it('is unclaimed when nobody holds it', () => {
    assert.equal(claimState({ claimedBySessionId: null, holderIsLive: false }), 'unclaimed')
  })

  it('is held only while the holding session is alive', () => {
    assert.equal(claimState({ claimedBySessionId: 'session-1', holderIsLive: true }), 'held')
    assert.equal(claimState({ claimedBySessionId: 'session-1', holderIsLive: false }), 'expired')
  })

  it('returns work to the pool when the holder dies, but not when it is closed', () => {
    assert.equal(isAvailable({ status: 'open', claim: 'expired' }), true, 'a dead holder must free the work')
    assert.equal(isAvailable({ status: 'open', claim: 'unclaimed' }), true)
    assert.equal(isAvailable({ status: 'open', claim: 'held' }), false)
    assert.equal(isAvailable({ status: 'closed', claim: 'expired' }), false, 'closed work is not up for grabs')
  })
})

describe('heartbeat thresholds', () => {
  // Documented guidance is a heartbeat every 30 to 60 seconds.
  const SLOWEST_DOCUMENTED_BEAT_MS = 60_000

  it('lets a claim survive missed heartbeats at the slowest documented cadence', () => {
    // At two missed beats an agent is still working; taking its work would cause exactly the
    // duplicate effort claiming exists to prevent.
    assert.ok(
      CLAIM_LEASE_AFTER_MS >= SLOWEST_DOCUMENTED_BEAT_MS * 3,
      `a claim lease of ${CLAIM_LEASE_AFTER_MS}ms is too tight for ${SLOWEST_DOCUMENTED_BEAT_MS}ms heartbeats`,
    )
  })

  it('keeps presence more sensitive than the claim lease', () => {
    // Showing stale early is a harmless hint. Releasing someone's work is a decision.
    assert.ok(
      SESSION_STALE_AFTER_MS < CLAIM_LEASE_AFTER_MS,
      'presence must dim before work is taken away, never after',
    )
  })
})

describe('memory standing', () => {
  const ref = { id: 'm2', title: 'Newer', note: '' }

  it('treats a memory as current until something supersedes it', () => {
    assert.equal(isCurrent(emptyStanding()), true)
    assert.equal(isCurrent({ ...emptyStanding(), supersededBy: [ref] }), false)
  })

  it('keeps a contradicted memory current, because neither side wins', () => {
    const disputed = { ...emptyStanding(), contradicts: [ref] }
    assert.equal(isDisputed(disputed), true)
    assert.equal(isCurrent(disputed), true, 'a contradiction flags both sides, it does not retire either')
  })

  it('does not treat superseding others as being superseded', () => {
    assert.equal(isCurrent({ ...emptyStanding(), supersedes: [ref] }), true)
  })
})

describe('canonicalEdge', () => {
  it('orders a contradiction the same way regardless of who asserts it', () => {
    // Without this the same disagreement is stored twice, once per side, and each memory then
    // lists the other twice.
    assert.deepEqual(canonicalEdge('contradicts', 'b', 'a'), canonicalEdge('contradicts', 'a', 'b'))
  })

  it('leaves supersession alone, because direction is its meaning', () => {
    assert.deepEqual(canonicalEdge('supersedes', 'b', 'a'), { fromId: 'b', toId: 'a' })
  })
})
