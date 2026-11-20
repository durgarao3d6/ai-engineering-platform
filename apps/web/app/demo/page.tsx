import type { Metadata } from "next";
import Link from "next/link";
import Workflow from "./workflow";

export const metadata: Metadata = { title: "Evaluation workflow demo | AI Engineering Platform" };

export default function WorkflowDemo() {
  return (
    <main className="dashboard workflow">
      <nav className="workspace-nav" aria-label="Evaluation navigation">
        <Link className="back-link" href="/workspace">Private workspace</Link>
        <Link className="back-link" href="/dashboard">Sample dashboard</Link>
      </nav>
      <h1>Evaluation workflow demo</h1>
      <p className="workflow-intro">
        Run two built-in checkout implementations against the same fixtures in your browser.
        The demo uses synthetic inputs and keeps your results in this session.
      </p>
      <Workflow />
    </main>
  );
}
