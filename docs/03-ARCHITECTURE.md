# System Architecture

The execution architecture below describes the longer-term design. The
[Phase 1 showcase](09-DEPLOYMENT.md) serves sample results and authenticated
workspace reads. The [Phase 2 pilot](10-PHASE-2-BACKLOG.md) adds ingestion and
comparison of completed results from existing CI.

## Logical components
1. Next.js UI: workspaces, evaluation authoring, run results, comparisons.
2. FastAPI service: authentication integration, authorization, project/task/config APIs.
3. Queue and workers: schedule evaluations and manage lifecycle.
4. Sandbox runner: clone pinned repository revision, apply agent changes, execute tests.
5. Evaluation engine: deterministic checks, optional separately labeled model graders.
6. Telemetry pipeline: structured traces, metrics, usage and audit events.
7. PostgreSQL: transactional records; object storage: large artifacts and logs.

## Main flow
User -> API -> authorize -> persist versioned run -> queue -> sandbox -> agent/model -> tests -> evaluator -> results store -> dashboard.

## Trust boundaries
Treat repository files, issue descriptions, retrieved documents, and model outputs as untrusted. The agent never receives host credentials or broad filesystem access. External writes pass through a policy/approval gateway.

## Reliability
Use at-least-once queue processing with idempotent handlers, run leases, bounded retries, timeouts, cancellation, and dead-letter handling. Separate agent failure from infrastructure failure.

## Deployment concept
Dockerized UI/API/worker services, managed PostgreSQL, Redis, object storage, centralized telemetry. Production topology and cloud provider remain open decisions.

## Architecture decision records
Create ADRs for execution sandbox, auth provider, queue, model adapters, and hosting before implementation.
