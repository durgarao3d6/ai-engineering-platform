# Software Requirements Specification (SRS)

## Functional requirements
- FR-01: Authenticate users and enforce workspace membership.
- FR-02: Create projects with repository references and scoped credentials.
- FR-03: Version task definitions, fixtures, expected outcomes, and evaluation rules.
- FR-04: Register versioned agent configurations and model settings.
- FR-05: Queue runs with unique IDs and idempotency keys.
- FR-06: Execute tasks in isolated, time-bounded environments.
- FR-07: Capture structured traces, tool calls, test results, errors, and resource usage.
- FR-08: Compute pass/fail outcomes using deterministic checks; label subjective grading separately.
- FR-09: Compare candidate runs to baselines by task, success rate, latency, and cost.
- FR-10: Maintain an append-only audit trail for sensitive actions.
- FR-11: Require human approval for external write operations.
- FR-12: Allow cancellation, retry, and explicit terminal failure states.

## Nonfunctional requirements
- NFR-01: Enforce tenant isolation and least privilege.
- NFR-02: Never expose secrets in UI or ordinary logs.
- NFR-03: Provide trace IDs and structured error reporting.
- NFR-04: Support retries without duplicate side effects.
- NFR-05: Define retention and deletion policies per environment.
- NFR-06: Protect against prompt injection from repository content and tool output.
- NFR-07: Use versioned API contracts and schema migrations.

## Acceptance examples
- A failing test produces a failed evaluation with linked evidence.
- A missing credential fails safely without exposing its value.
- A duplicate run request returns the existing run for the same idempotency key.
- A non-member cannot read another workspace's runs.
- A requested GitHub write is blocked until an authorized human approves it.

## Dependencies
GitHub API permissions, model-provider credentials, sandbox execution capacity, and PostgreSQL.
