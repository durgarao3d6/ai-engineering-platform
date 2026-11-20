import Link from "next/link";
import { formatCost, formatDuration, getRunMetrics } from "../../lib/evaluations";

import { listEvaluationRuns } from "../../lib/evaluation-client";

export default async function Dashboard() {
  const runs = await listEvaluationRuns();
  return (
    <main className="dashboard">
      <nav className="workspace-nav" aria-label="Dashboard navigation">
        <Link className="back-link" href="/">AI Engineering Platform</Link>
        <Link className="back-link" href="/workspace">Private workspace</Link>
        <Link className="back-link" href="/demo">Run workflow demo</Link>
      </nav>
      <h1>Evaluation runs</h1>
      <p className="demo">Sample data · All results, timings, and cost estimates are illustrative.</p>
      {runs.length > 1 && <Link className="action" href="/dashboard/compare">Compare runs</Link>}
      {runs.length === 0 ? <p>No evaluation runs are available.</p> : (
        <ul className="run-grid" aria-label="Sample evaluation runs">
          {runs.map((run) => {
            const { passed, total, passRate } = getRunMetrics(run);
            const failures = run.checks.filter((check) => !check.passed);
            return (
              <li className="run-card" key={run.id}>
                <h2><Link className="back-link" href={`/dashboard/runs/${run.id}`}>{run.name}</Link></h2>
                <p>{run.datasetId}</p>
                <dl className="metrics">
                  <div><dt>Pass rate</dt><dd>{passRate === null ? "—" : `${passRate}%`}</dd></div>
                  <div><dt>Duration</dt><dd>{formatDuration(run.durationMs)}</dd></div>
                  <div><dt>Estimated cost</dt><dd>{formatCost(run.estimatedCostUsd)}</dd></div>
                </dl>
                <p>{passed} of {total} checks passed</p>
                {failures.length > 0 && (
                  <ul className="check-list" aria-label="Failed checks">
                    {failures.map((check) => <li key={check.name}>{check.summary}</li>)}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
