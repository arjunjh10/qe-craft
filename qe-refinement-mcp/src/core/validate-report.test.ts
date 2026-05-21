import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { applyReportGuards } from './validate-report.js';
import { minimalValidReport } from './test-fixtures.js';

describe('applyReportGuards', () => {
  it('downgrades code evidence when citation is absent from context', () => {
    const report = minimalValidReport();
    const { report: guarded, validationWarnings } = applyReportGuards(report, {
      feature: 'Promo codes at checkout',
    });

    const firstScenario = guarded.scenarios[0];
    assert.ok(firstScenario);
    assert.equal(firstScenario.evidence.type, 'assumed');
    assert.equal(firstScenario.confidence, 'MEDIUM');
    assert.ok(
      validationWarnings.some((w) => w.includes('downgraded code → assumed')),
    );
  });

  it('keeps code evidence when citation appears in evidence context', () => {
    const report = minimalValidReport();
    const { report: guarded, validationWarnings } = applyReportGuards(report, {
      evidenceContext: 'src/api/promo.ts:42 — POST /checkout/promo handler',
      feature: 'Promo codes',
    });

    const firstScenario = guarded.scenarios[0];
    assert.ok(firstScenario);
    assert.equal(firstScenario.evidence.type, 'code');
    assert.equal(firstScenario.confidence, 'HIGH');
    assert.equal(validationWarnings.length, 0);
  });

  it('drops scenarios that overlap existing_coverage', () => {
    const report = minimalValidReport({
      scenarios: [
        {
          id: '01',
          name: 'Valid promo at checkout',
          exploration: 'Apply code',
          evidence: { text: 'Assumed: UI flow', type: 'assumed' },
          why: 'Core path',
          layer: 'UI',
          confidence: 'LOW',
        },
        {
          id: '02',
          name: 'Refund after partial capture',
          exploration: 'Verify refund',
          evidence: { text: 'Assumed: refund rules', type: 'assumed' },
          why: 'Edge case',
          layer: 'API',
          confidence: 'LOW',
        },
      ],
    });

    const { report: guarded, validationWarnings } = applyReportGuards(report, {
      existingCoverage: 'Valid promo at checkout — automated E2E',
      feature: 'Checkout',
    });

    assert.equal(guarded.scenarios.length, 1);
    const remaining = guarded.scenarios[0];
    assert.ok(remaining);
    assert.equal(remaining.name, 'Refund after partial capture');
    assert.ok(guarded.droppedScenarios?.some((d) => d.reason === 'duplicate_coverage'));
    assert.ok(validationWarnings.some((w) => w.includes('overlaps existing_coverage')));
  });
});
