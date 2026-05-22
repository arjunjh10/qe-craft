import type { QeReportJson } from './report-schema.js';

export function minimalValidReport(
  overrides: Partial<QeReportJson> = {},
): QeReportJson {
  return {
    mode: 'REFINEMENT',
    title: 'Checkout promo codes',
    generated: '2026-05-19',
    confidence: { level: 'MEDIUM', reason: 'Limited ticket context' },
    understanding: ['Promo codes apply at checkout'],
    gaps: [{ text: 'Edge cases for expired codes', assumed: true }],
    risks: [
      {
        title: 'Double discount application',
        impact: 'P1',
        likelihood: 'Medium',
        detection: 'Hard',
        mitigation: 'Add integration test for stack rules',
      },
    ],
    questions: ['Can promos stack with loyalty discounts?'],
    scenarios: [
      {
        id: '01',
        name: 'Valid promo at checkout',
        exploration: 'Apply active code and verify discount',
        evidence: {
          text: 'src/api/promo.ts:42 — POST /checkout/promo',
          type: 'code',
        },
        why: 'Core revenue path',
        layer: 'API',
        confidence: 'HIGH',
      },
    ],
    automation: [{ layer: 'API', note: 'Contract test promo endpoint' }],
    nonfunctional: {
      performance: 'N/A',
      security: 'Validate promo ownership',
      accessibility: 'N/A',
      observability: 'Log promo application failures',
    },
    modeOutput: { content: 'Clarify stacking rules in AC' },
    outOfScope: ['Mobile native checkout'],
    coverageGaps: [],
    repoCandidates: [],
    repoLedger: [],
    ...overrides,
  };
}

export function reportToJson(report: QeReportJson): string {
  return JSON.stringify(report, null, 2);
}
