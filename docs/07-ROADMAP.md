# MVP Roadmap

## Week 1: Foundations
Finalize requirements and ADRs; initialize monorepo, CI, auth skeleton, PostgreSQL schema, and project API.

**Exit:** Authenticated user can create a project in a test environment; CI passes.

## Week 2: Evaluation engine
Implement dataset/case/config versions, sandbox runner prototype, deterministic checks, and trace collection.

**Exit:** At least five fixture tasks run with stored outcomes.

## Week 3: Comparisons and GitHub
Add run comparison dashboard, GitHub App integration, webhook validation, approvals, and failure handling.

**Exit:** Candidate vs baseline comparison works; unauthorized writes are denied.

## Week 4: Hardening and pilot
Test isolation, idempotency, RBAC, retry behavior, observability, and pilot onboarding.

**Exit:** A pilot team completes an end-to-end evaluation with documented limitations.

## Backlog after MVP
PR failure investigation -> model routing -> browser QA -> AgentOps governance -> enterprise features.

## Risks
Sandbox complexity, evaluation quality, provider cost variability, GitHub permissions, and tenant isolation.

## Estimation note
Four weeks is a planning hypothesis for a tightly scoped prototype, not a committed production release date.
