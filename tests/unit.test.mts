import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { clientAddress } from '../lib/dal/client-address.ts'
import { can, LEGACY_SCOPE_EXPANSION, SCOPES } from '../lib/domain/scopes.ts'
import { toTsQuery } from '../lib/domain/text-search.ts'

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
