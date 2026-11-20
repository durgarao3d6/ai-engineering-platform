# Proposed Technology Stack

| Layer | Initial choice | Rationale |
|---|---|---|
| Web | Next.js + TypeScript | Dashboard and typed UI |
| API | FastAPI + Pydantic | Typed Python endpoints |
| Database | PostgreSQL | Relational state and migrations |
| Migrations | Versioned SQL via `app.migrate` | Apply ordered schema changes in PostgreSQL |
| Queue | Redis + Celery | Background jobs and retries |
| Sandbox | Ephemeral containers with strict isolation | Contain untrusted code |
| GitHub | GitHub App + REST/webhooks | Scoped repository access |
| Browser tests (later) | Playwright | Repeatable UI flows |
| Telemetry | OpenTelemetry | Trace correlation |
| Tests | pytest + Playwright | API and end-to-end checks |
| CI | GitHub Actions | Automated validation |

## Model integration
Provider-neutral adapter with explicit model version, request limits, timeout, token usage, and price snapshot. Start with one provider; expand after baseline evaluations.

## Selection criteria
Security, operational simplicity, cost, developer familiarity, portability, and observability.

## Open decisions
The [Phase 1 showcase](09-DEPLOYMENT.md) is configured for Vercel and Render.
The pilot still needs a sign-in approach. Long-term hosting, secret management,
sandbox runtime, artifact storage, and the project license remain open.
