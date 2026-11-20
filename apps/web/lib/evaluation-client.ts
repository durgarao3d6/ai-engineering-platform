import "server-only";
import { cache } from "react";
import { z } from "zod";
import { resultsSchema, runSchema } from "./evaluation-schemas";
import { sampleRuns, type EvaluationRun } from "./evaluations";

const runId = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const sampleRunSchema = runSchema.extend({ id: runId });

function apiOrigin() {
  const configured = process.env.EVALUATION_API_URL?.trim();
  if (!configured) return null;
  const url = new URL(configured);
  if (!["https:", "http:"].includes(url.protocol) || url.origin !== configured.replace(/\/$/, "")) {
    throw new Error("EVALUATION_API_URL must be an HTTP(S) origin.");
  }
  return url.origin;
}

async function getSample<T>(
  origin: string,
  path: string,
  schema: z.ZodType<T>,
): Promise<T | null> {
  const response = await fetch(new URL(`/v1/demo/${path}`, origin), {
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Evaluation API returned ${response.status}.`);
  return z.object({ source: z.literal("sample"), data: schema }).parse(await response.json()).data;
}

async function withResults(origin: string, run: z.infer<typeof sampleRunSchema>): Promise<EvaluationRun> {
  const results = await getSample(origin, `runs/${encodeURIComponent(run.id)}/results`, resultsSchema);
  if (!results) throw new Error("Evaluation API has no results for a listed run.");
  return { ...run, ...results };
}

export const listEvaluationRuns = cache(async (): Promise<EvaluationRun[]> => {
  const origin = apiOrigin();
  if (!origin) return sampleRuns;
  const runs = await getSample(origin, "runs", z.array(sampleRunSchema));
  if (!runs) throw new Error("The development sample endpoint is unavailable.");
  return Promise.all(runs.map((run) => withResults(origin, run)));
});

export const getEvaluationRun = cache(async (id: string): Promise<EvaluationRun | null> => {
  const origin = apiOrigin();
  if (!origin) return sampleRuns.find((run) => run.id === id) ?? null;
  if (!runId.safeParse(id).success) return null;
  const run = await getSample(origin, `runs/${encodeURIComponent(id)}`, sampleRunSchema);
  return run ? withResults(origin, run) : null;
});
