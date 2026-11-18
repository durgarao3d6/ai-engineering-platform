import Link from "next/link";
import { notFound } from "next/navigation";
import { formatCost, formatDuration, getRunMetrics, sampleRuns } from "../../../../lib/evaluations";

export default async function RunDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = sampleRuns.find((item) => item.id === id);
  if (!run) notFound();

  const { passed, total } = getRunMetrics(run);
  return (
    <main className="dashboard">
      <Link className="back-link" href="/dashboard">Evaluation runs</Link>
      <h1>{run.name}</h1>
      <p className="demo">Sample data · This run is illustrative.</p>
      <p>{run.datasetId} · {passed} of {total} checks passed · {formatDuration(run.durationMs)} · {formatCost(run.estimatedCostUsd)} estimated</p>
      <div className="run-grid">
        <section className="run-card">
          <h2>Task checks</h2>
          <ul className="detail-list">
            {run.checks.map((check) => (
              <li key={check.name}>
                <strong>{check.name} · {check.passed ? "Passed" : "Failed"}</strong>
                <p>{check.summary}</p>
              </li>
            ))}
          </ul>
        </section>
        <section className="run-card">
          <h2>Trace</h2>
          <ol className="detail-list trace-list">
            {run.trace.map((event, index) => <li key={index}>{event}</li>)}
          </ol>
        </section>
      </div>
    </main>
  );
}
