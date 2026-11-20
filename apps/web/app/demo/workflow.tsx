"use client";

import { useState, type FormEvent } from "react";
import {
  configurations,
  fixtures,
  reviewContext,
  type Configuration,
  type Definition,
  type EvaluationReport,
} from "./benchmark";
import WorkflowReport from "./workflow-report";

type Decision = { status: "approved" | "withheld"; decidedAt: string };

function runBenchmark(definition: Definition): Promise<EvaluationReport> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./benchmark.worker.ts", import.meta.url), { type: "module" });
    const stop = () => {
      window.clearTimeout(timer);
      worker.terminate();
    };
    const fail = (message: string) => {
      stop();
      reject(new Error(message));
    };
    const timer = window.setTimeout(() => fail("The browser runner exceeded its five-second limit."), 5000);
    worker.onmessage = (event: MessageEvent<EvaluationReport>) => {
      stop();
      resolve(event.data);
    };
    worker.onerror = () => fail("The browser runner stopped before it finished.");
    worker.onmessageerror = () => fail("The browser runner returned unreadable results.");
    worker.postMessage(definition);
  });
}

export default function Workflow() {
  const [versions, setVersions] = useState<Definition[]>([]);
  const [dirty, markDirty] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [decision, setDecision] = useState<Decision | null>(null);
  const definition = versions.at(-1);

  function saveVersion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name")).trim();
    const objective = String(form.get("objective")).trim();
    const baseline = form.get("baseline") as Configuration;
    const candidate = form.get("candidate") as Configuration;
    if (!name || !objective) {
      setError("Enter a task name and expected outcome.");
      return;
    }
    if (baseline === candidate) {
      setError("Choose different baseline and candidate configurations.");
      return;
    }
    setVersions((previous) => [...previous, {
      version: previous.length + 1,
      review: reviewContext,
      name,
      objective,
      baseline,
      candidate,
      fixtures: fixtures.map(({ id, name, coupon }) => ({
        id, name, coupon,
        subtotalCents: Math.round(Number(form.get(`${id}-subtotal`)) * 100),
        discountPercent: Number(form.get(`${id}-discount`)),
        expectedCents: Math.round(Number(form.get(`${id}-expected`)) * 100),
      })),
    }]);
    markDirty(false);
    setError("");
  }

  async function run() {
    if (!definition || dirty || running) return;
    setRunning(true);
    setReport(null);
    setDecision(null);
    setError("");
    try {
      setReport(await runBenchmark(definition));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The browser runner could not start.");
    } finally {
      setRunning(false);
    }
  }

  function downloadReport() {
    if (!report || decision?.status !== "approved") return;
    const artifact = { kind: "built-in-checkout-demo", report, approval: decision };
    const url = URL.createObjectURL(new Blob([JSON.stringify(artifact, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `checkout-evaluation-v${report.definition.version}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <>
      <section className="workflow-panel run-card" aria-labelledby="define-heading">
        <h2 id="define-heading">Define</h2>
        <form className="workflow-form" onSubmit={saveVersion} onChange={() => markDirty(true)}>
          <fieldset disabled={running}>
            <div className="workflow-fields">
              <label>Task name<input name="name" defaultValue={reviewContext.title} maxLength={100} required /></label>
              <label>Expected outcome<textarea name="objective" defaultValue="Apply valid discounts, reject expired coupons, and preserve the total when no coupon is supplied." maxLength={500} required /></label>
            </div>
            <div className="workflow-fields">
              <label>Baseline configuration
                <select name="baseline" defaultValue="checkout-v1">
                  {Object.entries(configurations).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                </select>
              </label>
              <label>Candidate configuration
                <select name="candidate" defaultValue="checkout-v2">
                  {Object.entries(configurations).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                </select>
              </label>
            </div>
            <div className="table-scroll" role="region" aria-label="Acceptance check fixtures" tabIndex={0}>
              <table>
                <caption>Fixtures and acceptance checks</caption>
                <thead><tr><th scope="col">Check</th><th scope="col">Subtotal ($)</th><th scope="col">Discount (%)</th><th scope="col">Expected total ($)</th></tr></thead>
                <tbody>
                  {fixtures.map((fixture) => (
                    <tr key={fixture.id}>
                      <th scope="row">{fixture.name}</th>
                      <td><input name={`${fixture.id}-subtotal`} aria-label={`${fixture.name}: subtotal`} type="number" min="0" max="50000" step="0.01" defaultValue={fixture.subtotal} required /></td>
                      <td><input name={`${fixture.id}-discount`} aria-label={`${fixture.name}: discount`} type="number" min="0" max="100" step="1" defaultValue={fixture.discount} required /></td>
                      <td><input name={`${fixture.id}-expected`} aria-label={`${fixture.name}: expected total`} type="number" min="0" max="50000" step="0.01" defaultValue={fixture.expected} required /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="action" disabled={Boolean(definition) && !dirty}>Save task version</button>
          </fieldset>
        </form>
        {definition && (
          <details className="workflow-versions">
            <summary>{versions.length} saved {versions.length === 1 ? "version" : "versions"}</summary>
            <ol>{versions.map((version) => <li key={version.version}>v{version.version} · {version.name}</li>)}</ol>
          </details>
        )}
      </section>

      <section className="workflow-panel run-card" aria-labelledby="run-heading">
        <h2 id="run-heading">Run</h2>
        <p aria-live="polite">
          {running ? "Running both configurations…" : !definition || dirty
            ? "Save the task version before starting the run."
            : `Ready to evaluate v${definition.version} in a separate browser worker with a five-second limit.`}
        </p>
        <button className="action" onClick={run} disabled={!definition || dirty || running}>Run both configurations</button>
        {error && <p className="workspace-error" role="alert">{error}</p>}
      </section>

      {report && (
        <>
          <WorkflowReport report={report} />
          <section className="workflow-panel run-card" aria-labelledby="control-heading">
            <h2 id="control-heading">Control</h2>
            <p>Approve this PR review report to download the evidence for your team.</p>
            <div className="workflow-buttons">
              <button className="action" onClick={() => setDecision({ status: "approved", decidedAt: new Date().toISOString() })} disabled={decision?.status === "approved"}>Approve report</button>
              <button className="workspace-button" onClick={() => setDecision({ status: "withheld", decidedAt: new Date().toISOString() })} disabled={decision?.status === "withheld"}>Withhold approval</button>
              <button className="workspace-button" onClick={downloadReport} disabled={decision?.status !== "approved"}>Download evidence JSON</button>
            </div>
            <p role="status">{decision?.status === "approved" ? "Report approved for download." : decision?.status === "withheld" ? "Approval withheld. Download is locked." : "Awaiting review."}</p>
          </section>
        </>
      )}
    </>
  );
}
