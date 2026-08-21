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

  it('gives a handoff to exactly one agent, and returns it when that agent stops', async () => {
    const handoff = await call('/api/v1/handoffs', { method: 'POST', body: JSON.stringify({ title: `claim test ${Date.now()}`, summary: 'work to be picked up', nextSteps: [] }) })
    assert.equal(handoff.status, 201)
    const handoffId = handoff.body.data.id

    const first = await call('/api/v1/sessions', { method: 'POST', body: JSON.stringify({ title: 'claim test one' }) })
    const second = await call('/api/v1/sessions', { method: 'POST', body: JSON.stringify({ title: 'claim test two' }) })
    const firstId = first.body.data.id
    const secondId = second.body.data.id

    try {
      const claim = (sessionId: string) => call(`/api/v1/handoffs/${handoffId}/claim`, { method: 'POST', body: JSON.stringify({ sessionId }) })

      assert.equal((await claim(firstId)).status, 200, 'the first claim should succeed')
      assert.equal((await claim(secondId)).status, 409, 'a live holder must block a second claim')

      // Completing the session ends the lease, which is the same path a crashed agent takes.
      assert.equal((await call(`/api/v1/sessions/${firstId}`, { method: 'DELETE' })).status, 200)

      const afterDeath = await call('/api/v1/handoffs?limit=100')
      const row = afterDeath.body.data.find((h: { id: string }) => h.id === handoffId)
      assert.equal(row.claim.state, 'expired', 'a claim must not outlive the session holding it')

      assert.equal((await claim(secondId)).status, 200, 'work must return to the pool when its holder stops')

      assert.equal(
        (await call(`/api/v1/handoffs/${handoffId}/release`, { method: 'POST', body: JSON.stringify({ sessionId: firstId }) })).status,
        409,
        'only the holder may release',
      )
      assert.equal(
        (await call(`/api/v1/handoffs/${handoffId}/release`, { method: 'POST', body: JSON.stringify({ sessionId: secondId }) })).status,
        200,
      )
    } finally {
      await call(`/api/v1/sessions/${secondId}`, { method: 'DELETE' })
      await call(`/api/v1/handoffs/${handoffId}`, { method: 'PATCH', body: JSON.stringify({ status: 'closed' }) })
    }
  })

  it('refuses a claim from a session that is not live', async () => {
    const handoff = await call('/api/v1/handoffs', { method: 'POST', body: JSON.stringify({ title: `dead session test ${Date.now()}`, summary: 'x', nextSteps: [] }) })
    const session = await call('/api/v1/sessions', { method: 'POST', body: JSON.stringify({ title: 'already finished' }) })
    await call(`/api/v1/sessions/${session.body.data.id}`, { method: 'DELETE' })

    const result = await call(`/api/v1/handoffs/${handoff.body.data.id}/claim`, { method: 'POST', body: JSON.stringify({ sessionId: session.body.data.id }) })
    assert.equal(result.status, 409)
    assert.equal(result.body.error.code, 'SESSION_NOT_LIVE')

    await call(`/api/v1/handoffs/${handoff.body.data.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'closed' }) })
  })

  it('keeps a superseded memory findable while stopping it reading as current', async () => {
    const stamp = Date.now()
    const make = async (title: string, content: string) =>
      (await call('/api/v1/memories', { method: 'POST', body: JSON.stringify({ title, content, type: 'decision' }) })).body.data

    const older = await make(`supersede probe old ${stamp}`, 'the original decision')
    const newer = await make(`supersede probe new ${stamp}`, 'what replaced it')

    try {
      const related = await call(`/api/v1/memories/${newer.id}/relations`, {
        method: 'POST', body: JSON.stringify({ kind: 'supersedes', targetId: older.id, note: 'changed' }),
      })
      assert.equal(related.status, 201)

      // Flagged, never hidden: losing the old decision is losing why it changed.
      const found = await call(`/api/v1/memories?q=supersede+probe&limit=20`)
      const stale = found.body.data.find((m: { id: string }) => m.id === older.id)
      assert.ok(stale, 'a superseded memory must remain searchable')
      assert.equal(stale.standing.supersededBy[0].id, newer.id)

      const briefing = await call('/api/v1/workspace/briefing?limit=100')
      assert.equal(briefing.status, 200)
      assert.ok(
        !briefing.body.data.decisions.some((m: { id: string }) => m.id === older.id),
        'a superseded memory must not be presented as a current decision',
      )
      assert.ok(
        briefing.body.data.superseded.some((m: { id: string }) => m.id === older.id),
        'it should still be listed as superseded',
      )
    } finally {
      await call(`/api/v1/memories/${older.id}`, { method: 'DELETE' })
      await call(`/api/v1/memories/${newer.id}`, { method: 'DELETE' })
    }
  })

  it('refuses relationships that would make nonsense of standing', async () => {
    const make = async (title: string) =>
      (await call('/api/v1/memories', { method: 'POST', body: JSON.stringify({ title, content: 'x', type: 'decision' }) })).body.data
    const a = await make(`relation guard a ${Date.now()}`)
    const b = await make(`relation guard b ${Date.now()}`)
    const relate = (from: string, body: unknown) => call(`/api/v1/memories/${from}/relations`, { method: 'POST', body: JSON.stringify(body) })

    try {
      assert.equal((await relate(a.id, { kind: 'supersedes', targetId: a.id })).status, 400, 'a memory cannot supersede itself')
      assert.equal((await relate(a.id, { kind: 'supersedes', targetId: '00000000-0000-4000-8000-000000000000' })).status, 404)
      assert.equal((await relate(a.id, { kind: 'supersedes', targetId: b.id })).status, 201)
      assert.equal((await relate(a.id, { kind: 'supersedes', targetId: b.id })).status, 409, 'duplicates should be refused')
      // Both superseding each other would leave neither current.
      assert.equal((await relate(b.id, { kind: 'supersedes', targetId: a.id })).status, 409)
    } finally {
      await call(`/api/v1/memories/${a.id}`, { method: 'DELETE' })
      await call(`/api/v1/memories/${b.id}`, { method: 'DELETE' })
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
