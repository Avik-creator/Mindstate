---
name: threadbase-agent
description: Safely enroll an agent into a human-owned Threadbase workspace and use its REST and MCP memory interfaces. Use when an agent needs durable owner-scoped memory, self-enrollment, REST access, MCP tools, or credential handling guidance.
---

# Threadbase agent integration

Use Threadbase as durable, owner-scoped memory. Never request or store the owner password or browser session.

## Enroll once

1. Ask the owner to issue a short-lived signup token in **Dashboard → Agent-first access**.
2. Redeem it once:

```http
POST /api/v1/agents/bootstrap
Content-Type: application/json

{"token":"<one-time-signup-token>","agentName":"<agent-name>"}
```

3. Save the returned `apiKey` in a secret manager. It is shown once. Never log it, commit it, put it in prompts, or send it to another origin.
4. If redemption returns `TOKEN_EXPIRED` or `TOKEN_USED`, ask the owner for a new token. Never retry a consumed token.

## REST

Send `Authorization: Bearer <api-key>` and `Content-Type: application/json`.

- `GET /api/v1/memories?q=<query>&limit=20` — search memory.
- `POST /api/v1/memories` — capture memory.
- `GET|PATCH|DELETE /api/v1/memories/<uuid>` — read, update, or remove memory.

```json
{
  "title": "Deployment constraint",
  "content": "Production deploys require an approved migration.",
  "type": "decision",
  "tags": ["deploy", "safety"],
  "source": "api",
  "projectId": null,
  "sessionId": null
}
```

Validation failures use `{ "error": { "code": "VALIDATION_ERROR", "message": "...", "issues": [...] } }`. Correct the named fields; do not blindly retry. Respect `memory:read` and `memory:write` scopes and treat `403` as a hard authorization boundary.

## Live session lifecycle

A session is live only while the agent is actively sending heartbeats. Start one before meaningful work, send a heartbeat every 30–60 seconds, attach captured memories with its `sessionId`, and complete it when work stops.

- `POST /api/v1/sessions` with `{ "title": "...", "projectId": null, "agent": "...", "metadata": {} }` — start a session (`session:write`).
- `GET /api/v1/sessions?limit=30` and `GET /api/v1/sessions/<uuid>` — inspect owner-scoped sessions (`session:read`).
- `POST /api/v1/sessions/<uuid>/heartbeat` — keep an active session live (`session:write`).
- `DELETE /api/v1/sessions/<uuid>` — complete the session (`session:write`).

The live TTL is 90 seconds. If heartbeats stop, an active session becomes `stale`; this is deliberate crash/disconnect detection, not an error. Resume it with a heartbeat only if the same work is still running, otherwise start a new session.

## MCP

Connect to `/api/mcp` with the same bearer key. Available tools:

- `search_memories` — search owner-scoped context by query, project, session, or type.
- `save_memory` — write durable context when the key has `memory:write`.
- `get_context` — retrieve recent owner-scoped context for a project or session.
- `start_session`, `list_sessions`, `heartbeat_session`, `complete_session` — manage real session presence with `session:read`/`session:write`.
- `list_projects`, `create_project` — discover or create project scopes using live database data.
- `list_handoffs`, `create_handoff` — read and create structured handoffs instead of encoding them as mock memory.
- `report_agent_context` — report sanitized runtime, capability, and activity signals for deterministic classification.

Call `report_agent_context` after enrollment and whenever the runtime or capabilities materially change. Mindstate classifies agents as coding, research, browser, automation, or general from weighted runtime/capability/activity signals, records the evidence and confidence, and never uses classification for authorization. Optional lifecycle hooks may call `POST /api/v1/agents/telemetry` with the same payload; do not include prompts, credentials, environment values, or source code.

Prefer search before capture to avoid duplicate memory. Keep writes concise, factual, and useful across sessions; never save credentials, access tokens, private keys, or raw personal data unless the owner explicitly requires it.

## Reliability rules

- Generate a client request ID for write retries and avoid replaying a successful write.
- Back off on `429` and transient `5xx`; do not retry `400`, `401`, or `403` without changing the request or credentials.
- Use the least-privileged scope. Rotate or revoke a key immediately if exposure is suspected.
- All records remain scoped to the human owner. Never attempt to enumerate another workspace or alter owner identity.
