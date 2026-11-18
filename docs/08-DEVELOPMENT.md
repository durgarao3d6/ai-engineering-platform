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

## Initial issues
1. Confirm MVP scope and acceptance criteria.
2. Write ADR for sandbox isolation.
3. Define OpenAPI and database migration v1.
4. Build evaluation fixtures and scoring rules.
5. Define GitHub App permissions and approval policy.
6. Establish CI and secret scanning.
