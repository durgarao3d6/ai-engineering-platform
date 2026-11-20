"use server";

import { redirect } from "next/navigation";
import { listProjects, WorkspaceApiError } from "../../lib/workspace-api";
import { clearWorkspaceToken, setWorkspaceToken } from "../../lib/workspace-session";

export async function signIn(_previousError: string, formData: FormData): Promise<string> {
  const token = formData.get("token")?.toString().trim();
  if (!token || !/^[A-Za-z0-9._~+/-]{1,1024}={0,2}$/.test(token)) {
    return "Enter a valid workspace access token.";
  }

  try {
    await listProjects(token);
  } catch (error) {
    if (error instanceof WorkspaceApiError && error.status === 401) {
      return "This access token is invalid or has expired.";
    }
    return "The workspace API is unavailable. Try again shortly.";
  }

  await setWorkspaceToken(token);
  redirect("/workspace");
}

export async function signOut() {
  await clearWorkspaceToken();
  redirect("/workspace");
}
