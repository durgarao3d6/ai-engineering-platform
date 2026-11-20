"use client";

import { useActionState } from "react";
import { signIn } from "./actions";

export function SignInForm({ expired }: { expired: boolean }) {
  const [error, formAction, pending] = useActionState(signIn, "");

  return (
    <form className="workspace-sign-in run-card" action={formAction}>
      <h2>Sign in</h2>
      <p>{expired ? "Your session expired. Enter a valid token to sign in again." : "Use the access token issued by your workspace administrator."}</p>
      <label htmlFor="workspace-token">Workspace access token</label>
      <input
        id="workspace-token"
        type="password"
        name="token"
        autoComplete="off"
        spellCheck={false}
        maxLength={1026}
        required
      />
      {error && <p className="workspace-error" role="alert">{error}</p>}
      <button className="action" type="submit" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}
