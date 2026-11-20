import Link from "next/link";
import { ComparisonResults } from "../../../components/comparison-results";
import { listEvaluationRuns } from "../../../lib/evaluation-client";

export default async function Comparison({
  searchParams,
}: {
  searchParams: Promise<{ baseline?: string; candidate?: string }>;
}) {
  const [selection, runs] = await Promise.all([searchParams, listEvaluationRuns()]);
  const baseline = runs.find((run) => run.id === (selection.baseline ?? runs[0]?.id));
  const candidate = runs.find((run) => run.id === (selection.candidate ?? runs[1]?.id));

  return (
    <main className="dashboard">
      <Link className="back-link" href="/dashboard">Evaluation runs</Link>
      <h1>Compare runs</h1>
      <p className="demo">Sample data · Differences are illustrative.</p>
      <form className="compare-form" action="/dashboard/compare">
        <div>
          <label htmlFor="baseline">Baseline</label>
          <select id="baseline" name="baseline" defaultValue={baseline?.id}>
            {runs.map((run) => <option key={run.id} value={run.id}>{run.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="candidate">Candidate</label>
          <select id="candidate" name="candidate" defaultValue={candidate?.id}>
            {runs.map((run) => <option key={run.id} value={run.id}>{run.name}</option>)}
          </select>
        </div>
        <button className="action" type="submit">Compare</button>
      </form>
      {baseline && candidate && baseline.id !== candidate.id && baseline.datasetId === candidate.datasetId ? (
        <ComparisonResults baseline={baseline} candidate={candidate} />
      ) : <p>Select two different runs from the same dataset.</p>}
    </main>
  );
}
