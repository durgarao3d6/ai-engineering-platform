import Link from "next/link";
import { formatCost, formatDuration, getRunMetrics, sampleRuns } from "../../../lib/evaluations";

function signed(value: number, decimals = 0) {
  return `${value > 0 ? "+" : ""}${value.toFixed(decimals)}`;
}

function outcome(passed: boolean | undefined) {
  return passed === undefined ? "Missing" : passed ? "Passed" : "Failed";
}

export default async function Comparison({
  searchParams,
}: {
  searchParams: Promise<{ baseline?: string; candidate?: string }>;
}) {
  const selection = await searchParams;
  const baseline = sampleRuns.find((run) => run.id === (selection.baseline ?? sampleRuns[0]?.id));
  const candidate = sampleRuns.find((run) => run.id === (selection.candidate ?? sampleRuns[1]?.id));

  return (
    <main className="dashboard">
      <Link className="back-link" href="/dashboard">Evaluation runs</Link>
      <h1>Compare runs</h1>
      <p className="demo">Sample data · Differences are illustrative.</p>
      <form className="compare-form" action="/dashboard/compare">
        <label>Baseline
          <select name="baseline" defaultValue={baseline?.id}>
            {sampleRuns.map((run) => <option key={run.id} value={run.id}>{run.name}</option>)}
          </select>
        </label>
        <label>Candidate
          <select name="candidate" defaultValue={candidate?.id}>
            {sampleRuns.map((run) => <option key={run.id} value={run.id}>{run.name}</option>)}
          </select>
        </label>
        <button className="action" type="submit">Compare</button>
      </form>
      {baseline && candidate && baseline.id !== candidate.id && baseline.datasetId === candidate.datasetId ? (
        <ComparisonResults baseline={baseline} candidate={candidate} />
      ) : <p>Select two different runs from the same dataset.</p>}
    </main>
  );
}

function ComparisonResults({ baseline, candidate }: {
  baseline: (typeof sampleRuns)[number];
  candidate: (typeof sampleRuns)[number];
}) {
  const baseRate = getRunMetrics(baseline).passRate;
  const candidateRate = getRunMetrics(candidate).passRate;
  const checks = new Set([...baseline.checks, ...candidate.checks].map((check) => check.name));
  return (
    <>
      <p>Dataset {baseline.datasetId}. Change equals candidate minus baseline.</p>
      <div className="table-scroll" role="region" aria-label="Run comparison" tabIndex={0}>
        <table>
          <caption>Metrics and task outcomes</caption>
          <thead><tr><th scope="col">Measure</th><th scope="col">Baseline</th><th scope="col">Candidate</th><th scope="col">Change</th></tr></thead>
          <tbody>
            <tr><th scope="row">Pass rate</th><td>{baseRate === null ? "—" : `${baseRate}%`}</td><td>{candidateRate === null ? "—" : `${candidateRate}%`}</td><td>{baseRate === null || candidateRate === null ? "—" : `${signed(candidateRate - baseRate)} pp`}</td></tr>
            <tr><th scope="row">Duration</th><td>{formatDuration(baseline.durationMs)}</td><td>{formatDuration(candidate.durationMs)}</td><td>{signed((candidate.durationMs - baseline.durationMs) / 1000, 1)} s</td></tr>
            <tr><th scope="row">Estimated cost (USD)</th><td>{formatCost(baseline.estimatedCostUsd)}</td><td>{formatCost(candidate.estimatedCostUsd)}</td><td>{signed(candidate.estimatedCostUsd - baseline.estimatedCostUsd, 3)}</td></tr>
            {[...checks].map((name) => {
              const before = baseline.checks.find((check) => check.name === name)?.passed;
              const after = candidate.checks.find((check) => check.name === name)?.passed;
              const change = before === undefined || after === undefined ? "Incomplete" : before === after ? "Unchanged" : after ? "Fixed" : "Regressed";
              return <tr key={name}><th scope="row">{name}</th><td>{outcome(before)}</td><td>{outcome(after)}</td><td>{change}</td></tr>;
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
