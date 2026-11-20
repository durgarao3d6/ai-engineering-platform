# Phase 2 backlog

Enable one engineering team to import completed evaluation results from its
existing CI, compare a candidate with an approved baseline, and see which
checks regressed. The public showcase continues to use labeled samples.
The pilot uses private workspace data and imports results as data.

## Phase 1 handoff

Use the [deployment guide](09-DEPLOYMENT.md) to verify both public hosts, record
the deployed revisions and smoke-test results, and add verified URLs to the
README. Issues [#5](https://github.com/durgarao3d6/ai-engineering-platform/issues/5)
and [#10](https://github.com/durgarao3d6/ai-engineering-platform/issues/10)
track this work. Review the
[runner ADR](adr/0001-isolated-evaluation-runner.md) through
[#11](https://github.com/durgarao3d6/ai-engineering-platform/issues/11)
after the showcase. Hosted execution is outside this pilot.

## Proposed issues

### 1. Define a versioned evaluation import contract

**Scope** — Specify the import format and map one pinned Promptfoo JSON export
to it. Record the repository and commit SHA, immutable dataset version and
digest, evaluator and configuration version or digest, stable case IDs, and
per-case outcomes. Include a reproducibility manifest with artifact checksums
when supplied. Document which fields are asserted by the importer and what the
platform validates.

**Acceptance**

- A synthetic Promptfoo export normalizes to a checked-in expected payload.
- Validation rejects unsupported formats, duplicate case IDs, and missing
  provenance with actionable errors. Missing timing and cost remain unknown.
- Inputs are bounded and parsed as inert data. The contract accepts no executable
  fields or artifact URLs that the service must fetch.
- Existing sample and workspace reads remain compatible with legacy records.

**References** — [Data and API draft](05-DATA-API.md),
[Promptfoo exports](https://github.com/promptfoo/promptfoo/blob/main/site/docs/usage/command-line.md),
[SWE-bench](https://github.com/SWE-bench/SWE-bench),
[DVC](https://github.com/treeverse/dvc).

### 2. Import completed runs with project-scoped authorization

**Depends on** — Issue draft 1.

**Scope** — Add a versioned import endpoint for a pre-provisioned project.
Give ingestion its own least-privilege database permissions and use an
expiring, revocable credential that is scoped to one project. Keep the
showcase's read-only database deployment model. Add a PostgreSQL CI job for
migrations, import, and tenant isolation.

**Acceptance**

- One transaction stores the run, provenance, and results. Failure leaves
  no partial records.
- Retrying the same project and idempotency key with the same payload returns
  the existing run. Reusing the key with a different payload returns a
  conflict. Concurrent retries create one run.
- Missing, expired, revoked, or cross-project credentials cannot write.
  The audit record identifies the import and its project without exposing
  credentials or full input content.
- CI exercises imports and preserves Phase 1 read and sample behavior.

**References** — [Security controls](06-SECURITY.md),
[Current API and database roles](../services/api/README.md).

### 3. Show imported runs in a private workspace comparison

**Depends on** — Issue draft 2.

**Scope** — Choose and document a pilot sign-in approach, then add workspace
and project selection and connect the dashboard to authorized reads. Reuse the
existing run details and comparison views. Keep service credentials server-side
and keep the public sample dashboard available.

**Acceptance**

- An authorized pilot user can view two imported runs in their project.
  Anonymous callers and users outside that workspace cannot read their data.
- The comparison aligns cases by stable ID and displays regressions, fixes,
  and missing cases. Incompatible dataset versions are clearly flagged and
  do not produce a pass-rate delta.
- The view identifies the source commit and dataset version. Missing legacy
  metadata and usage values are displayed as unknown.

**References** — [Software requirements](02-SRS.md),
[Current dashboard](../apps/web/README.md).

### 4. Select an approved baseline for each dataset version

**Depends on** — Issue drafts 2 and 3.

**Scope** — Let a workspace administrator select an imported run as the baseline
for a compatible dataset version within the project. Retain approval history
and expose the selected baseline to comparisons and CI.

**Acceptance**

- Only authorized administrators can select or restore a baseline. The selection
  must refer to a compatible run in the same project.
- Each project and dataset version has at most one active selection, including
  when administrators make concurrent changes.
- History records the previous run, new run, actor, and time. Changing
  the active baseline preserves the baseline ID used in prior comparisons.

**Reference** — [MLflow version aliases](https://mlflow.org/docs/latest/genai/prompt-registry/use-prompts-in-apps/).

### 5. Report regressions in a trusted GitHub Actions workflow

**Depends on** — Issue draft 4.

**Scope** — Provide an opt-in workflow example that imports existing evaluation
output, compares it against the approved baseline, and writes a GitHub Actions
job summary. Start with informational results so the pilot can calibrate
thresholds.

**Acceptance**

- A synthetic candidate with a known regression produces a summary with the
  candidate commit, baseline ID, failing case IDs, and a link to the private
  comparison. Private inputs and outputs stay out of the GitHub summary.
- The workflow reports absent baselines, incompatible versions, and failed
  imports explicitly. A known regression leaves the job informational.
- Upload credentials are available only to the trusted workflow path.
  Fork contributions cannot access the credential or select a baseline.

**Reference** — [GitHub Actions job summaries](https://docs.github.com/en/actions/reference/workflow-commands-for-github-actions#adding-a-job-summary).

## Pilot exit check

In one private project, import a baseline and a candidate from CI, approve the
baseline, and demonstrate that a known regression appears in the job summary
and at the linked private comparison. Repeat the import to confirm it creates
no duplicate. Verify that a user from another workspace cannot open the link.

## Follow-up candidates

- Add a reviewer queue and record human verdicts alongside automated results.
- Let an authorized reviewer turn a reviewed failure into a draft regression case
  for a new dataset version, with a link to the original result.
- Add quality trends by task category and cost per passed case after the pilot
  has enough runs and usage data.

The queue and regression-case drafts draw from
[Langfuse annotation queues](https://langfuse.com/docs/evaluation/evaluation-methods/annotation-queues)
and [Opik's feedback and dataset workflows](https://github.com/comet-ml/opik).
