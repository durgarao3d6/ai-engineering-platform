import "server-only";

import { cookies } from "next/headers";

const sessionCookie = "workspace_session";
const cookieOptions = {
  path: "/workspace",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
};

export async function getWorkspaceToken() {
  return (await cookies()).get(sessionCookie)?.value;
}

export async function setWorkspaceToken(token: string) {
  (await cookies()).set(sessionCookie, token, { ...cookieOptions, maxAge: 3600 });
}

export async function clearWorkspaceToken() {
  (await cookies()).set(sessionCookie, "", { ...cookieOptions, maxAge: 0 });
}
