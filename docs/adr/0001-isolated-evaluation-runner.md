# ADR 0001. Isolated evaluation runner

**Status** Proposed for review after the public showcase (#10).

## Context

An evaluation may eventually process repository snapshots, model output, and task
checks supplied by different parties. Treat all three as untrusted input. The
showcase web and API services only display stored or bundled data. They have no
job submission or execution endpoint.

Assets to protect include workspace code and results, database and provider
credentials, other tenants' data, and external repositories. Failures include
cross-run data access, accidental credential exposure, resource exhaustion,
unsafe output rendering, and external writes without human approval.

## Proposed boundaries

- **Control plane.** A future authenticated API authorizes a workspace and records
  the run specification. It queues immutable identifiers and digests. A separate
  worker identity leases jobs and starts an isolated, disposable execution
  environment on dedicated infrastructure. The worker verifies that job, input,
  and output scopes all name the same workspace and run.
- **Filesystem.** Use one fresh sandbox per attempt. Mount the verified repository
  snapshot read-only and provide a size-limited writable scratch directory.
  Exclude host directories, shared writable caches, device access, and container
  control sockets. Treat outputs as untrusted bytes and enforce type and size
  limits before storage or display.
- **Network and credentials.** Deny inbound and outbound network access by default.
  Fetch approved inputs outside the sandbox. Keep database, GitHub, cloud, and
  model-provider credentials outside the sandbox. If a future evaluation needs
  model calls, assess a separately authenticated broker with per-run budgets
  and a narrow request contract before granting access.
- **Resources and lifecycle.** The worker enforces wall-clock, CPU, memory, process,
  disk, and output limits independently of the task. On timeout or cancellation,
  terminate the attempt and release its resources. Use a lease and attempt ID
  to discard late or duplicate results. Record timeout and infrastructure failure
  separately from a failed task check.
- **Human approval.** Evaluation output may include a proposed change for review.
  External writes require a separate service and a fresh approval bound to the
  workspace, target, operation, and exact artifact digest. A changed artifact or
  target requires a new approval. The sandbox cannot read or use write credentials.
- **Observability.** Record the run, attempt, policy decision, and resource-limit
  outcome. Scope artifact reads to the workspace. Redact sensitive values before
  publishing traces and define retention and deletion with the data owner.

## Adversarial test plan

Use disposable local fixtures, fake credentials, and test-owned endpoints. Run
these checks as release gates before any runner is enabled.

| Boundary | Test | Expected result |
| --- | --- | --- |
| Workspace isolation | Seed two workspaces with distinct canary inputs and request another workspace's run or artifact. | Access is denied and the outcome is audited. |
| Filesystem isolation | Provide a fixture that attempts to read a canary outside its assigned scratch space and write to the input mount. | Both operations fail. Scratch data is deleted after the attempt. |
| Network isolation | Use a test-owned listener and ask the fixture to reach it. | The listener records no connection and the denials are observable. |
| Credentials and traces | Place fake secrets in a test control-plane environment and a separate fake secret in a trace fixture. | Control-plane credentials are non-visible inside the sandbox, and the stored trace redacts its fixture secret. |
| Resource limits | Use bounded fixtures that exceed the configured wall time, scratch quota, and output limit. | The attempt is terminated and reported once. A following job can run normally. |
| Cancellation and retry | Cancel a leased attempt and deliver a late result during a retry. | The late result cannot overwrite the active attempt. |
| Approval enforcement | Submit a write request with no approval, replay an approval, and change the target or artifact after approval. | Requests are rejected and logged. A valid approval can authorize only its exact operation on a test-owned target. |
| Web and API isolation | Inspect service identities and exercise all public routes with malformed job-like payloads. | There is no route or service identity that can launch the runner from the web deployment. |

## Review required

After the public deployment is verified, review the isolation technology, tenant
placement, worker identity, approval ownership, and operational response to
failed cleanup. Require platform and security reviewers to sign off on the
design and its test plan before any implementation can be enabled.
