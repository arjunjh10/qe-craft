import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import {
  buildInitPlan,
  discoverSkillTargets,
  executeInit,
  formatMcpJsonSnippet,
  getPackageRoot,
  parseInitArgs,
} from './init.js';

describe('parseInitArgs', () => {
  it('parses --project, --force, and --dry-run', () => {
    const opts = parseInitArgs(['--project', '/tmp/my-repo', '--force', '--dry-run']);
    assert.equal(opts.project, '/tmp/my-repo');
    assert.equal(opts.force, true);
    assert.equal(opts.dryRun, true);
  });
});

describe('discoverSkillTargets', () => {
  it('finds six skills excluding shared/', async () => {
    const root = getPackageRoot();
    const targets = await discoverSkillTargets(root, { dryRun: false, force: false });
    const names = targets.map((t) => t.skillName).sort();
    assert.ok(names.includes('qe-analysis'));
    assert.ok(names.includes('qe-refinement'));
    assert.ok(names.includes('qe-uat-gate'));
    assert.equal(targets.length, 6);
  });
});

describe('buildInitPlan and executeInit', () => {
  let projectDir: string;

  before(async () => {
    projectDir = await mkdtemp(join(tmpdir(), 'qe-init-test-'));
  });

  after(async () => {
    await rm(projectDir, { recursive: true, force: true });
  });

  it('installs all bundled skills into project directory', async () => {
    const plan = await buildInitPlan({
      dryRun: false,
      force: true,
      project: projectDir,
    });
    await executeInit(plan, { dryRun: false, force: true, project: projectDir });

    const refinement = plan.targets.find((t) => t.skillName === 'qe-refinement');
    assert.ok(refinement);
    const content = await readFile(refinement.destSkillPath, 'utf8');
    assert.ok(content.includes('qe_intel_refinement'));
  });

  it('refuses overwrite without --force', async () => {
    const plan = await buildInitPlan({
      dryRun: false,
      force: true,
      project: projectDir,
    });
    await assert.rejects(
      () => executeInit(plan, { dryRun: false, force: false, project: projectDir }),
      /Skill already exists/,
    );
  });
});

describe('formatMcpJsonSnippet', () => {
  it('includes npx and REPO_ROOT placeholder', () => {
    const snippet = formatMcpJsonSnippet('/my/repo');
    assert.ok(snippet.includes('"qe-intel"'));
    assert.ok(snippet.includes('qe-intel-mcp@latest'));
    assert.ok(snippet.includes('"/my/repo"'));
  });
});

describe('getPackageRoot', () => {
  it('resolves to package directory containing skills/', () => {
    const root = getPackageRoot();
    assert.ok(root.endsWith('qe-intel-mcp'));
  });
});
