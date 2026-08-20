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

## MCP

Connect to `/api/mcp` with the same bearer key. Available tools:

- `search_memories` — retrieve owner-scoped context.
- `capture_memory` — write durable context when the key has `memory:write`.
- `get_memory` — fetch one record by UUID.

Prefer search before capture to avoid duplicate memory. Keep writes concise, factual, and useful across sessions; never save credentials, access tokens, private keys, or raw personal data unless the owner explicitly requires it.

## Reliability rules

- Generate a client request ID for write retries and avoid replaying a successful write.
- Back off on `429` and transient `5xx`; do not retry `400`, `401`, or `403` without changing the request or credentials.
- Use the least-privileged scope. Rotate or revoke a key immediately if exposure is suspected.
- All records remain scoped to the human owner. Never attempt to enumerate another workspace or alter owner identity.
