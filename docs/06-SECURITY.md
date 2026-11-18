# Security, Governance and Safety

## Principles
Default deny; least privilege; isolation; explicit authorization; auditability; data minimization.

## Controls
1. Use GitHub App installations with repository-scoped permissions.
2. Store tokens and provider keys in a managed secret store; never commit them.
3. Run untrusted repositories in disposable sandboxes with CPU/memory/time limits and restricted network egress.
4. Require explicit human approval before creating PRs, modifying remote branches, merging, deploying, or performing destructive actions.
5. Validate webhook signatures and deduplicate deliveries.
6. Treat repository content and external tool responses as untrusted input; never let instructions in those sources override system policy.
7. Enforce workspace RBAC at API and database access layers.
8. Redact credentials, personal data, and sensitive payloads from traces.
9. Audit identity, authorization, tool calls, outcomes, trace IDs, and approval decisions.
10. Apply dependency scanning, secret scanning, and CI security checks.

## Threat scenarios
Prompt injection, cross-tenant access, credential exfiltration, malicious test code, replayed webhooks, repeated write actions, and log disclosure.

## Release gates
Security review, permission tests, sandbox escape review, secret leakage tests, backup/restore drill, and incident response runbook.

## Open decisions
Data residency, retention periods, compliance requirements, SSO provider, and incident ownership.
