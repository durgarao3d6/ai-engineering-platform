import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ComparisonResults } from "../../../../components/comparison-results";
import { formatCost, formatDuration, getRunMetrics, type EvaluationRun } from "../../../../lib/evaluations";
import {
  getWorkspaceResults,
  listProjectDatasets,
  listProjectRuns,
  listProjects,
  WorkspaceApiError,
  workspaceConfigured,
  type WorkspaceRun,
} from "../../../../lib/workspace-api";
import { getWorkspaceToken } from "../../../../lib/workspace-session";
import { signOut } from "../../actions";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ run?: string; baseline?: string; candidate?: string }>;
};

export default async function ProjectPage({ params, searchParams }: PageProps) {
  const [{ id }, selection, token] = await Promise.all([params, searchParams, getWorkspaceToken()]);
  if (!token || !workspaceConfigured()) redirect("/workspace");

  try {
    const project = (await listProjects(token)).find((item) => item.id === id);
    if (!project) notFound();

    const [datasets, runs] = await Promise.all([
      listProjectDatasets(token, id),
      listProjectRuns(token, id),
    ]);
    const datasetNames = new Map(datasets.map((dataset) => [dataset.id, `${dataset.name} · ${dataset.version}`]));
    const labelDataset = (datasetId: string) => datasetNames.get(datasetId) ?? datasetId;

    const selected = runs.find((run) => run.id === selection.run);
    const baseline = runs.find((run) => run.id === selection.baseline);
    const candidate = runs.find((run) => run.id === selection.candidate);
    const comparing = Boolean(selection.baseline || selection.candidate);
    const compatible = baseline && candidate && baseline.id !== candidate.id &&
      baseline.datasetId === candidate.datasetId;
    const runsToLoad = new Map<string, WorkspaceRun>();
    if (selected) runsToLoad.set(selected.id, selected);
    if (compatible) {
      runsToLoad.set(baseline.id, baseline);
      runsToLoad.set(candidate.id, candidate);
    }
    const loaded = await Promise.all([...runsToLoad.values()].map(async (run) => ({
      ...run, ...await getWorkspaceResults(token, run.id),
    })));
    const details = new Map(loaded.map((run) => [run.id, run]));
    const selectedRun = selected && details.get(selected.id);
    const baselineRun = baseline && details.get(baseline.id);
    const candidateRun = candidate && details.get(candidate.id);
    const projectPath = `/workspace/projects/${project.id}`;

    return (
      <main className="dashboard workspace">
        <Link className="back-link" href="/workspace">Workspace projects</Link>
        <div className="workspace-heading">
          <h1>{project.name}</h1>
          <form action={signOut}><button className="workspace-button">Sign out</button></form>
        </div>
        <h2>Evaluation runs</h2>
        {runs.length === 0 ? (
          <div>
            <p>This project has no recorded runs yet.</p>
            <Link className="back-link" href="/demo">Try the workflow with built-in fixtures</Link>
          </div>
        ) : (
          <div className="table-scroll" role="region" aria-label="Project runs" tabIndex={0}>
            <table>
              <thead>
                <tr><th scope="col">Run</th><th scope="col">Dataset</th><th scope="col">Duration</th><th scope="col">Estimated cost</th></tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr key={run.id}>
                    <th scope="row">
                      <Link prefetch={false} className="back-link" href={`${projectPath}?run=${run.id}#run-details`}>{run.name}</Link>
                    </th>
                    <td>{labelDataset(run.datasetId)}</td>
                    <td>{formatDuration(run.durationMs)}</td>
                    <td>{formatCost(run.estimatedCostUsd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {selectedRun ? <RunDetails run={selectedRun} /> : selection.run && <p>That run is unavailable in this project.</p>}
        {runs.length > 1 && (
          <section className="workspace-section" aria-labelledby="compare-heading">
            <h2 id="compare-heading">Compare runs</h2>
            <form className="compare-form" action={`${projectPath}#compare-heading`}>
              <div>
                <label htmlFor="baseline">Baseline</label>
                <select name="baseline" id="baseline" key={baseline?.id} defaultValue={baseline?.id ?? runs[1].id}>
                  {runs.map((run) => <option value={run.id} key={run.id}>{run.name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="candidate">Candidate</label>
                <select name="candidate" id="candidate" key={candidate?.id} defaultValue={candidate?.id ?? runs[0].id}>
                  {runs.map((run) => <option value={run.id} key={run.id}>{run.name}</option>)}
                </select>
              </div>
              <button className="action" type="submit">Compare</button>
            </form>
            {compatible && baselineRun && candidateRun ? (
              <ComparisonResults baseline={baselineRun} candidate={candidateRun} datasetLabel={labelDataset(baselineRun.datasetId)} />
            ) : comparing && <p>Select two different runs from the same dataset version.</p>}
          </section>
        )}
      </main>
    );
  } catch (error) {
    if (error instanceof WorkspaceApiError && error.status === 401) redirect("/workspace");
    if (error instanceof WorkspaceApiError && error.status === 404) notFound();
    throw error;
  }
}

function RunDetails({ run }: { run: EvaluationRun }) {
  const { passed, total } = getRunMetrics(run);

  return (
    <section id="run-details" className="workspace-section" aria-labelledby="run-heading">
      <h2 id="run-heading">{run.name}</h2>
      <p>{total ? `${passed} of ${total} checks passed` : "No checks were recorded."}</p>
      <div className="run-grid">
        <section className="run-card">
          <h3>Task checks</h3>
          {run.checks.length ? (
            <ul className="detail-list">
              {run.checks.map((check) => (
                <li key={check.name}>
                  <strong>{check.name} · {check.passed ? "Passed" : "Failed"}</strong>
                  <p>{check.summary}</p>
                </li>
              ))}
            </ul>
          ) : <p>No results available.</p>}
        </section>
        <section className="run-card">
          <h3>Trace</h3>
          {run.trace.length ? (
            <ol className="detail-list trace-list">
              {run.trace.map((event, index) => <li key={index}>{event}</li>)}
            </ol>
          ) : <p>No trace recorded.</p>}
        </section>
      </div>
    </section>
  );
}
