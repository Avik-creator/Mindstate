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
