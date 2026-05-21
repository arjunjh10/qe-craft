/**
 * Writes committed v2 sample envelope JSON + tabbed HTML under docs/qe-analysis/samples/v2/.
 * Run from qe-intel-mcp after build: node scripts/write-v2-samples.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyReportGuards } from '../dist/core/validate-report.js';
import { buildEnvelope } from '../dist/core/parse-report.js';
import { renderReportHtml } from '../dist/report-renderer.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..', '..');
const outDir = join(repoRoot, 'docs', 'qe-analysis', 'samples', 'v2');

const EVIDENCE_REFINEMENT = `src/api/checkout/promo-handler.ts:42 — POST /checkout/promo validates eligibility
src/cart/promo-validator.ts:88 — atomic usage limit decrement
tests/integration/promo-concurrency.test.ts:1 — no concurrent redemption case
apps/checkout/routes.ts:18 — promo field on review step`;

const EVIDENCE_UAT = `config/feature-flags.ts:12 — checkout.promo_v2 feature flag
src/api/checkout/promo-handler.ts:42 — POST /checkout/promo validates eligibility
apps/checkout/routes.ts:18 — promo field on review step
tests/e2e/checkout-promo.spec.ts:5 — happy-path apply only`;

const DATE = '2026-05-21';

const refinementReport = {
  mode: 'REFINEMENT',
  title: 'Promo code at checkout',
  generated: DATE,
  confidence: {
    level: 'MEDIUM',
    reason: 'Sample artifact — fictional e-commerce slice; not a live codebase',
  },
  understanding: [
    'Shoppers apply a promo code on checkout review; cart service validates eligibility and returns adjusted totals before payment.',
    'Critical flow: enter code → validate → see discount → pay; invalid or expired codes must not partially apply.',
    'Order service persists promo_id and audit fields for finance reconciliation.',
  ],
  gaps: [
    { text: 'Stacking with automatic cart-level discounts — AC silent', assumed: true },
    { text: 'Partial application when only some line items qualify', assumed: false },
    { text: 'Timezone for valid_until (UTC vs store-local)', assumed: true },
  ],
  risks: [
    {
      title: 'Race — code redeemed concurrently after UI shows success',
      impact: 'P0',
      likelihood: 'Medium',
      detection: 'Hard',
      mitigation: 'Atomic decrement at validation; surface limit-exceeded before payment',
    },
    {
      title: 'Price manipulation via client-side total override',
      impact: 'P0',
      likelihood: 'Low',
      detection: 'Easy',
      mitigation: 'Server-authoritative totals only; reject mismatched payment amount',
    },
    {
      title: 'Stale cart total after promo apply fails silently',
      impact: 'P1',
      likelihood: 'Medium',
      detection: 'Medium',
      mitigation: 'Invalidate cart cache on any promo mutation',
    },
  ],
  questions: [
    'Who owns promo catalog sync latency (marketing tool → cart service)?',
    'Required metric for promo_validation_failed by reason code?',
    'Rollback if over-discount — disable flag vs hotfix?',
  ],
  scenarios: [
    {
      id: '01',
      name: 'Expired code at boundary',
      exploration: 'Vary clock / valid_until ±1s; observe error copy and cart unchanged',
      evidence: {
        text: 'src/api/checkout/promo-handler.ts:42 — validation rejects expired codes',
        type: 'code',
      },
      why: 'Off-by-one timezone bugs',
      layer: 'API',
      confidence: 'HIGH',
    },
    {
      id: '02',
      name: 'Usage limit exhaustion',
      exploration: 'Two sessions same code; second validation after first payment completes',
      evidence: {
        text: 'src/cart/promo-validator.ts:88 — atomic usage limit decrement',
        type: 'code',
      },
      why: 'Concurrency on limit counter',
      layer: 'Integration',
      confidence: 'HIGH',
    },
    {
      id: '03',
      name: 'Category-restricted promo',
      exploration: 'Mixed eligible / ineligible SKUs; verify per-line vs order-level discount',
      evidence: {
        text: 'Assumed: category rules not visible in cited handlers',
        type: 'assumed',
      },
      why: 'Partial application rules',
      layer: 'UI',
      confidence: 'LOW',
    },
    {
      id: '04',
      name: 'Back navigation from payment',
      exploration: 'Apply valid promo → pay step → back → change qty → re-validate',
      evidence: {
        text: 'apps/checkout/routes.ts:18 — promo field on review step',
        type: 'code',
      },
      why: 'Stale totals / double apply',
      layer: 'UI',
      confidence: 'MEDIUM',
    },
    {
      id: '05',
      name: 'Invalid code spam',
      exploration: 'Rapid invalid attempts; rate limit and logging',
      evidence: {
        text: 'src/api/checkout/promo-handler.ts:42 — validation endpoint',
        type: 'code',
      },
      why: 'Abuse and support noise',
      layer: 'API',
      confidence: 'MEDIUM',
    },
  ],
  automation: [
    { layer: 'API', note: 'Contract tests for validation API (happy, expired, limit, ineligible SKU)' },
    { layer: 'UI', note: 'Smoke apply + remove promo; totals match API fixture' },
    { layer: 'Integration', note: 'Load test validation endpoint before peak sale' },
  ],
  nonfunctional: {
    performance: 'Validation p95 under cart SLA; cache promo rules with TTL',
    security: 'No code enumeration via distinct errors; auth on admin promo APIs',
    accessibility: 'Error announcements on apply failure; focus management on success',
    observability: 'Structured logs with promo_id, reason, cart_id (no PII in message)',
  },
  modeOutput: {
    content:
      'REFINEMENT: Missing AC on stacking, partial eligibility, idempotency on navigation, finance audit fields. Suggest explicit cart promo_state machine and contract tests on validation response schema.',
  },
  outOfScope: ['Mobile native checkout'],
  coverageGaps: [
    { text: 'No automated concurrency test on usage limits', reason: 'tests/integration/promo-concurrency.test.ts:1 — gap noted' },
    { text: 'E2E may not cover back-navigation from payment with promo applied' },
  ],
  repoCandidates: [],
  repoLedger: [],
};

const uatReport = {
  mode: 'UAT',
  title: 'Checkout promo flow',
  generated: DATE,
  confidence: {
    level: 'MEDIUM',
    reason: 'Sample narrative; real UAT would cite ticket + branch',
  },
  understanding: [
    'Release slice: promo code on checkout review behind feature flag checkout.promo_v2.',
    'Users validate codes, see adjusted totals, complete payment; finance receives promo_id on order.',
    'Existing coverage: API contract tests for validation; one Playwright happy apply path.',
  ],
  gaps: [
    { text: 'Flag default in production vs staging for UAT window', assumed: true },
    { text: 'Rollback plan if over-discount: flag off only vs purge in-flight carts', assumed: false },
  ],
  risks: [
    {
      title: 'Payment amount ≠ server total after promo apply',
      impact: 'P0',
      likelihood: 'Low',
      detection: 'Easy',
      mitigation: 'Block pay until server confirms total hash',
    },
    {
      title: 'Partial flag rollout leaves CDN-cached checkout JS on old bundle',
      impact: 'P1',
      likelihood: 'Medium',
      detection: 'Hard',
      mitigation: 'Versioned asset URL; verify cache headers in UAT',
    },
  ],
  questions: [
    'GO criteria: all P0 scenarios green in staging + one prod smoke at 1%?',
    'Who signs finance reconciliation spot-check?',
  ],
  scenarios: [
    {
      id: '01',
      name: 'Flag off',
      exploration: 'Load checkout with flag disabled; confirm legacy path unchanged',
      evidence: {
        text: 'config/feature-flags.ts:12 — checkout.promo_v2 feature flag',
        type: 'code',
      },
      why: 'Safe rollback surface',
      layer: 'UI',
      confidence: 'HIGH',
    },
    {
      id: '02',
      name: 'Flag on — happy path',
      exploration: 'Valid code, test card pay; compare order promo_id in admin',
      evidence: {
        text: 'tests/e2e/checkout-promo.spec.ts:5 — happy-path apply only',
        type: 'code',
      },
      why: 'End-to-end release proof',
      layer: 'UI',
      confidence: 'HIGH',
    },
    {
      id: '03',
      name: 'Flag on — invalid code',
      exploration: 'Error UX and cart total unchanged',
      evidence: {
        text: 'src/api/checkout/promo-handler.ts:42 — POST /checkout/promo validates eligibility',
        type: 'code',
      },
      why: 'Regression on silent failure',
      layer: 'UI',
      confidence: 'MEDIUM',
    },
    {
      id: '04',
      name: 'Staging → prod config drift',
      exploration: 'Compare validation API base URL and promo rule version',
      evidence: {
        text: 'Assumed: staging mirrors prod promo catalog within 15 minutes',
        type: 'assumed',
      },
      why: 'Environment parity',
      layer: 'Integration',
      confidence: 'LOW',
    },
  ],
  automation: [
    { layer: 'UI', note: 'Add Playwright invalid code + back-navigation before prod smoke' },
    { layer: 'API', note: 'Nightly contract suite against staging promo rules export' },
  ],
  nonfunctional: {
    performance: 'Validation p95 within 200ms under UAT load script',
    security: 'N/A',
    accessibility: 'N/A',
    observability: 'Dashboard for promo_validation_failed rate during UAT week',
  },
  modeOutput: {
    content:
      'UAT execution plan: (1) flag-off sanity, (2) API contract suite in staging, (3) exploratory rows 2–4 timeboxed, (4) prod smoke at 1%. Release risks: CDN cache, concurrent limits, payment total mismatch.',
  },
  outOfScope: ['Finance ledger reconciliation automation'],
  coverageGaps: [
    { text: 'Exploratory rows 3–4 not in CI today' },
    { text: 'No automated flag-off regression in pipeline' },
  ],
  goNoGo: {
    decision: 'CONDITIONAL GO',
    reason:
      'Proceed if P0 happy path passes in staging and observability dashboard is wired; defer prod % until finance spot-check signed',
  },
  repoCandidates: [],
  repoLedger: [],
};

function stem(mode, title) {
  const slug = title
    .toLowerCase()
    .replace(/[^\x00-\x7F]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 0)
    .slice(0, 6)
    .join('-');
  return `qe-analysis-${mode}-${slug}-${DATE}`;
}

async function writeSample({ report, evidenceContext, mode, title }) {
  const ctx = {
    evidenceContext,
    existingCoverage:
      mode === 'UAT'
        ? 'API contract tests for validation; one Playwright path for happy apply'
        : undefined,
  };
  const { report: guarded, validationWarnings } = applyReportGuards(report, ctx);
  const envelope = buildEnvelope(guarded, validationWarnings);
  const base = stem(mode, title);
  await mkdir(outDir, { recursive: true });
  const jsonPath = join(outDir, `${base}.json`);
  const htmlPath = join(outDir, `${base}.html`);
  await writeFile(jsonPath, `${JSON.stringify(envelope, null, 2)}\n`, 'utf8');
  await writeFile(htmlPath, renderReportHtml(envelope), 'utf8');
  console.log(`Wrote ${jsonPath}`);
  console.log(`Wrote ${htmlPath}`);
  if (validationWarnings.length) {
    console.log(`  warnings: ${validationWarnings.join('; ')}`);
  }
}

await writeSample({
  report: refinementReport,
  evidenceContext: EVIDENCE_REFINEMENT,
  mode: 'REFINEMENT',
  title: refinementReport.title,
});
await writeSample({
  report: uatReport,
  evidenceContext: EVIDENCE_UAT,
  mode: 'UAT',
  title: uatReport.title,
});
