import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import {
  buildInitPlan,
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

describe('buildInitPlan and executeInit', () => {
  let projectDir: string;

  before(async () => {
    projectDir = await mkdtemp(join(tmpdir(), 'qe-init-test-'));
  });

  after(async () => {
    await rm(projectDir, { recursive: true, force: true });
  });

  it('targets project .cursor/skills when --project is set', async () => {
    const plan = await buildInitPlan({ dryRun: false, force: false, project: projectDir });
    assert.equal(plan.scope, 'project');
    assert.ok(plan.destSkillPath.endsWith('.cursor/skills/qe-analysis/SKILL.md'));
    assert.ok(plan.sourceSkillPath.includes(join('skills', 'qe-analysis', 'SKILL.md')));
  });

  it('installs bundled skill into project directory', async () => {
    const plan = await buildInitPlan({
      dryRun: false,
      force: true,
      project: projectDir,
    });
    await executeInit(plan, { dryRun: false, force: true, project: projectDir });

    const content = await readFile(plan.destSkillPath, 'utf8');
    assert.ok(content.includes('name: qe-analysis'));
    assert.ok(content.includes('qe_get_system_prompt'));
  });

  it('dry-run does not require --force when dest exists', async () => {
    const dryPlan = await buildInitPlan({
      dryRun: true,
      force: false,
      project: projectDir,
    });
    await executeInit(dryPlan, { dryRun: true, force: false, project: projectDir });
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
