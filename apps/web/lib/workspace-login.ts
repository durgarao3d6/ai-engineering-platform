import "server-only";

import { createHmac } from "node:crypto";
import { getServerSession, type NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";

const githubIdPattern = /^[1-9][0-9]{0,14}$/;

export function githubLoginConfigured() {
  return Boolean(
    process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET &&
    process.env.NEXTAUTH_URL && Buffer.byteLength(process.env.NEXTAUTH_SECRET ?? "") >= 32 &&
    Buffer.byteLength(process.env.WORKSPACE_LOGIN_SIGNING_KEY ?? "") >= 32,
  );
}

export function workspaceAuthOptions(): NextAuthOptions {
  return {
    secret: process.env.NEXTAUTH_SECRET,
    providers: [
      GitHubProvider({
        clientId: process.env.GITHUB_CLIENT_ID ?? "",
        clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
        authorization: { params: { scope: "read:user" } },
        userinfo: "https://api.github.com/user",
        checks: ["pkce", "state"],
      }),
    ],
    pages: { signIn: "/workspace", error: "/workspace" },
    session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
    callbacks: {
      async jwt({ token, account }) {
        if (account?.provider === "github" && githubIdPattern.test(account.providerAccountId)) {
          token.githubUserId = account.providerAccountId;
        }
        return token;
      },
      async session({ session, token }) {
        return { expires: session.expires, githubUserId: token.githubUserId };
      },
    },
  };
}

export async function getGithubWorkspaceAssertion() {
  if (!githubLoginConfigured()) return undefined;
  const session = await getServerSession(workspaceAuthOptions());
  const githubId = session && "githubUserId" in session ? session.githubUserId : undefined;
  if (typeof githubId !== "string" || !githubIdPattern.test(githubId)) return undefined;

  const payload = `github-v1.${githubId}.${Math.floor(Date.now() / 1000) + 60}`;
  const signature = createHmac("sha256", process.env.WORKSPACE_LOGIN_SIGNING_KEY!)
    .update(payload)
    .digest("hex");
  return `${payload}.${signature}`;
}
