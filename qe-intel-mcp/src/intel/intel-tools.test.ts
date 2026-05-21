import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  handleIntelRefinement,
  handleIntelReview,
  handleIntelUat,
} from './handlers.js';
import { assessThinInput } from './thin-input.js';
import { extractKeywords } from './repo-scan.js';

function textOf(result: { content: { text?: string }[] }): string {
  return result.content[0]?.text ?? '';
}

describe('qe_intel_refinement', () => {
  it('returns run_id, coach tier, and Phase A', async () => {
    const result = await handleIntelRefinement({
      feature:
        'As a customer I want to apply a promo code at checkout so the order total reflects the discount.',
      output_tier: 'coach',
      output_format: 'markdown',
      save_file: false,
    });
    const text = textOf(result);
    assert.ok(text.includes('qe_intel_refinement'));
    assert.ok(text.includes('run_id:'));
    assert.ok(text.includes('output_tier:** coach'));
    assert.ok(text.includes('## Phase A'));
    assert.ok(text.includes('low-QE OK'));
    assert.ok(text.includes('Where to look'));
  });
});

describe('qe_intel_uat thin input', () => {
  it('flags needs_input when release missing', async () => {
    const thin = assessThinInput('UAT', { feature: 'Ship checkout promo Friday' });
    assert.equal(thin.status, 'needs_input');
    assert.ok(thin.gaps.some((g) => /RELEASE/i.test(g)));
  });

  it('includes needs_input in intel response', async () => {
    const result = await handleIntelUat({
      feature: 'Ship checkout promo',
      output_tier: 'coach',
      output_format: 'markdown',
      save_file: false,
    });
    const text = textOf(result);
    assert.ok(text.includes('needs_input'));
    assert.ok(text.includes('Phase D'));
    assert.ok(text.includes('GO'));
  });
});

describe('qe_intel_review', () => {
  it('critiques weak draft', () => {
    const result = handleIntelReview({
      mode: 'UAT',
      draft_text: 'Test the happy path with valid input.',
    });
    const text = textOf(result);
    assert.ok(text.includes('Verdict'));
    assert.ok(text.toLowerCase().includes('happy'));
  });
});

describe('extractKeywords', () => {
  it('pulls terms from feature text', () => {
    const kw = extractKeywords('checkout promo code discount payment');
    assert.ok(kw.some((k) => k.includes('checkout') || k.includes('promo')));
  });
});
