# Data Model and API Draft

## Core entities
- users(id, external_subject, created_at)
- workspaces(id, name, created_at)
- memberships(workspace_id, user_id, role)
- projects(id, workspace_id, name, repo_url)
- datasets(id, project_id, version, manifest_hash)
- cases(id, dataset_id, name, task_spec, check_spec)
- agent_configs(id, project_id, version, model, settings_hash)
- runs(id, project_id, dataset_id, agent_config_id, status, requested_by, created_at, completed_at)
- case_results(id, run_id, case_id, status, score, duration_ms, cost_estimate)
- artifacts(id, run_id, type, object_key, checksum)
- approvals(id, run_id, action_type, requested_by, approved_by, status)
- audit_events(id, workspace_id, actor_id, action, target_id, timestamp, trace_id)

All workspace-owned resources must be scoped by workspace authorization. Prefer immutable versions and opaque IDs.

## API sketch (versioned)
- POST /v1/projects
- GET /v1/projects/{project_id}
- POST /v1/projects/{project_id}/datasets
- POST /v1/projects/{project_id}/agent-configs
- POST /v1/runs (supports Idempotency-Key)
- GET /v1/runs/{run_id}
- GET /v1/runs/{run_id}/results
- POST /v1/runs/{run_id}/cancel
- GET /v1/projects/{project_id}/comparisons?baseline=...&candidate=...
- POST /v1/approvals/{approval_id}/decision

## Run states
queued -> provisioning -> running -> evaluating -> succeeded/failed; cancellation and infrastructure_error are explicit terminal states.

## API conventions
JSON, bearer authentication, authorization per resource, cursor pagination, request IDs, structured error codes, and OpenAPI generation.

## Future work
Detailed OpenAPI schemas, indexes, retention policies, migrations, and event contracts.
