# MVP Roadmap

## Phase 1 — Public showcase

The sample dashboard, run details and comparisons, frontend CI, and authenticated
read API are on `main`. Public release verification is tracked in
[#5](https://github.com/durgarao3d6/ai-engineering-platform/issues/5) and
[#10](https://github.com/durgarao3d6/ai-engineering-platform/issues/10).
Use the [deployment guide](09-DEPLOYMENT.md) to verify the Vercel frontend and
Render API and record verified URLs.

**Exit:** The public sample UI and production API pass their respective smoke
checks, a disposable token passes the authenticated API check, and the README
links to the verified deployments.

## Phase 2 — Private evaluation pilot

Import previously completed CI results into one private project. Show a
comparison against an approved baseline and report known regressions through
a GitHub Actions job summary. The [Phase 2 backlog](10-PHASE-2-BACKLOG.md)
defines the proposed implementation order, dependencies, and acceptance checks.

**Exit:** A pilot user imports a baseline and a candidate, reviews a known
regression in the private dashboard, and can find the corresponding GitHub
job summary. Duplicate and cross-workspace access checks pass.

## Later work

Review the [runner ADR](adr/0001-isolated-evaluation-runner.md) after the
showcase under [#11](https://github.com/durgarao3d6/ai-engineering-platform/issues/11).
Isolation, time bounds, and approval controls are required before hosted
evaluation execution. The broader roadmap includes task authoring, GitHub PR
investigation, model routing, browser QA, and operational monitoring.

## Risks and sequencing

The private pilot depends on trustworthy run provenance, tenant isolation,
and correct baseline selection. Hosted execution adds sandbox, permission,
and provider-cost risks. The milestones above define acceptance criteria.
