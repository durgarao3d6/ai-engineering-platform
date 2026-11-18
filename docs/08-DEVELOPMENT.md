# Development and Contribution Guide

## Repository conventions
- Keep architecture and requirements in docs/.
- Record significant decisions in docs/adr/.
- Use short-lived feature branches and pull requests.
- Require review and passing checks before merging implementation changes.
- Never commit secrets, tokens, customer data, or real evaluation artifacts.

## Proposed future structure
```text
apps/web/
services/api/
services/worker/
packages/contracts/
infra/
tests/
docs/
.github/workflows/
```

## Definition of done
A change includes tests, documentation updates, authorization checks, observability, failure behavior, and rollback considerations where relevant.

## Testing layers
Unit tests for evaluators; integration tests for persistence and queue; contract tests for API; end-to-end tests for a complete run; adversarial tests for permissions and prompt injection.

## Coding standards
Type checking, linting, dependency pinning, structured logging, explicit errors, and reproducible local development.

## Pull request template
Describe purpose, linked requirement, behavior changes, tests, security impact, and rollback plan.

## Planning

Use the [roadmap](07-ROADMAP.md) for release scope and the
[Phase 2 backlog](10-PHASE-2-BACKLOG.md) for the next proposed issues.
The [deployment guide](09-DEPLOYMENT.md) tracks the Phase 1 verification steps.

## Frontend checks

Use Node.js 22 and run the same checks as the Web CI job from `apps/web`.

```sh
npm ci
npm run lint
npm run typecheck
NEXT_TELEMETRY_DISABLED=1 npm run build
```

The job runs on pull requests and pushes to `main`. It builds with fixture defaults and requires no deployment credentials.
