"use client";

import { useRouter } from "next/navigation";
import { startTransition } from "react";

export default function ErrorPage({ reset }: { reset: () => void }) {
  const router = useRouter();

  function retry() {
    startTransition(() => {
      router.refresh();
      reset();
    });
  }

  return (
    <main className="dashboard">
      <h1>Evaluation runs</h1>
      <p role="alert">The evaluation runs could not be loaded.</p>
      <button className="action" onClick={retry}>Try again</button>
    </main>
  );
}
