import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildSystemPrompt,
  getIncludedChunkIds,
  resolvePromptContext,
} from './index.js';

/** Regression guard: markdown refinement baseline should stay bounded. */
const MARKDOWN_REFINEMENT_MAX_CHARS = 22_000;

/** JSON path includes schema excerpt — allow larger ceiling. */
const JSON_REPO_UAT_MAX_CHARS = 32_000;

describe('buildSystemPrompt', () => {
  it('markdown / REFINEMENT — omits json, repo-uat, and multi-repo chunks', () => {
    const ctx = resolvePromptContext('REFINEMENT');
    const ids = getIncludedChunkIds(ctx);

    assert.deepEqual(ids, [
      'role',
      'input-templates',
      'evidence-rules',
      'instructions',
      'deliverable',
      'output-markdown',
    ]);
    assert.ok(!ids.includes('output-json'));
    assert.ok(!ids.includes('repo-uat'));
    assert.ok(!ids.includes('multi-repo'));

    const prompt = buildSystemPrompt(ctx);
    assert.ok(prompt.includes('Output Format (STRICT) — Markdown'));
    assert.ok(!prompt.includes('Output Format (STRICT) — JSON only'));
    assert.ok(prompt.includes('Evidence over imagination'));
    assert.ok(prompt.includes('| Evidence | Confidence |'));
    assert.ok(prompt.length <= MARKDOWN_REFINEMENT_MAX_CHARS);
  });

  it('markdown / multi-repo — includes multi-repo, not json or repo-uat', () => {
    const ctx = resolvePromptContext('UAT', {
      relatedRepos: 'api-svc | API | deep | src/',
      scopeUnknown: false,
    });
    const ids = getIncludedChunkIds(ctx);

    assert.ok(ids.includes('multi-repo'));
    assert.ok(!ids.includes('output-json'));
    assert.ok(!ids.includes('repo-uat'));
  });

  it('json / REPO_UAT — includes output-json and repo-uat, not markdown', () => {
    const ctx = resolvePromptContext('REPO_UAT', { outputFormat: 'json' });
    const ids = getIncludedChunkIds(ctx);

    assert.ok(ids.includes('output-json'));
    assert.ok(ids.includes('repo-uat'));
    assert.ok(!ids.includes('output-markdown'));

    const prompt = buildSystemPrompt(ctx);
    assert.ok(prompt.includes('Return **ONLY** valid JSON'));
    assert.ok(!prompt.includes('Output Format (STRICT) — Markdown'));
    assert.ok(prompt.includes('evidence_context'));
    assert.ok(prompt.includes('coverageGaps'));
    assert.ok(prompt.includes('repoCandidates'));
    assert.ok(prompt.length <= JSON_REPO_UAT_MAX_CHARS);
  });

  it('json / multi-repo — includes output-json and multi-repo, never markdown', () => {
    const ctx = resolvePromptContext('REGRESSION', {
      outputFormat: 'json',
      relatedRepos: '- `ui-app | UI | shallow | apps/web`',
      scopeUnknown: true,
    });
    const ids = getIncludedChunkIds(ctx);

    assert.ok(ids.includes('output-json'));
    assert.ok(ids.includes('multi-repo'));
    assert.ok(!ids.includes('output-markdown'));
    assert.ok(!ids.includes('repo-uat'));

    const prompt = buildSystemPrompt(ctx);
    assert.ok(prompt.includes('Section 11 — Markdown vs JSON'));
    assert.ok(prompt.includes('repoLedger'));
  });

  it('never joins markdown and json output chunks in one prompt', () => {
    const cases = [
      resolvePromptContext('REFINEMENT'),
      resolvePromptContext('REPO_UAT', { outputFormat: 'json' }),
      resolvePromptContext('UAT', {
        outputFormat: 'json',
        relatedRepos: 'a | b',
      }),
    ];

    for (const ctx of cases) {
      const ids = getIncludedChunkIds(ctx);
      assert.equal(
        ids.includes('output-markdown') && ids.includes('output-json'),
        false,
      );
    }
  });
});
