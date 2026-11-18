import Link from "next/link";
import { formatCost, formatDuration, getRunMetrics, sampleRuns } from "../../lib/evaluations";

export default function Dashboard() {
  return (
    <main className="dashboard">
      <Link className="back-link" href="/">AI Engineering Platform</Link>
      <h1>Evaluation runs</h1>
      <p className="demo">Sample data · All results, timings, and cost estimates are illustrative.</p>
      {sampleRuns.length > 1 && <Link className="action" href="/dashboard/compare">Compare runs</Link>}
      {sampleRuns.length === 0 ? <p>No evaluation runs are available.</p> : (
        <ul className="run-grid" aria-label="Sample evaluation runs">
          {sampleRuns.map((run) => {
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
