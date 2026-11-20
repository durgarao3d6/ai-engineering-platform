"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition } from "react";

export default function WorkspaceError({ reset }: { reset: () => void }) {
  const router = useRouter();

  return (
    <main className="dashboard workspace">
      <Link className="back-link" href="/dashboard">Sample dashboard</Link>
      <h1>Private workspace</h1>
      <p role="alert">The workspace could not be loaded. Try again shortly.</p>
      <button className="action" onClick={() => startTransition(() => { router.refresh(); reset(); })}>
        Try again
      </button>
    </main>
  );
}
