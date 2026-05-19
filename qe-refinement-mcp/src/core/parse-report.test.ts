import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildEnvelope,
  buildJsonRetryUserMessage,
  extractJson,
  parseReportJson,
} from './parse-report.js';
import { PROMPT_VERSION } from './constants.js';
import { REPORT_SCHEMA_VERSION } from './report-schema.js';
import { minimalValidReport, reportToJson } from './test-fixtures.js';

describe('extractJson', () => {
  const payload = reportToJson(minimalValidReport());

  it('returns bare JSON unchanged', () => {
    assert.equal(extractJson(payload), payload);
  });

  it('strips ```json fences', () => {
    const wrapped = '```json\n' + payload + '\n```';
    assert.equal(extractJson(wrapped), payload);
  });

  it('extracts object from preamble text', () => {
    const withPreamble = `Here is the report:\n${payload}\nThanks.`;
    assert.equal(extractJson(withPreamble), payload);
  });
});

describe('parseReportJson', () => {
  it('parses valid report JSON', () => {
    const result = parseReportJson(reportToJson(minimalValidReport()));
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.report.mode, 'REFINEMENT');
      assert.equal(result.report.scenarios.length, 1);
    }
  });

  it('returns Zod errors for invalid shape', () => {
    const invalid = JSON.stringify({ mode: 'REFINEMENT', title: 'x' });
    const result = parseReportJson(invalid);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.ok(result.errors.length > 0);
      assert.ok(result.errors.some((e) => e.includes('generated')));
    }
  });

  it('returns parse error for non-JSON', () => {
    const result = parseReportJson('not json at all');
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.ok(result.errors[0].startsWith('JSON parse error:'));
    }
  });
});

describe('buildEnvelope', () => {
  it('wraps report with schema and prompt version', () => {
    const report = minimalValidReport();
    const envelope = buildEnvelope(report, ['warning one']);
    assert.equal(envelope.reportSchemaVersion, REPORT_SCHEMA_VERSION);
    assert.equal(envelope.promptVersion, PROMPT_VERSION);
    assert.deepEqual(envelope.validationWarnings, ['warning one']);
    assert.equal(envelope.report.title, report.title);
  });
});

describe('buildJsonRetryUserMessage', () => {
  it('includes original message, errors, and invalid output', () => {
    const msg = buildJsonRetryUserMessage(
      'MODE: REFINEMENT',
      '{ bad }',
      ['(root): required'],
    );
    assert.ok(msg.includes('MODE: REFINEMENT'));
    assert.ok(msg.includes('corrected JSON only'));
    assert.ok(msg.includes('(root): required'));
    assert.ok(msg.includes('{ bad }'));
  });
});
