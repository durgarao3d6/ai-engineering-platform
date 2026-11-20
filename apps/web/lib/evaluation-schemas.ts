import { z } from "zod";

export const runSchema = z.object({
  id: z.string(),
  name: z.string(),
  datasetId: z.string().min(1),
  durationMs: z.number().int().nonnegative(),
  estimatedCostUsd: z.number().nonnegative(),
});

export const resultsSchema = z.object({
  checks: z.array(z.object({ name: z.string(), passed: z.boolean(), summary: z.string() })),
  trace: z.array(z.string()),
});
