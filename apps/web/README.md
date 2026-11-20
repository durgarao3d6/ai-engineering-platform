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
