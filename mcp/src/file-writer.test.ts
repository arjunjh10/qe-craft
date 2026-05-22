import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { buildEnvelope } from './core/parse-report.js';
import { ENV_REPO_ROOT } from './core/constants.js';
import { minimalValidReport } from './core/test-fixtures.js';
import {
  buildArtifactPaths,
  resolveAvailableStem,
  saveArtifacts,
  saveReportEnvelope,
} from './file-writer.js';

describe('resolveAvailableStem', () => {
  it('returns base stem when no artifacts exist', () => {
    const dir = '/tmp/nonexistent-qe-stem-test';
    const stem = resolveAvailableStem(dir, 'qe-analysis-REFINEMENT-test-2026-05-19');
    assert.equal(stem, 'qe-analysis-REFINEMENT-test-2026-05-19');
  });
});

describe('saveArtifacts and saveReportEnvelope', () => {
  let tempDir: string;
  const previousRepoRoot = process.env[ENV_REPO_ROOT];

  before(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'qe-artifacts-'));
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

  it('writes .json and .html siblings with the same stem', async () => {
    const envelope = buildEnvelope(minimalValidReport(), []);
    const saved = await saveReportEnvelope({
      mode: 'REFINEMENT',
      title: 'Promo checkout flow',
      dateUtc: '2026-05-19',
      envelope,
    });

    assert.ok('jsonPath' in saved);
    assert.ok(saved.jsonPath.endsWith('.json'));
    assert.ok(saved.htmlPath.endsWith('.html'));
    assert.ok(saved.jsonPath.replace(/\.json$/, '') === saved.htmlPath.replace(/\.html$/, ''));

    const jsonContent = await readFile(join(tempDir, saved.jsonPath), 'utf8');
    const htmlContent = await readFile(join(tempDir, saved.htmlPath), 'utf8');
    assert.ok(jsonContent.includes('"reportSchemaVersion"'));
    assert.ok(htmlContent.includes('<!DOCTYPE html>'));
    assert.ok(htmlContent.includes('Checkout promo codes'));
  });

  it('escapes script payloads in saved HTML', async () => {
    const payload = '<script>alert("xss")</script>';
    const envelope = buildEnvelope(
      minimalValidReport({
        title: payload,
        modeOutput: { content: payload },
      }),
      [payload],
    );
    const saved = await saveReportEnvelope({
      mode: 'REFINEMENT',
      title: 'XSS save probe',
      dateUtc: '2026-05-19',
      envelope,
    });

    assert.ok('htmlPath' in saved);
    const htmlContent = await readFile(join(tempDir, saved.htmlPath), 'utf8');
    assert.ok(!htmlContent.includes('<script>alert'));
    assert.ok(htmlContent.includes('&lt;script&gt;alert'));
  });

  it('uses collision suffix on stem for all extensions', async () => {
    const { dir, baseStem } = buildArtifactPaths({
      mode: 'REFINEMENT',
      title: 'Collision test feature',
      dateUtc: '2026-05-19',
    });
    await writeFile(join(dir, `${baseStem}.md`), '# existing', 'utf8');

    const saved = await saveArtifacts({
      mode: 'REFINEMENT',
      title: 'Collision test feature',
      dateUtc: '2026-05-19',
      entries: [
        { kind: 'json', content: '{}' },
        { kind: 'html', content: '<html></html>' },
      ],
    });

    assert.ok('stem' in saved);
    assert.equal(saved.stem, `${baseStem}-2`);
    assert.ok(saved.paths.json?.includes(`${baseStem}-2.json`));
    assert.ok(saved.paths.html?.includes(`${baseStem}-2.html`));
    assert.ok(existsSync(join(dir, `${baseStem}.md`)));
    assert.ok(!existsSync(join(dir, `${baseStem}.json`)));
  });
});
