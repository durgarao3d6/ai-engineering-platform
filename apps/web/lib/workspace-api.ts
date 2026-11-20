import "server-only";

import { z } from "zod";
import { resultsSchema, runSchema } from "./evaluation-schemas";

const projectSchema = z.object({ id: z.uuid(), name: z.string() });
const datasetSchema = projectSchema.extend({ version: z.string() });
const workspaceRunSchema = runSchema.extend({ id: z.uuid(), datasetId: z.uuid() });

export type WorkspaceRun = z.infer<typeof workspaceRunSchema>;

export class WorkspaceApiError extends Error {
  constructor(public readonly status: number) {
    super(`Workspace API returned HTTP ${status}.`);
  }
}

export function workspaceConfigured() {
  return Boolean(process.env.WORKSPACE_API_URL?.trim());
}

function workspaceOrigin(): string {
  const configured = process.env.WORKSPACE_API_URL?.trim();
  if (!configured) throw new Error("Workspace API is unavailable.");
  const url = new URL(configured);
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  const validProtocol = url.protocol === "https:" || (loopback && url.protocol === "http:");
  if (!validProtocol || url.origin !== configured.replace(/\/$/, "")) {
    throw new Error("Configure WORKSPACE_API_URL with an HTTPS origin.");
  }
  return url.origin;
}

async function read<T>(token: string, path: string, schema: z.ZodType<T>): Promise<T> {
  const response = await fetch(new URL(path, workspaceOrigin()), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new WorkspaceApiError(response.status);
  const payload = z.object({ source: z.literal("workspace"), data: schema }).safeParse(await response.json());
  if (!payload.success) throw new Error("The workspace API returned an invalid response.");
  return payload.data.data;
}

export function listProjects(token: string) {
  return read(token, "/v1/projects", z.array(projectSchema));
}

export function listProjectDatasets(token: string, projectId: string) {
  return read(token, `/v1/projects/${encodeURIComponent(projectId)}/datasets`, z.array(datasetSchema));
}

export function listProjectRuns(token: string, projectId: string) {
  return read(token, `/v1/projects/${encodeURIComponent(projectId)}/runs`, z.array(workspaceRunSchema));
}

export function getWorkspaceResults(token: string, runId: string) {
  return read(token, `/v1/runs/${encodeURIComponent(runId)}/results`, resultsSchema);
}
