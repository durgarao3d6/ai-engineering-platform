# Dashboard app (Issue #1)

Next.js App Router, TypeScript, and Tailwind starter for the AI Engineering Platform. The landing page is a concept preview, not a working evaluation engine.

## Local setup

Use Node.js 22 to match CI.

```bash
cd apps/web
npm ci
npm run dev
```

Open http://localhost:3000.

## Checks

```bash
npm run lint
npm run typecheck
npm run build
```

See the [deployment guide](../../docs/09-DEPLOYMENT.md) for the public showcase and the [Phase 2 backlog](../../docs/10-PHASE-2-BACKLOG.md) for the proposed private dashboard.

## Local API mode

The dashboard uses bundled sample data by default. To render sample data from the
API, start FastAPI in development mode as described in the
[API guide](../../services/api/README.md). Copy `.env.example` to `.env.local`,
uncomment `EVALUATION_API_URL`, and restart Next.js. Open
`http://localhost:3000/dashboard`. The baseline duration is 12.5 seconds in API
mode and 12.4 seconds with bundled fixtures.

API requests run on the Next.js server. The dashboard preserves sample labels,
shows loading and retry states, and displays errors if the configured API is
unreachable or returns an invalid response.

## Private workspace dashboard

Set the server-only `WORKSPACE_API_URL` to the FastAPI origin and restart or
redeploy Next.js. Use the Render HTTPS origin on Vercel. Local loopback HTTP
is supported for development. Deploy the API revision that provides
`GET /v1/projects` first. Keep `EVALUATION_API_URL` unset on the public site
to continue serving the bundled sample dashboard.

The official Vercel production project already defaults to the project's Render
API. Other deployments can set `WORKSPACE_API_URL` explicitly. A configured
deployment opens the workspace from `/`, with the sample dashboard at
`/dashboard`.

Open `/workspace` and enter a short-lived access token provisioned by an
administrator. The token is held in a one-hour HTTP-only cookie and each
read is checked by the API. Sign out clears the browser session. Token
issuance and revocation remain administrator operations.

The private dashboard lists authorized projects, with run details and
comparisons for runs from the same dataset version. It displays existing
PostgreSQL records. Set up project membership and data using the
[API guide](../../services/api/README.md).
