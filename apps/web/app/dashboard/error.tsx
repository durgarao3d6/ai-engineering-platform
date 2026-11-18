"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="dashboard">
      <h1>Evaluation runs</h1>
      <p role="alert">The evaluation runs could not be loaded.</p>
      <button className="action" onClick={reset}>Try again</button>
    </main>
  );
}
