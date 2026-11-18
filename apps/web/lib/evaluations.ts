export type Check = {
  name: string;
  passed: boolean;
  summary: string;
};

export type EvaluationRun = {
  id: string;
  name: string;
  datasetId: string;
  durationMs: number;
  estimatedCostUsd: number;
  checks: Check[];
  trace: string[];
};

export const sampleRuns: EvaluationRun[] = [
  {
    id: "checkout-baseline",
    name: "Checkout baseline",
    datasetId: "checkout-v1",
    durationMs: 12400,
    estimatedCostUsd: 0.024,
    checks: [
      { name: "Apply valid coupon", passed: true, summary: "The run applied a 10% discount." },
      { name: "Reject expired coupon", passed: false, summary: "The run accepted an expired coupon." },
      { name: "Preserve shipping total", passed: true, summary: "The shipping total stayed unchanged." },
    ],
    trace: ["Loaded checkout-v1 cases", "Applied baseline configuration", "Recorded one failed check"],
  },
  {
    id: "checkout-candidate",
    name: "Checkout candidate",
    datasetId: "checkout-v1",
    durationMs: 9800,
    estimatedCostUsd: 0.021,
    checks: [
      { name: "Apply valid coupon", passed: true, summary: "The run applied a 10% discount." },
      { name: "Reject expired coupon", passed: true, summary: "The run rejected the expired coupon." },
      { name: "Preserve shipping total", passed: true, summary: "The shipping total stayed unchanged." },
    ],
    trace: ["Loaded checkout-v1 cases", "Applied candidate configuration", "Recorded three passed checks"],
  },
];

export function getRunMetrics(run: EvaluationRun) {
  const passed = run.checks.filter((check) => check.passed).length;
  return {
    passed,
    total: run.checks.length,
    passRate: run.checks.length ? Math.round(100 * passed / run.checks.length) : null,
  };
}

export function formatDuration(durationMs: number) {
  return `${(durationMs / 1000).toFixed(1)} s`;
}

export function formatCost(estimatedCostUsd: number) {
  return `$${estimatedCostUsd.toFixed(3)}`;
}
