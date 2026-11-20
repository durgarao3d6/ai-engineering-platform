import type { Metadata } from "next";
import Link from "next/link";
import { reviewContext } from "./benchmark";
import Workflow from "./workflow";

export const metadata: Metadata = { title: "Coding review demo | AI Engineering Platform" };

export default function WorkflowDemo() {
  return (
    <main className="dashboard workflow">
      <nav className="workspace-nav" aria-label="Evaluation navigation">
        <Link className="back-link" href="/workspace">Private workspace</Link>
        <Link className="back-link" href="/dashboard">Sample dashboard</Link>
      </nav>
      <h1>Review a coding change</h1>
      <p className="workflow-intro">
        Decide whether a coupon-validation fix meets its acceptance checks.
        This example runs in your browser using a built-in patch and synthetic checkout inputs.
      </p>
      <section className="workflow-panel run-card" aria-labelledby="pull-request-heading">
        <h2 id="pull-request-heading">Example PR #{reviewContext.pullRequest} · {reviewContext.title}</h2>
        <p>
          The checkout service applies expired coupons. The proposed patch changes
          the eligibility check. Review the patch and use the evaluation below to
          confirm the fix preserves valid discounts.
        </p>
        <figure className="workflow-patch">
          <figcaption>{reviewContext.file}</figcaption>
          <pre tabIndex={0} aria-label="Proposed checkout patch"><code>
            {"function shouldApplyCoupon(coupon: Coupon) {\n"}
            <span className="workspace-error">{"- return coupon === 'valid' || coupon === 'expired';\n"}</span>
            <span className="workflow-pass">{"+ return coupon === 'valid';\n"}</span>
            {"}"}
          </code></pre>
        </figure>
      </section>
      <Workflow />
    </main>
  );
}
