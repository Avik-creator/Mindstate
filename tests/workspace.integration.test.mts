import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'

// Both bugs these tests pin were invisible to review and to the type checker; they only appear against a real database.
const baseUrl = process.env.MINDSTATE_TEST_URL
const email = process.env.MINDSTATE_TEST_EMAIL
const password = process.env.MINDSTATE_TEST_PASSWORD
const configured = Boolean(baseUrl && email && password)
const skip = configured ? false : 'set MINDSTATE_TEST_URL, MINDSTATE_TEST_EMAIL, and MINDSTATE_TEST_PASSWORD'

let cookie = ''

async function call(path: string, init: RequestInit = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', cookie, ...init.headers },
  })
  const body = response.status === 204 ? null : await response.json().catch(() => null)
  return { status: response.status, body }
}

describe('workspace endpoints', { skip }, () => {
  before(async () => {
    const response = await fetch(`${baseUrl}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: baseUrl as string },
      body: JSON.stringify({ email, password }),
    })
    assert.equal(response.status, 200, 'sign-in failed')
    cookie = response.headers.getSetCookie().map((value) => value.split(';')[0]).join('; ')
    assert.ok(cookie, 'no session cookie returned')
  })

  it('reports the same session presence from /workspace/summary and /sessions', async () => {
    const started = await call('/api/v1/sessions', { method: 'POST', body: JSON.stringify({ title: 'presence agreement probe' }) })
    assert.equal(started.status, 201)
    const sessionId = started.body.data.id

    try {
      const [summary, sessions] = await Promise.all([call('/api/v1/workspace/summary'), call('/api/v1/sessions?limit=100')])
      assert.equal(summary.status, 200)
      assert.equal(sessions.status, 200)

      const live = sessions.body.data.filter((row: { presence: string }) => row.presence === 'live').length
      const stale = sessions.body.data.filter((row: { presence: string }) => row.presence === 'stale').length

      assert.equal(summary.body.data.sessions.live, live, 'summary and session list disagree on live sessions')
      assert.equal(summary.body.data.sessions.stale, stale, 'summary and session list disagree on stale sessions')
      assert.ok(live >= 1, 'a session started moments ago must read as live')
    } finally {
      await call(`/api/v1/sessions/${sessionId}`, { method: 'PATCH', body: JSON.stringify({ status: 'completed' }) })
    }
  })

  it('reports real related-record counts per project', async () => {
    const project = await call('/api/v1/projects', { method: 'POST', body: JSON.stringify({ name: `count probe ${Date.now()}`, description: '' }) })
    assert.equal(project.status, 201)
    const projectId = project.body.data.id

    const memory = await call('/api/v1/memories', {
      method: 'POST',
      body: JSON.stringify({ title: 'count probe memory', content: 'linked to the probe project', projectId }),
    })
    assert.equal(memory.status, 201)
    const memoryId = memory.body.data.id

    try {
      const projects = await call('/api/v1/projects')
      assert.equal(projects.status, 200)
      const row = projects.body.data.find((item: { id: string }) => item.id === projectId)
      assert.ok(row, 'the created project is missing from the list')
      assert.equal(row.memoryCount, 1, 'project memory count did not reflect the linked memory')
    } finally {
      await call(`/api/v1/memories/${memoryId}`, { method: 'DELETE' })
      await call(`/api/v1/projects/${projectId}`, { method: 'DELETE' })
    }
  })

  it('pages every list resource, not just memories', async () => {
    // Handoffs were capped at 100 with no offset, the same bug memories had.
    for (const resource of ['memories', 'sessions', 'projects', 'handoffs', 'agents']) {
      const first = await call(`/api/v1/${resource}?limit=1&offset=0`)
      assert.equal(first.status, 200, `${resource} should accept paging`)
      assert.ok(first.body.page, `${resource} is missing its page envelope`)
      assert.equal(first.body.page.limit, 1)
      assert.ok(first.body.data.length <= 1, `${resource} ignored limit`)

      if (first.body.page.total > 1) {
        const second = await call(`/api/v1/${resource}?limit=1&offset=1`)
        assert.equal(second.status, 200)
        assert.notEqual(
          JSON.stringify(second.body.data[0]),
          JSON.stringify(first.body.data[0]),
          `${resource} returned the same row for offset 0 and 1`,
        )
      }
    }
  })

  it('refuses a limit beyond the cap rather than honouring it', async () => {
    const tooMany = await call('/api/v1/sessions?limit=5000')
    assert.equal(tooMany.status, 400, 'an unbounded limit should be rejected')
  })

  it('records a deletion permanently, including what was destroyed', async () => {
    const created = await call('/api/v1/memories', {
      method: 'POST',
      body: JSON.stringify({ title: `audit probe ${Date.now()}`, content: 'created to be deleted' }),
    })
    assert.equal(created.status, 201)
    const { id, title } = created.body.data

    assert.equal((await call(`/api/v1/memories/${id}`, { method: 'DELETE' })).status, 204)

    const audit = await call('/api/v1/audit?limit=10')
    assert.equal(audit.status, 200)
    const entry = audit.body.data.find((row: { targetId: string }) => row.targetId === id)
    assert.ok(entry, 'the deletion was not recorded')
    assert.equal(entry.action, 'memory.delete')
    // The row is gone, so the record has to carry what it was.
    assert.equal(entry.summary, title)
  })

  it('keeps the audit log away from agent credentials', async () => {
    const token = await call('/api/v1/agent-signup-tokens', { method: 'POST', body: JSON.stringify({ agentName: 'audit probe', expiresInMinutes: 15 }) })
    const boot = await fetch(`${baseUrl}/api/v1/agents/bootstrap`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: token.body.data.token, agentName: 'audit probe' }),
    })
    const { agent, apiKey } = (await boot.json()).data

    try {
      const asAgent = await fetch(`${baseUrl}/api/v1/audit`, { headers: { authorization: `Bearer ${apiKey}` } })
      assert.equal(asAgent.status, 401, 'an agent must not be able to read the record of its own actions')
    } finally {
      await call(`/api/v1/agents/${agent.id}`, { method: 'DELETE' })
    }
  })

  it('closes the maintenance route when no cron secret is configured', async () => {
    const anonymous = await fetch(`${baseUrl}/api/v1/maintenance`)
    // 404 when unconfigured, 401 when configured but unauthenticated. Never 200 without the secret.
    assert.ok([401, 404].includes(anonymous.status), `maintenance answered ${anonymous.status} without a secret`)
  })

  it('reports observed database state rather than a hardcoded status', async () => {
    const index = await call('/api/v1')
    assert.equal(index.status, 200)
    assert.equal(index.body.database, 'reachable')
    assert.equal(index.body.status, 'ok')
  })

  it('revoking an agent also kills every key issued to it', async () => {
    const token = await call('/api/v1/agent-signup-tokens', { method: 'POST', body: JSON.stringify({ agentName: 'revoke test', expiresInMinutes: 15 }) })
    assert.equal(token.status, 201)

    const boot = await fetch(`${baseUrl}/api/v1/agents/bootstrap`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: token.body.data.token, agentName: 'revoke test' }),
    })
    assert.equal(boot.status, 201)
    const { agent, apiKey } = (await boot.json()).data

    const asAgent = (path: string) => fetch(`${baseUrl}${path}`, { headers: { authorization: `Bearer ${apiKey}` } })
    assert.equal((await asAgent('/api/v1/memories?limit=1')).status, 200, 'a fresh agent key should work')

    const revoked = await call(`/api/v1/agents/${agent.id}`, { method: 'DELETE' })
    assert.equal(revoked.status, 200)
    assert.ok(revoked.body.data.revokedKeys >= 1, 'revoking an agent should revoke its keys')

    assert.equal((await asAgent('/api/v1/memories?limit=1')).status, 401, 'a revoked agent key must stop working')
    assert.equal((await call(`/api/v1/agents/${agent.id}`, { method: 'DELETE' })).status, 404, 'revoking twice should not succeed twice')
  })

  it('caps credentialled traffic and leaves owner sessions alone', async () => {
    const created = await call('/api/v1/api-keys', { method: 'POST', body: JSON.stringify({ name: `quota test ${Date.now()}`, scopes: ['memory:read'] }) })
    assert.equal(created.status, 201)
    const key = created.body.data.key
    // Look the key up so it can be revoked afterwards; creation returns the secret, not the row id.
    const keyId = (await call('/api/v1/api-keys')).body.data.find((row: { prefix: string }) => row.prefix === created.body.data.prefix)?.id

    // The cap is 120 per minute; 130 requests must cross it.
    const codes: number[] = []
    for (let batch = 0; batch < 13; batch += 1) {
      const round = await Promise.all(Array.from({ length: 10 }, () =>
        fetch(`${baseUrl}/api/v1/memories?limit=1`, { headers: { authorization: `Bearer ${key}` } }).then((r) => r.status)))
      codes.push(...round)
    }

    assert.ok(codes.includes(429), 'a credential firing 130 requests in a minute should be throttled')
    assert.equal(codes.filter((code) => code === 200).length, 120, 'exactly the cap should succeed')

    const session = await call('/api/v1/memories?limit=1')
    assert.equal(session.status, 200, 'the owner session must not share the credential quota')

    if (keyId) await call(`/api/v1/api-keys/${keyId}`, { method: 'DELETE' })
  })

  it('finds a memory by a word stem the old substring search would have missed', async () => {
    const created = await call('/api/v1/memories', {
      method: 'POST',
      body: JSON.stringify({ title: 'Deployment checklist', content: 'Run migrations before promoting the build.' }),
    })
    assert.equal(created.status, 201)
    const memoryId = created.body.data.id

    try {
      const stem = await call('/api/v1/memories?q=deploy')
      assert.equal(stem.status, 200)
      assert.ok(stem.body.data.some((row: { id: string }) => row.id === memoryId), '"deploy" did not match "Deployment"')

      const paged = await call('/api/v1/memories?limit=1&offset=0')
      assert.equal(paged.body.data.length, 1)
      assert.ok(paged.body.page.total >= 1, 'page envelope is missing a usable total')
    } finally {
      await call(`/api/v1/memories/${memoryId}`, { method: 'DELETE' })
    }
  })
})
