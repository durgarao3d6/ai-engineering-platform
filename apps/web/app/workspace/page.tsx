import Link from "next/link";
import { listProjects, workspaceConfigured, WorkspaceApiError } from "../../lib/workspace-api";
import { getWorkspaceToken } from "../../lib/workspace-session";
import { signOut } from "./actions";
import { SignInForm } from "./sign-in-form";

export default async function WorkspacePage() {
  const configured = workspaceConfigured();
  const token = configured ? await getWorkspaceToken() : undefined;
  const projects = token ? await loadProjects(token) : null;

  return (
    <main className="dashboard workspace">
      <Link className="back-link" href="/dashboard">Sample dashboard</Link>
      <div className="workspace-heading">
        <h1>Private workspace</h1>
        {projects && <form action={signOut}><button className="workspace-button">Sign out</button></form>}
      </div>
      {!configured ? <p>Private workspace access is unavailable on this deployment.</p> :
        projects === null ? <SignInForm expired={Boolean(token)} /> :
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
