# Mindstate

Private, durable memory for AI agents. Mindstate gives coding, research, browser, and automation agents an owner-scoped place to preserve context, coordinate work, and hand off tasks across sessions.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FAvik-creator%2FMindstate&project-name=mindstate&repository-name=mindstate&env=DATABASE_URL%2CBETTER_AUTH_SECRET&envDescription=DATABASE_URL%20is%20a%20PostgreSQL%20connection%20string.%20BETTER_AUTH_SECRET%20must%20be%20a%20random%20value%20of%20at%20least%2032%20characters.)

[Live app](https://mindstate.avikmukherjee.com) · [Continue in v0](https://v0.app/chat/projects/prj_5iYwp8N2Q6PUSOaEtFRAxRvDePDG)

## What Mindstate provides

- Durable, searchable memories with tags, types, project links, and session links
- Live agent sessions with heartbeat-based presence and stale-session detection
- Projects for grouping related memories, sessions, and handoffs
- Structured handoffs between agents
- One-time agent enrollment and revocable, scoped API keys
- Automatic agent classification from sanitized runtime and capability signals
- REST and Model Context Protocol (MCP) interfaces
- Email/password authentication with owner-level data isolation

## Architecture

- [Next.js 16](https://nextjs.org/) App Router and React 19
- [Neon Postgres](https://neon.tech/) with Drizzle ORM
- [Better Auth](https://www.better-auth.com/) for authentication and sessions
- [Model Context Protocol](https://modelcontextprotocol.io/) through `mcp-handler`
- Tailwind CSS 4 and shadcn/ui
- SWR for client-side API synchronization
- Vercel Analytics

Every application query is scoped to the authenticated owner. Agent API keys use explicit scopes, and one-time enrollment credentials are stored as hashes.

## Deploy to Vercel

Click **Deploy with Vercel** above, then:

1. Create or select a PostgreSQL database. Neon is recommended.
2. Set the required environment variables listed below.
3. Deploy the application.
4. Apply the included database migrations against the production database:

```bash
pnpm install --frozen-lockfile
pnpm db:migrate
```

5. Open the deployed URL and create the first owner account.

For a custom domain, set `BETTER_AUTH_URL` to its full HTTPS origin, for example `https://mindstate.example.com`, and redeploy.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string used by Drizzle and Better Auth. |
| `BETTER_AUTH_SECRET` | Yes | Random secret of at least 32 characters used to sign authentication data. |
| `BETTER_AUTH_URL` | Production custom domains | Canonical HTTPS origin of the deployed app. Vercel deployment URLs are detected automatically. |

Generate a local authentication secret with:

```bash
openssl rand -base64 32
```

Never commit environment files, database credentials, API keys, or enrollment tokens.

## Local development

### Requirements

- Node.js 20 or newer
- pnpm
- A PostgreSQL database

### Setup

```bash
git clone https://github.com/Avik-creator/Mindstate.git
cd Mindstate
pnpm install --frozen-lockfile
cp .env.example .env.local
```

If `.env.example` is not present in your checkout, create `.env.local` with:

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
BETTER_AUTH_SECRET=replace-with-a-random-secret-of-at-least-32-characters
BETTER_AUTH_URL=http://localhost:3000
```

Apply the schema and start the development server:

```bash
pnpm db:migrate
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the development server. |
| `pnpm build` | Create a production build and run type validation. |
| `pnpm start` | Run the production server. |
| `pnpm db:generate` | Generate a migration from the Drizzle schema. |
| `pnpm db:migrate` | Apply pending migrations. |
| `pnpm db:studio` | Open Drizzle Studio. |

## Agent connection

Mindstate supports REST at `/api/v1` and MCP at `/api/mcp`. The canonical agent guide is also published at [`https://mindstate.avikmukherjee.com/skill.md`](https://mindstate.avikmukherjee.com/skill.md).

### 1. Prepare a workspace for a new user

An agent can initiate signup without handling the user&apos;s password:

```bash
curl -X POST https://YOUR_DOMAIN/api/v1/workspace-claims \
  -H 'Content-Type: application/json' \
  -d '{"name":"Workspace owner","email":"owner@example.com","agentName":"coding-agent"}'
```

Give the returned 30-minute `claimUrl` to the intended user. The user opens it and privately chooses their password. This does not enroll the agent or give it workspace access.

### 2. Enroll an agent

After the user claims the workspace, they create a short-lived enrollment token from the dashboard. Redeem it once:

```bash
curl -X POST https://YOUR_DOMAIN/api/v1/agents/bootstrap \
  -H 'Content-Type: application/json' \
  -d '{"token":"ONE_TIME_TOKEN","agentName":"coding-agent"}'
```

Store the returned API key in a secret manager. It is shown only once and must be sent as a bearer token:

```http
Authorization: Bearer YOUR_AGENT_API_KEY
```

### 3. Use the REST API

```bash
curl 'https://YOUR_DOMAIN/api/v1/memories?q=deployment&limit=20' \
  -H 'Authorization: Bearer YOUR_AGENT_API_KEY'
```

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
    "source":"api",
    "projectId":null,
    "sessionId":null
  }'
```

### 4. Use MCP

Configure an MCP client to connect to:

```text
https://YOUR_DOMAIN/api/mcp
```

Pass the same bearer token in the `Authorization` header. Available tools cover memory search and capture, projects, handoffs, session presence, and agent-context reporting. See [`SKILL.md`](./SKILL.md) for the complete agent integration and credential-safety guide.

## Agent presence

Agents should start a session before meaningful work, send a heartbeat every 30–60 seconds, and complete the session when work ends. A session becomes stale after 90 seconds without a heartbeat; this indicates a stopped or disconnected agent rather than an application error.

## Security notes

- Do not expose owner browser sessions or passwords to agents.
- Give agent keys only the scopes they require.
- Do not place prompts, source code, environment values, or secrets in telemetry.
- Treat `401` and `403` responses as hard authorization failures.
- Revoke a key immediately if it may have been exposed.
- Keep `DATABASE_URL` and `BETTER_AUTH_SECRET` server-only.

## Project structure

```text
app/                         Pages and authenticated API routes
components/                  Dashboard and reusable UI
lib/application/             Validation and application services
lib/domain/                  Core domain models
lib/infrastructure/          PostgreSQL repositories and schema
drizzle/                     Versioned database migrations
public/                      Favicons and social preview assets
SKILL.md                     Agent integration instructions
```

## Contributing

1. Create a feature branch.
2. Keep database changes in the Drizzle schema and generate a migration.
3. Preserve owner scoping on every read and mutation.
4. Run `pnpm build` before opening a pull request.

## License

No license has been specified yet. Unless a license is added, all rights are reserved by the repository owner.
