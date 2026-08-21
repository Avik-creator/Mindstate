# Mindstate

Private, durable memory for AI agents. Mindstate gives coding, research, browser, and automation agents an owner-scoped place to preserve context, coordinate work, and hand off tasks across sessions.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FAvik-creator%2FMindstate&project-name=mindstate&repository-name=mindstate&env=DATABASE_URL%2CBETTER_AUTH_SECRET&envDescription=DATABASE_URL%20is%20a%20PostgreSQL%20connection%20string.%20BETTER_AUTH_SECRET%20must%20be%20a%20random%20value%20of%20at%20least%2032%20characters.)

[![CI](https://github.com/Avik-creator/Mindstate/actions/workflows/ci.yml/badge.svg)](https://github.com/Avik-creator/Mindstate/actions/workflows/ci.yml)

[Live app](https://mindstate.avikmukherjee.com) · [Agent guide](https://mindstate.avikmukherjee.com/skill.md)

## What Mindstate provides

- Durable memories with types, tags, and project links, searched by word stem and ranked
- Live agent sessions with heartbeat-based presence and stale-session detection
- Projects for grouping related memories, sessions, and handoffs
- Structured handoffs between agents
- One-time agent enrollment, and scoped keys that can be revoked individually or per agent
- Agent classification derived from runtime and capability signals the agent reports about itself
- REST and Model Context Protocol (MCP) interfaces
- Email and password authentication with owner-level data isolation

## Architecture

- [Next.js 16](https://nextjs.org/) App Router and React 19
- PostgreSQL with [Drizzle ORM](https://orm.drizzle.team/); [Neon](https://neon.tech/) is recommended
- [Better Auth](https://www.better-auth.com/) for authentication and sessions
- [Model Context Protocol](https://modelcontextprotocol.io/) through `mcp-handler`
- Tailwind CSS 4 and shadcn/ui
- SWR for client-side API synchronization

Every application query is scoped to the authenticated owner. Agent keys carry explicit scopes, and enrollment tokens, claim tokens, and API keys are all stored as SHA-256 hashes.

## Deploy to Vercel

Click **Deploy with Vercel** above, then:

1. Create or select a PostgreSQL database.
2. Set the environment variables listed below.
3. Deploy.
4. Open the deployed URL and create the first owner account.

For a custom domain, set `BETTER_AUTH_URL` to its full HTTPS origin, for example `https://mindstate.example.com`, and redeploy.

Pending migrations are applied automatically on production deployments. See [Database migrations](#database-migrations).

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string used by Drizzle and Better Auth. |
| `BETTER_AUTH_SECRET` | Yes | Random secret of at least 32 characters used to sign authentication data. |
| `BETTER_AUTH_URL` | Production custom domains | Canonical HTTPS origin of the deployed app. Vercel deployment URLs are detected automatically. |
| `BETTER_AUTH_TRUSTED_ORIGINS` | No | Extra comma-separated origins allowed to call the auth endpoints. |
| `CRON_SECRET` | No | Enables the scheduled maintenance route. Without it that route stays closed and nothing is pruned. |

Generate a local authentication secret with:

```bash
openssl rand -base64 32
```

Never commit environment files, database credentials, API keys, or enrollment tokens.

## Local development

### Requirements

- Node.js 22.18 or newer. Next 16 itself runs on 20.9+, but `pnpm test` relies on Node's built-in TypeScript support, which is enabled by default from 22.18.
- pnpm 10. The version is pinned in `packageManager`. pnpm 11 does not read `pnpm.overrides` from `package.json` and will silently drop the `hono` pin from the lockfile, which breaks the next deployment.
- A PostgreSQL database.

### Setup

```bash
git clone https://github.com/Avik-creator/Mindstate.git
cd Mindstate
pnpm install --frozen-lockfile
cp .env.example .env.local
```

Fill in `DATABASE_URL` and `BETTER_AUTH_SECRET`, then apply the schema and start the development server:

```bash
pnpm db:migrate
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the development server. |
| `pnpm build` | Create a production build and run type validation. |
| `pnpm start` | Run the production server. |
| `pnpm typecheck` | Typecheck the app and the tests. |
| `pnpm test` | Run the test suite. |
| `pnpm db:generate` | Generate a migration from the Drizzle schema. |
| `pnpm db:migrate` | Apply pending migrations. |
| `pnpm db:studio` | Open Drizzle Studio. |

## Tests

```bash
pnpm test
```

Unit tests run with no setup. The integration tests exercise a running instance and skip unless all three variables are set:

```bash
MINDSTATE_TEST_URL=http://localhost:3000 \
MINDSTATE_TEST_EMAIL=you@example.com \
MINDSTATE_TEST_PASSWORD=your-password \
pnpm test
```

They create and then clean up their own records, so point them at a development database rather than production. One exception: the revocation test leaves a revoked agent behind, because revocation is deliberately not deletion and there is no endpoint to remove one.

## Continuous integration

`.github/workflows/ci.yml` runs on every pull request and on pushes to `main`.

The `types and migrations` job typechecks the app and the tests, then runs `drizzle-kit generate` and fails if it produces anything — a schema edit without a matching migration would otherwise deploy code its database cannot serve.

The `tests against a real database` job starts an empty PostgreSQL 17, applies every migration to it from nothing, builds, starts the server, creates an account, and runs the full suite including the integration half. Migrating from empty is deliberate: it proves the migrations still describe the whole schema rather than only the last few changes. The job fails if the integration suite does not report a pass, because that suite skips silently when it is misconfigured and would otherwise leave CI green having tested nothing.

## Database migrations

Migrations live in `drizzle/` and are generated from the Drizzle schema, never hand-written for schema changes:

```bash
pnpm db:generate    # after editing lib/infrastructure/db/postgres/schema.ts
pnpm db:migrate     # apply pending migrations
```

On Vercel, `scripts/deploy-migrate.mjs` applies pending migrations automatically as the last step of a **production** build, after the build succeeds and before the new deployment is promoted. A migration failure fails the deploy, so the previous version keeps serving rather than new code meeting an old schema.

It deliberately does nothing in two cases:

- **Local builds.** `pnpm build` must never migrate, and a local `.env` may point at production.
- **Preview deployments.** Previews often share the production `DATABASE_URL`, so a preview of an unmerged branch could otherwise migrate production ahead of the code that needs it.

Two things this does not do. It takes no lock, so two production deployments running at the same moment could both attempt to migrate; deploy them one at a time. And it does not coordinate destructive changes, so a migration that drops or narrows a column will briefly meet the previous version still serving traffic. For those, split the change across two deploys: add first, remove once nothing reads it.

`scripts/inspect-db.mjs` is a read-only check that reports which tables, columns, and migrations a database actually has. It is useful for confirming the state of a deployment before or after migrating.

## Agent connection

Mindstate exposes REST at `/api/v1` and MCP at `/api/mcp`. The canonical agent guide is published at [`/skill.md`](https://mindstate.avikmukherjee.com/skill.md).

### 1. Prepare a workspace for a new user

An agent can initiate signup without handling the user's password:

```bash
curl -X POST https://YOUR_DOMAIN/api/v1/workspace-claims \
  -H 'Content-Type: application/json' \
  -d '{"name":"Workspace owner","email":"owner@example.com","agentName":"coding-agent"}'
```

Give the returned 30-minute `claimUrl` to the intended user. They open it and privately choose their password. This does not enroll the agent or grant it workspace access. An address that has already been claimed returns `409`.

### 2. Enroll an agent

After the user claims the workspace, they issue a short-lived enrollment token from the dashboard. Redeem it once:

```bash
curl -X POST https://YOUR_DOMAIN/api/v1/agents/bootstrap \
  -H 'Content-Type: application/json' \
  -d '{"token":"ONE_TIME_TOKEN","agentName":"coding-agent"}'
```

Store the returned API key in a secret manager. It is shown once and must be sent as a bearer token:

```http
Authorization: Bearer YOUR_AGENT_API_KEY
```

### 3. Use the REST API

```bash
curl 'https://YOUR_DOMAIN/api/v1/memories?q=deployment&limit=20&offset=0' \
  -H 'Authorization: Bearer YOUR_AGENT_API_KEY'
```

Search matches word stems and ranks titles above body text, so `deploy` finds `deployment`. List responses carry a `page` object with `limit`, `offset`, and `total`; page with `offset` until the accumulated count reaches `total`. `limit` is capped at 100.

Create a memory:

```bash
curl -X POST https://YOUR_DOMAIN/api/v1/memories \
  -H 'Authorization: Bearer YOUR_AGENT_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "title":"Deployment decision",
    "content":"Production migrations require approval.",
    "type":"decision",
    "tags":["deployment","safety"],
    "projectId":null,
    "sessionId":null
  }'
```

### 4. Use MCP

Point an MCP client at:

```text
https://YOUR_DOMAIN/api/mcp
```

Pass the same bearer token in the `Authorization` header. `/api/mcp` accepts bearer credentials only; browser session cookies are rejected. Sixteen tools cover memory search and capture, memory relationships, projects, handoffs including claiming and releasing them, session presence, and agent-context reporting. See [`SKILL.md`](./SKILL.md) for the full integration and credential-safety guide.

## API reference

Owner endpoints require a browser session and reject agent keys, so a key can never mint another credential.

| Endpoint | Methods | Auth |
| --- | --- | --- |
| `/api/v1` | `GET` | Public. Reports version and database reachability. |
| `/api/v1/workspace-claims` | `POST` | Public, rate limited. |
| `/api/v1/workspace-claims/complete` | `POST` | Public, claim token. |
| `/api/v1/agents/bootstrap` | `POST` | Public, one-time enrollment token. |
| `/api/v1/memories` | `GET` `POST` | `memory:read` / `memory:write` |
| `/api/v1/memories/{id}` | `GET` `PATCH` `DELETE` | `memory:read` / `memory:write` |
| `/api/v1/memories/{id}/relations` | `POST` | `memory:write` |
| `/api/v1/memories/{id}/relations/{relationId}` | `DELETE` | `memory:write` |
| `/api/v1/workspace/briefing` | `GET` | `memory:read` |
| `/api/v1/projects` | `GET` `POST` | `project:read` / `project:write` |
| `/api/v1/projects/{id}` | `PATCH` `DELETE` | `project:write` |
| `/api/v1/handoffs` | `GET` `POST` | `handoff:read` / `handoff:write` |
| `/api/v1/handoffs/{id}` | `PATCH` | `handoff:write` |
| `/api/v1/handoffs/{id}/claim` | `POST` | `handoff:write` |
| `/api/v1/handoffs/{id}/release` | `POST` | `handoff:write` |
| `/api/v1/sessions` | `GET` `POST` | `session:read` / `session:write` |
| `/api/v1/sessions/{id}` | `GET` `DELETE` | `session:read` / `session:write` |
| `/api/v1/sessions/{id}/heartbeat` | `POST` | `session:write` |
| `/api/v1/workspace/summary` | `GET` | `memory:read` |
| `/api/v1/agents/telemetry` | `POST` | `agent:write`, agent credential only |
| `/api/v1/agents` | `GET` | Owner session. |
| `/api/v1/agents/{id}` | `DELETE` | Owner session. Revokes the agent and every key it holds. |
| `/api/v1/agent-signup-tokens` | `POST` | Owner session. |
| `/api/v1/api-keys` | `GET` `POST` | Owner session. |
| `/api/v1/api-keys/{id}` | `DELETE` | Owner session. |
| `/api/v1/audit` | `GET` | Owner session. |
| `/api/v1/maintenance` | `GET` | `CRON_SECRET` bearer. Closed when the variable is unset. |
| `/api/v1/agents` | `GET` | Owner session |
| `/api/v1/agents/{id}` | `DELETE` | Owner session. Revokes the agent and all its keys. |
| `/api/v1/api-keys` | `GET` `POST` | Owner session |
| `/api/v1/api-keys/{id}` | `DELETE` | Owner session |
| `/api/v1/agent-signup-tokens` | `POST` | Owner session |
| `/api/v1/maintenance` | `GET` | `CRON_SECRET` bearer. `404` when unconfigured. |

## Scopes

Each agent credential is issued an explicit set. Owner browser sessions are unscoped and hold all of them.

| Scope | Grants |
| --- | --- |
| `memory:read` | Search and read memories. |
| `memory:write` | Create, update, and delete memories. |
| `session:read` | List sessions and read presence. |
| `session:write` | Start, heartbeat, and complete sessions. |
| `project:read` | List projects and their counts. |
| `project:write` | Create, update, and delete projects. |
| `handoff:read` | List handoffs. |
| `handoff:write` | Create and update handoffs. |
| `agent:write` | Report the agent's own runtime and capability telemetry. |

## Limits and retention

Credentialled API and MCP traffic is capped at 120 requests per minute per credential, answered with `429` and a `Retry-After` header. Owner browser sessions are not counted against that quota. Authentication endpoints carry their own limits. Both stores live in Postgres, so a limit bounds the deployment rather than one warm serverless instance.

Setting `CRON_SECRET` enables a daily maintenance run that removes expired unclaimed workspace claims, spent enrollment tokens, and elapsed rate-limit windows. It never touches memories, sessions, projects, or handoffs, and it keeps completed claim records, because those are what prevent a claimed workspace from being reset.

## Superseded and contradicted memory

The failure mode of long-lived memory is not forgetting, it is remembering something that stopped
being true. A decision recorded in March is still returned confidently in August after it changed.

A memory can therefore be recorded as superseding or contradicting another:

```bash
curl -X POST https://YOUR_DOMAIN/api/v1/memories/NEWER_ID/relations \
  -H 'Authorization: Bearer YOUR_AGENT_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"kind":"supersedes","targetId":"OLDER_ID","note":"migrated in August"}'
```

**Superseded memories are never deleted and never hidden.** They stay searchable and carry a flag
naming what replaced them, because losing the old decision means losing why it changed. What
supersession changes is presentation: a stale memory stops being offered as current.

`contradicts` is for when two memories disagree and neither clearly wins. Both stay current and
both are flagged, because silently picking a winner is how a wrong answer becomes permanent.
Relationships can be removed if recorded in error; removing one leaves both memories untouched.

The API refuses relationships that would make nonsense of this: a memory cannot supersede itself,
the same pair cannot be recorded twice, and two memories cannot supersede each other, which would
leave neither current.

## Briefings

`get_briefing` over MCP, or `GET /api/v1/workspace/briefing`, answers "what should I know before
touching this project" rather than making an agent guess search terms:

- current decisions, preferences, and context, with superseded memories excluded
- open handoffs, including whether each is already held by a live agent
- unresolved contradictions, listed once rather than once per side
- superseded memories, named separately with what replaced them

Open handoffs are included only when the credential also holds `handoff:read`, so a briefing
cannot become a way around that scope.

## Claiming work

A handoff is a work item, not just a note. An agent takes exclusive ownership of one before
starting, so a fleet does not duplicate effort:

```bash
curl -X POST https://YOUR_DOMAIN/api/v1/handoffs/HANDOFF_ID/claim \
  -H 'Authorization: Bearer YOUR_AGENT_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"sessionId":"YOUR_LIVE_SESSION_ID"}'
```

Claiming requires a live session, and that session is the lease. There is no timer to renew and
no extra protocol: while an agent heartbeats, it keeps its work; when it stops, the claim expires
and the handoff returns to the pool for another agent to take. A crashed agent therefore frees
its own work without anyone intervening.

A second claim on a handoff a live agent holds answers `409`. So does an attempt to change a
handoff another live agent is holding. The workspace owner can always act on any handoff.

`release` gives a claim up voluntarily and answers `409` unless the session named actually holds
it. Over MCP the same operations are `claim_handoff` and `release_handoff`.

## Agent presence

Agents should start a session before meaningful work, send a heartbeat every 30 seconds, and complete the session when work ends. Sixty seconds is the slowest cadence the server is tuned for.

Two windows follow from that, deliberately different:

| Window | After | Effect |
| --- | --- | --- |
| Presence | 90s of silence | The session reads as stale in the dashboard. A display hint, nothing more. |
| Claim lease | 180s of silence | A claimed handoff returns to the pool. |

Presence is the more sensitive of the two on purpose. Dimming a dot early costs nothing, while taking work from an agent that is merely slow causes exactly the duplicate effort claiming exists to prevent. Claiming work still requires a genuinely live session, so a claim is harder to take than to keep.

## Security notes

- Do not expose owner browser sessions or passwords to agents.
- Give agent keys only the scopes they require, from the vocabulary in [Scopes](#scopes).
- Do not place prompts, source code, environment values, or secrets in telemetry.
- Treat `401` and `403` responses as hard authorization failures, and `429` as a signal to back off for the seconds named in `Retry-After`.
- Revoke a key immediately if it may have been exposed. Revoking an agent from the dashboard disables it and every key issued to it in one step.
- Keep `DATABASE_URL` and `BETTER_AUTH_SECRET` server-only.
- Agent classification is derived from what an agent reports about itself. Treat the category and confidence as self-reported, not verified.
- There is no email verification, so an address is not proof of ownership.

## Project structure

```text
app/                         Pages and API routes
components/                  Landing, dashboard, and shared UI
lib/application/             Validation and application services
lib/dal/                     Request authentication, scope, and quota enforcement
lib/domain/                  Core domain models and pure policy
lib/infrastructure/          PostgreSQL repositories and schema
drizzle/                     Versioned database migrations
scripts/                     Deployment migration and database inspection
tests/                       Unit and integration tests
public/                      Favicons and social preview assets
vercel.json                  Build command and scheduled maintenance
SKILL.md                     Agent integration instructions
```

## Contributing

1. Create a feature branch. Do not commit to `main` directly.
2. Keep database changes in the Drizzle schema and generate a migration; do not hand-write schema SQL.
3. Preserve owner scoping on every read and mutation.
4. Route new API endpoints through `apiGuard` so authentication, scope, and quota cannot be skipped.
5. Run `pnpm typecheck`, `pnpm build`, and `pnpm test` before opening a pull request. CI runs all three, plus the migrations, against a fresh database.

## License

No license has been specified. Unless one is added, all rights are reserved by the repository owner.
