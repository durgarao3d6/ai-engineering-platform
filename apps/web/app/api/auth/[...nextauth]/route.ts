import NextAuth from "next-auth";
import { githubLoginConfigured, workspaceAuthOptions } from "../../../../lib/workspace-login";

const handler: (request: Request, context: unknown) => Promise<Response> = NextAuth(workspaceAuthOptions());

function auth(request: Request, context: unknown) {
  if (!githubLoginConfigured()) return new Response(null, { status: 404 });
  return handler(request, context);
}

export { auth as GET, auth as POST };
