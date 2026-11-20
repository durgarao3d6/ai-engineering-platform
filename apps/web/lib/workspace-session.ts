import "server-only";

import { cookies } from "next/headers";
import { getGithubWorkspaceAssertion } from "./workspace-login";

const sessionCookie = "workspace_session";
const cookieOptions = {
  path: "/workspace",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
};

export async function getWorkspaceCredentials() {
  const manual = (await cookies()).get(sessionCookie)?.value;
  if (manual) return { token: manual, method: "token" as const };

  const github = await getGithubWorkspaceAssertion();
  if (github) return { token: github, method: "github" as const };
}

export async function setWorkspaceToken(token: string) {
  (await cookies()).set(sessionCookie, token, { ...cookieOptions, maxAge: 3600 });
}

export async function clearWorkspaceToken() {
  (await cookies()).set(sessionCookie, "", { ...cookieOptions, maxAge: 0 });
}
