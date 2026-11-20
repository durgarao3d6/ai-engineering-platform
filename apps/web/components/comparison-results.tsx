import { formatCost, formatDuration, getRunMetrics, type EvaluationRun } from "../lib/evaluations";

function signed(value: number, decimals = 0) {
  return `${value > 0 ? "+" : ""}${value.toFixed(decimals)}`;
}

function outcome(passed: boolean | undefined) {
  return passed === undefined ? "Missing" : passed ? "Passed" : "Failed";
}

export function ComparisonResults({ baseline, candidate, datasetLabel = baseline.datasetId }: {
  baseline: EvaluationRun;
  candidate: EvaluationRun;
  datasetLabel?: string;
}) {
  const baseRate = getRunMetrics(baseline).passRate;
  const candidateRate = getRunMetrics(candidate).passRate;
  const checks = new Set([...baseline.checks, ...candidate.checks].map((check) => check.name));
  return (
    <>
      <p>Dataset {datasetLabel}. Change equals candidate minus baseline.</p>
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
