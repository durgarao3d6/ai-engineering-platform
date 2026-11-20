import { configurations, type CaseResult, type EvaluationReport } from "./benchmark";

const dollars = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

function money(cents: number) {
  return dollars.format(cents / 100);
}

function outcome(result: CaseResult) {
  return result.passed ? "Passed" : "Failed";
}

export default function WorkflowReport({ report }: { report: EvaluationReport }) {
  const { definition, baseline, candidate } = report;
  const baselineCases = new Map(baseline.cases.map((result) => [result.id, result]));
  const candidateCases = new Map(candidate.cases.map((result) => [result.id, result]));
  const rows = definition.fixtures.map((fixture) => {
    const before = baselineCases.get(fixture.id)!;
    const after = candidateCases.get(fixture.id)!;
    const change = before.passed === after.passed ? "Unchanged" : after.passed ? "Fixed" : "Regressed";
    return { fixture, before, after, change };
  });

  return (
    <>
      <section className="workflow-panel run-card" aria-labelledby="evaluate-heading">
        <h2 id="evaluate-heading">Evaluate</h2>
        <p>Example PR #{definition.review.pullRequest} · {definition.name} · task v{definition.version}</p>
        <div className="workflow-metrics">
          {[baseline, candidate].map((run) => (
            <div key={run.configuration}>
              <h3>{configurations[run.configuration]}</h3>
              <p><strong>{run.cases.filter((result) => result.passed).length}/{run.cases.length} checks passed</strong></p>
              <p>Browser compute time {run.durationMs.toFixed(2)} ms · Provider cost $0.00</p>
            </div>
          ))}
        </div>
      </section>

      <section className="workflow-panel run-card" aria-labelledby="compare-heading">
        <h2 id="compare-heading">Compare</h2>
        <div className="table-scroll" role="region" aria-label="Configuration comparison" tabIndex={0}>
          <table>
            <thead><tr><th scope="col">Acceptance check</th><th scope="col">Baseline</th><th scope="col">Candidate</th><th scope="col">Change</th></tr></thead>
            <tbody>
              {rows.map(({ fixture, before, after, change }) => (
                <tr key={fixture.id}>
                  <th scope="row">{fixture.name}</th>
                  <td className={before.passed ? "workflow-pass" : "workspace-error"}>{outcome(before)}</td>
                  <td className={after.passed ? "workflow-pass" : "workspace-error"}>{outcome(after)}</td>
                  <td>{change}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="workflow-panel run-card" aria-labelledby="inspect-heading">
        <h2 id="inspect-heading">Inspect</h2>
        {rows.map(({ fixture, before, after }) => (
          <details className="workflow-evidence" key={fixture.id} open={!before.passed || !after.passed}>
            <summary>{fixture.name}</summary>
            <dl>
              <dt>Expected total</dt><dd>{money(fixture.expectedCents)}</dd>
              <dt>Baseline trace</dt><dd>{money(before.actualCents)} · {before.detail}</dd>
              <dt>Candidate trace</dt><dd>{money(after.actualCents)} · {after.detail}</dd>
            </dl>
          </details>
        ))}
      </section>
    </>
  );
}
