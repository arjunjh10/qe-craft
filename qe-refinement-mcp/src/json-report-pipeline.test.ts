import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { buildEnvelope } from './core/parse-report.js';
import { minimalValidReport, reportToJson } from './core/test-fixtures.js';
import {
  parseValidateAndEnvelope,
  formatJsonReportFailureMessage,
} from './json-report-pipeline.js';
import { saveRawFailure } from './file-writer.js';
import { ENV_REPO_ROOT } from './core/constants.js';

describe('parseValidateAndEnvelope', () => {
  it('returns envelope with validation warnings on success', () => {
    const raw = reportToJson(minimalValidReport());
    const result = parseValidateAndEnvelope(raw, {
      evidenceContext: 'src/api/promo.ts:42 — handler',
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.envelope.reportSchemaVersion, '1.0.0');
      assert.equal(result.envelope.report.mode, 'REFINEMENT');
      assert.equal(result.envelope.validationWarnings.length, 0);
    }
  });

  it('returns errors on invalid JSON', () => {
    const result = parseValidateAndEnvelope('{ invalid', {});
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.ok(result.errors.length > 0);
    }
  });
});

describe('saveRawFailure', () => {
  let tempDir: string;
  const previousRepoRoot = process.env[ENV_REPO_ROOT];

  before(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'qe-raw-failure-'));
    process.env[ENV_REPO_ROOT] = tempDir;
  });

  after(async () => {
    if (previousRepoRoot === undefined) {
      delete process.env[ENV_REPO_ROOT];
    } else {
      process.env[ENV_REPO_ROOT] = previousRepoRoot;
    }
    await rm(tempDir, { recursive: true, force: true });
  });

  it('writes .raw.txt under docs/qe-analysis', async () => {
    const rawText = 'model output that failed validation';
    const saved = await saveRawFailure({
      mode: 'REFINEMENT',
      title: 'Promo checkout flow',
      dateUtc: '2026-05-19',
      rawText,
    });

    assert.ok('relativePath' in saved);
    assert.ok(saved.relativePath.endsWith('.raw.txt'));
    const content = await readFile(join(tempDir, saved.relativePath), 'utf8');
    assert.equal(content, rawText);
  });
});

describe('formatJsonReportFailureMessage', () => {
  it('includes errors and optional raw path', () => {
    const msg = formatJsonReportFailureMessage(
      ['generated: required'],
      'docs/qe-analysis/qe-analysis-REFINEMENT-promo-2026-05-19.raw.txt',
    );
    assert.ok(msg.includes('JSON report validation failed'));
    assert.ok(msg.includes('generated: required'));
    assert.ok(msg.includes('.raw.txt'));
  });
});

describe('buildEnvelope integration', () => {
  it('never includes validationWarnings in model JSON parse path', () => {
    const envelope = buildEnvelope(minimalValidReport(), ['server warning']);
    const serialized = JSON.stringify(envelope);
    assert.ok(serialized.includes('validationWarnings'));
    assert.ok(serialized.includes('reportSchemaVersion'));
  });
});
