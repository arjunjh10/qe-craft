import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { buildEnvelope } from './core/parse-report.js';
import { ENV_REPO_ROOT } from './core/constants.js';
import type { QeReportEnvelope } from './core/report-schema.js';
import { minimalValidReport, reportToJson } from './core/test-fixtures.js';
import {
  handleGetJsonSchema,
  handleGetSystemPrompt,
  handleSaveMarkdown,
  handleSaveReport,
  handleValidateReport,
} from './deterministic-tools.js';

function extractEnvelopeFromValidateResponse(text: string): QeReportEnvelope {
  const match = text.match(/```json\n([\s\S]+?)\n```/);
  assert.ok(match, 'expected envelope JSON block in validate response');
  return JSON.parse(match[1]!) as QeReportEnvelope;
}

describe('handleGetSystemPrompt', () => {
  it('returns prompt text and chunk ids for markdown REFINEMENT', () => {
    const result = handleGetSystemPrompt({
      mode: 'REFINEMENT',
      output_format: 'markdown',
    });
    const text = result.content[0]?.text ?? '';
    assert.ok(text.includes('chunks: role, input-templates'));
    assert.ok(text.includes('Output Format (STRICT) — Markdown'));
    assert.ok(!text.includes('output-json'));
  });

  it('includes repo-uat and json chunks for REPO_UAT json', () => {
    const result = handleGetSystemPrompt({
      mode: 'REPO_UAT',
      output_format: 'json',
    });
    const text = result.content[0]?.text ?? '';
    assert.ok(text.includes('repo-uat'));
    assert.ok(text.includes('output-json'));
    assert.ok(text.includes('JSON only'));
  });
});

describe('handleGetJsonSchema', () => {
  it('returns REPORT_JSON_SCHEMA_DESCRIPTION', () => {
    const result = handleGetJsonSchema();
    const text = result.content[0]?.text ?? '';
    assert.ok(text.includes('"mode": "REFINEMENT | UAT | REPO_UAT | BUG | REGRESSION"'));
    assert.ok(text.includes('"scenarios"'));
  });
});

describe('handleValidateReport', () => {
  it('returns success summary and envelope on valid JSON', async () => {
    const raw = reportToJson(minimalValidReport());
    const result = await handleValidateReport({
      report_json: raw,
      evidence_context: 'src/api/promo.ts:42 — handler',
    });
    const text = result.content[0]?.text ?? '';
    assert.ok(text.includes('QE analysis (JSON)'));
    assert.ok(text.includes('Validated envelope'));
    assert.ok(text.includes('reportSchemaVersion'));
  });

  it('returns validation errors on invalid JSON', async () => {
    const result = await handleValidateReport({ report_json: '{ invalid' });
    const text = result.content[0]?.text ?? '';
    assert.ok(text.includes('JSON report validation failed'));
  });
});

describe('hybrid validate → save', () => {
  let tempDir: string;
  const previousRepoRoot = process.env[ENV_REPO_ROOT];

  before(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'qe-validate-save-'));
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

  it('chains qe_validate_report envelope into qe_save_report artifacts', async () => {
    const raw = reportToJson(minimalValidReport());
    const validateResult = await handleValidateReport({
      report_json: raw,
      evidence_context: 'src/api/promo.ts:42 — handler',
    });
    const validateText = validateResult.content[0]?.text ?? '';
    const envelope = extractEnvelopeFromValidateResponse(validateText);

    const saveResult = await handleSaveReport({
      envelope,
      mode: 'REFINEMENT',
      title: 'Promo checkout flow',
      save_file: true,
    });
    const saveText = saveResult.content[0]?.text ?? '';
    assert.ok(saveText.includes('.json'));
    assert.ok(saveText.includes('.html'));

    const htmlMatch = saveText.match(/`([^`]+\.html)`/);
    assert.ok(htmlMatch);
    const htmlContent = await readFile(join(tempDir, htmlMatch[1]!), 'utf8');
    assert.ok(htmlContent.includes('Checkout promo codes'));
    assert.ok(htmlContent.includes('<!DOCTYPE html>'));
  });

  it('escapes XSS payloads in saved HTML from validate → save', async () => {
    const payload = '<img src=x onerror=alert(1)>';
    const raw = reportToJson(
      minimalValidReport({
        title: payload,
        understanding: [payload],
        scenarios: [
          {
            id: '01',
            name: payload,
            exploration: payload,
            evidence: { text: 'assumed path', type: 'assumed' },
            why: payload,
            layer: 'UI',
            confidence: 'LOW',
          },
        ],
      }),
    );

    const validateResult = await handleValidateReport({ report_json: raw });
    const envelope = extractEnvelopeFromValidateResponse(
      validateResult.content[0]?.text ?? '',
    );

    const saveResult = await handleSaveReport({
      envelope,
      mode: 'REFINEMENT',
      title: 'XSS probe',
      save_file: true,
    });
    const htmlMatch = (saveResult.content[0]?.text ?? '').match(/`([^`]+\.html)`/);
    assert.ok(htmlMatch);
    const htmlContent = await readFile(join(tempDir, htmlMatch[1]!), 'utf8');

    assert.ok(!htmlContent.includes('<img src=x'));
    assert.ok(htmlContent.includes('&lt;img src=x'));
    assert.ok(!/<img\s/i.test(htmlContent));
  });

  it('writes .raw.txt on validation failure when mode and title provided', async () => {
    const invalidJson = '{ "mode": "REFINEMENT" }';
    const result = await handleValidateReport({
      report_json: invalidJson,
      mode: 'REFINEMENT',
      title: 'Broken report',
      save_file: true,
    });
    const text = result.content[0]?.text ?? '';
    assert.ok(text.includes('JSON report validation failed'));
    assert.ok(text.includes('.raw.txt'));

    const rawMatch = text.match(/`([^`]+\.raw\.txt)`/);
    assert.ok(rawMatch);
    const rawContent = await readFile(join(tempDir, rawMatch[1]!), 'utf8');
    assert.equal(rawContent.trim(), invalidJson.trim());
  });

  it('does not write .raw.txt when save_file is false', async () => {
    const result = await handleValidateReport({
      report_json: '{ invalid',
      mode: 'REFINEMENT',
      title: 'Broken report',
      save_file: false,
    });
    const text = result.content[0]?.text ?? '';
    assert.ok(text.includes('JSON report validation failed'));
    assert.ok(!text.includes('.raw.txt'));
  });

  it('does not write .raw.txt without mode and title even when save_file is true', async () => {
    const result = await handleValidateReport({
      report_json: '{ invalid',
      save_file: true,
    });
    const text = result.content[0]?.text ?? '';
    assert.ok(text.includes('JSON report validation failed'));
    assert.ok(!text.includes('.raw.txt'));
  });
});

describe('handleSaveReport', () => {
  let tempDir: string;
  const previousRepoRoot = process.env[ENV_REPO_ROOT];

  before(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'qe-save-report-'));
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

  it('writes json and html artifacts', async () => {
    const envelope = buildEnvelope(minimalValidReport(), []);
    const result = await handleSaveReport({
      envelope,
      mode: 'REFINEMENT',
      title: 'Promo checkout flow',
      save_file: true,
    });
    const text = result.content[0]?.text ?? '';
    assert.ok(text.includes('.json'));
    assert.ok(text.includes('.html'));

    const jsonMatch = text.match(/`([^`]+\.json)`/);
    assert.ok(jsonMatch);
    const jsonContent = await readFile(join(tempDir, jsonMatch[1]!), 'utf8');
    assert.ok(jsonContent.includes('reportSchemaVersion'));
  });
});

describe('handleSaveMarkdown', () => {
  let tempDir: string;
  const previousRepoRoot = process.env[ENV_REPO_ROOT];

  before(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'qe-save-md-'));
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

  it('writes markdown under docs/qe-analysis', async () => {
    const result = await handleSaveMarkdown({
      mode: 'UAT',
      title: 'Release readiness',
      body: '## 1. Understanding\n\nSample body.',
      save_file: true,
    });
    const text = result.content[0]?.text ?? '';
    assert.ok(text.includes('Saved to:'));
    const pathMatch = text.match(/`([^`]+\.md)`/);
    assert.ok(pathMatch);
    const content = await readFile(join(tempDir, pathMatch[1]!), 'utf8');
    assert.ok(content.includes('Sample body.'));
    assert.ok(content.includes('**Mode:** UAT'));
  });
});
