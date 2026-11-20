import Link from "next/link";
import { listProjects, workspaceConfigured, WorkspaceApiError } from "../../lib/workspace-api";
import { getWorkspaceCredentials } from "../../lib/workspace-session";
import { githubLoginConfigured } from "../../lib/workspace-login";
import { GitHubSignIn, WorkspaceSignOut } from "./github-controls";
import { SignInForm } from "./sign-in-form";

export default async function WorkspacePage({ searchParams }: {
  searchParams: Promise<{ error?: string }>;
}) {
  const configured = workspaceConfigured();
  const github = githubLoginConfigured();
  const credentials = configured ? await getWorkspaceCredentials() : undefined;
  const projects = credentials ? await loadProjects(credentials.token) : null;
  const { error } = await searchParams;
  const unlinked = credentials?.method === "github" && projects === null;

  return (
    <main className="dashboard workspace">
      <nav className="workspace-nav" aria-label="Workspace navigation">
        <Link className="back-link" href="/dashboard">Sample dashboard</Link>
        <Link className="back-link" href="/demo">Run workflow demo</Link>
      </nav>
      <div className="workspace-heading">
        <h1>Private workspace</h1>
        {credentials && <WorkspaceSignOut github={github} />}
      </div>
      {!configured ? <p>Private workspace access is unavailable on this deployment.</p> :
        projects === null ? (
          github ? (
            <>
              <section className="run-card workspace-sign-in">
                <h2>Sign in to review your projects</h2>
                <p>{unlinked ? "This GitHub account has no linked workspace. Ask your workspace administrator to link it." : "Use the GitHub account linked to your workspace."}</p>
                {error && <p className="workspace-error" role="alert">GitHub sign-in did not complete. Try again.</p>}
                <GitHubSignIn />
              </section>
              <details className="workspace-section">
                <summary>Use an access token</summary>
                <SignInForm expired={credentials?.method === "token"} />
              </details>
            </>
          ) : <SignInForm expired={Boolean(credentials)} />
        ) :
        projects.length === 0 ? <p>Your account has no projects yet.</p> : (
          <ul className="run-grid" aria-label="Workspace projects">
            {projects.map((project) => (
              <li className="run-card" key={project.id}>
                <h2><Link prefetch={false} className="back-link" href={`/workspace/projects/${project.id}`}>{project.name}</Link></h2>
              </li>
            ))}
          </ul>
        )}
    </main>
  );
}

async function loadProjects(token: string) {
  try {
    return await listProjects(token);
  } catch (error) {
    if (error instanceof WorkspaceApiError && error.status === 401) return null;
    throw error;
  }
}
