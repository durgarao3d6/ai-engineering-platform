import Link from "next/link";
import { redirect } from "next/navigation";
import { workspaceConfigured } from "../lib/workspace-api";

export const dynamic = "force-dynamic";

const steps = [{title:'Define',description:'Version tasks and acceptance checks.'},{title:'Run',description:'Execute approved agents in isolated environments.'},{title:'Evaluate',description:'Measure correctness and failures.'},{title:'Compare',description:'Inspect baseline and candidate results.'},{title:'Approve',description:'Keep humans in control of external writes.'}];
export default function Home() {
  if (workspaceConfigured()) redirect("/workspace");

  return <main><header><span className="eyebrow">AI ENGINEERING PLATFORM · PLANNED MVP</span><h1>Trust AI-generated code through evidence, not confidence.</h1><p className="intro">Like a human engineering team, AI agents need clear tasks, tests, reviews, and approvals. We are building the evaluation layer that makes their work measurable.</p><Link className="action" href="/dashboard">Open sample dashboard</Link></header><section aria-labelledby="flow"><div className="section-heading"><h2 id="flow">How it will work</h2><span className="demo">Concept preview — not a live evaluation</span></div><div className="cards">{steps.map((step,i)=><article className="card" key={step.title}><span className="number">0{i+1}</span><h3>{step.title}</h3><p>{step.description}</p></article>)}</div></section><section className="callout"><h2>First milestone: an evaluation dashboard</h2><p>Browse sample runs, success rates, costs, and failure analysis. Real execution and agent automation come later, after isolation and permission controls are designed.</p></section><footer>Documentation-first · Human approval for sensitive actions · Open development roadmap</footer></main>
}
