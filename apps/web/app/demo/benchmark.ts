export const reviewContext = {
  repository: "Example checkout service",
  pullRequest: 42,
  file: "src/checkout/coupon.ts",
  title: "Reject expired coupons at checkout",
} as const;

export const configurations = {
  "checkout-v1": "Checkout v1 · baseline",
  "checkout-v2": "Checkout v2 · validate expiration",
} as const;

export type Configuration = keyof typeof configurations;
type Coupon = "valid" | "expired" | "none";

export const fixtures = [
  { id: "valid-coupon", name: "Apply a valid coupon", coupon: "valid", subtotal: 100, discount: 10, expected: 90 },
  { id: "expired-coupon", name: "Reject an expired coupon", coupon: "expired", subtotal: 100, discount: 10, expected: 100 },
  { id: "no-coupon", name: "Keep the total without a coupon", coupon: "none", subtotal: 100, discount: 0, expected: 100 },
] as const;

export type Fixture = {
  id: string;
  name: string;
  coupon: Coupon;
  subtotalCents: number;
  discountPercent: number;
  expectedCents: number;
};

export type Definition = {
  version: number;
  review: typeof reviewContext;
  name: string;
  objective: string;
  fixtures: Fixture[];
  baseline: Configuration;
  candidate: Configuration;
};

export type CaseResult = {
  id: string;
  actualCents: number;
  passed: boolean;
  detail: string;
};

export type BenchmarkRun = {
  configuration: Configuration;
  durationMs: number;
  cases: CaseResult[];
};

export type EvaluationReport = {
  definition: Definition;
  completedAt: string;
  baseline: BenchmarkRun;
  candidate: BenchmarkRun;
};

function evaluate(definition: Definition, configuration: Configuration): BenchmarkRun {
  const start = performance.now();
  const cases = definition.fixtures.map((fixture) => {
    // The baseline applies any supplied coupon. The candidate checks expiration.
    const applies = fixture.coupon === "valid" ||
      (fixture.coupon === "expired" && configuration === "checkout-v1");
    const discount = applies
      ? Math.round(fixture.subtotalCents * fixture.discountPercent / 100)
      : 0;
    const actualCents = fixture.subtotalCents - discount;
    return {
      id: fixture.id,
      actualCents,
      passed: actualCents === fixture.expectedCents,
      detail: applies
        ? `Applied a ${fixture.discountPercent}% coupon to the subtotal.`
        : fixture.coupon === "expired" ? "Rejected the expired coupon." : "No coupon was supplied.",
    };
  });
  return { configuration, durationMs: performance.now() - start, cases };
}

export function evaluateDefinition(definition: Definition): EvaluationReport {
  const baseline = evaluate(definition, definition.baseline);
  const candidate = evaluate(definition, definition.candidate);
  return { definition, completedAt: new Date().toISOString(), baseline, candidate };
}
