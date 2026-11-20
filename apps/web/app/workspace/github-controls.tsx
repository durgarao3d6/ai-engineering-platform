"use client";

import { useState } from "react";
import { signIn as oauthSignIn, signOut as oauthSignOut } from "next-auth/react";
import { prepareGitHubSignIn, signOut } from "./actions";

export function GitHubSignIn() {
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);

  return (
    <>
      <button className="action" disabled={pending} onClick={async () => {
        setError(false);
        setPending(true);
        try {
          await prepareGitHubSignIn();
          await oauthSignIn("github", { callbackUrl: "/workspace" });
        } catch {
          setError(true);
        } finally {
          setPending(false);
        }
      }}>
        {pending ? "Opening GitHub…" : "Continue with GitHub"}
      </button>
      {error && <p className="workspace-error" role="alert">GitHub sign-in could not start. Try again shortly.</p>}
    </>
  );
}

export function WorkspaceSignOut({ github }: { github: boolean }) {
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);

  if (!github) return <form action={signOut}><button className="workspace-button">Sign out</button></form>;

  return (
    <div>
      <button className="workspace-button" disabled={pending} onClick={async () => {
        setPending(true);
        try {
          await oauthSignOut({ redirect: false });
        } catch {
          setError(true);
          setPending(false);
          return;
        }
        await signOut();
      }}>
        {pending ? "Signing out…" : "Sign out"}
      </button>
      {error && <p className="workspace-error" role="alert">Sign-out failed. Try again shortly.</p>}
    </div>
  );
}
