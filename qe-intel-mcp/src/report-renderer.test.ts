import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildEnvelope } from './core/parse-report.js';
import { minimalValidReport } from './core/test-fixtures.js';
import { escapeHtml, renderReportHtml } from './report-renderer.js';

describe('escapeHtml', () => {
  it('escapes HTML special characters', () => {
    const input = '<script>alert("xss")</script> & \' "';
    const escaped = escapeHtml(input);
    assert.ok(!escaped.includes('<script>'));
    assert.ok(escaped.includes('&lt;script&gt;'));
    assert.ok(escaped.includes('&amp;'));
    assert.ok(escaped.includes('&quot;'));
    assert.ok(escaped.includes('&#39;'));
  });
});

describe('renderReportHtml', () => {
  it('escapes XSS payloads in report fields', () => {
    const payload = '<img src=x onerror=alert(1)>';
    const envelope = buildEnvelope(
      minimalValidReport({
        title: payload,
        understanding: [payload],
        modeOutput: { content: payload },
      }),
      ['<script>warning</script>'],
    );

    const html = renderReportHtml(envelope);
    assert.ok(!html.includes('<img src=x'));
    assert.ok(html.includes('&lt;img src=x'));
    assert.ok(!html.includes('<script>warning</script>'));
    assert.ok(html.includes('&lt;script&gt;warning&lt;/script&gt;'));
  });

  it('includes validation warning banner and tablist', () => {
    const envelope = buildEnvelope(minimalValidReport(), ['evidence downgraded']);
    const html = renderReportHtml(envelope);

    assert.ok(html.includes('role="alert"'));
    assert.ok(html.includes('evidence downgraded'));
    assert.ok(html.includes('role="tablist"'));
    assert.ok(html.includes('role="tabpanel"'));
    assert.ok(html.includes('Overview'));
    assert.ok(html.includes('Scenarios'));
  });

  it('adds multi-repo tab when ledger present', () => {
    const envelope = buildEnvelope(
      minimalValidReport({
        repoLedger: [
          {
            repo: 'checkout-api',
            role: 'API',
            scopeCertainty: 'confirmed',
            requestedDepth: 'deep',
            status: 'scanned',
            evidenceOrReason: 'grep handlers',
          },
        ],
      }),
      [],
    );

    const html = renderReportHtml(envelope);
    assert.ok(html.includes('Multi-repo'));
    assert.ok(html.includes('checkout-api'));
  });
});
