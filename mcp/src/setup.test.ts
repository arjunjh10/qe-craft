import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import {
  buildSetupPlan,
  discoverSkillTargets,
  executeSkillInstall,
  formatMcpJsonSnippet,
  formatVscodeMcpJson,
  getPackageRoot,
  parseSetupArgs,
  runInit,
  runSetup,
} from './setup.js';

describe('parseSetupArgs', () => {
  it('parses --project, --force, --dry-run, --ide, and --plugin-dir', () => {
    const opts = parseSetupArgs([
      '--project',
      '/tmp/my-repo',
      '--force',
      '--dry-run',
      '--ide',
      'vscode',
      '--plugin-dir',
      '/tmp/plugin',
    ]);
    assert.equal(opts.project, '/tmp/my-repo');
    assert.equal(opts.force, true);
    assert.equal(opts.dryRun, true);
    assert.equal(opts.ide, 'vscode');
    assert.equal(opts.pluginDir, '/tmp/plugin');
  });

  it('defaults --ide to cursor', () => {
    const opts = parseSetupArgs([]);
    assert.equal(opts.ide, 'cursor');
  });

  it('rejects unknown --ide values', () => {
    assert.throws(() => parseSetupArgs(['--ide', 'foo']), /Unknown --ide value/);
  });
});

describe('discoverSkillTargets', () => {
  it('finds seven skills excluding shared/', async () => {
    const root = getPackageRoot();
    const targets = await discoverSkillTargets(root, join('/tmp', '.cursor', 'skills'));
    const names = targets.map((t) => t.skillName).sort();
    assert.ok(names.includes('qe-analysis'));
    assert.ok(names.includes('qe-refinement'));
    assert.ok(names.includes('qe-automate'));
    assert.ok(names.includes('qe-uat-gate'));
    assert.equal(targets.length, 7);
  });
});

describe('buildSetupPlan and executeSkillInstall', () => {
  let projectDir: string;

  before(async () => {
    projectDir = await mkdtemp(join(tmpdir(), 'qe-setup-test-'));
  });

  after(async () => {
    await rm(projectDir, { recursive: true, force: true });
  });

  it('installs all bundled skills into project .cursor/skills', async () => {
    const skillsBase = join(projectDir, '.cursor', 'skills');
    const plan = await buildSetupPlan(
      { dryRun: false, force: true, project: projectDir, ide: 'cursor', ideExplicit: true },
      skillsBase,
      'project',
    );
    await executeSkillInstall(
      plan,
      { dryRun: false, force: true, project: projectDir, ide: 'cursor', ideExplicit: true },
      'cursor',
    );

    const refinement = plan.targets.find((t) => t.skillName === 'qe-refinement');
    assert.ok(refinement);
    const content = await readFile(refinement.destSkillPath, 'utf8');
    assert.ok(content.includes('qe_intel_refinement'));
  });

  it('refuses overwrite without --force', async () => {
    const skillsBase = join(projectDir, '.cursor', 'skills');
    const plan = await buildSetupPlan(
      { dryRun: false, force: true, project: projectDir, ide: 'cursor', ideExplicit: true },
      skillsBase,
      'project',
    );
    await assert.rejects(
      () =>
        executeSkillInstall(
          plan,
          { dryRun: false, force: false, project: projectDir, ide: 'cursor', ideExplicit: true },
          'cursor',
        ),
      /Skill already exists/,
    );
  });
});

describe('formatMcpJsonSnippet', () => {
  it('includes npx and REPO_ROOT placeholder', () => {
    const snippet = formatMcpJsonSnippet('/my/repo');
    assert.ok(snippet.includes('"qe-craft"'));
    assert.ok(snippet.includes('@qe-craft/mcp@latest'));
    assert.ok(snippet.includes('"/my/repo"'));
  });
});

describe('formatVscodeMcpJson', () => {
  it('uses workspaceFolder for REPO_ROOT', () => {
    const snippet = formatVscodeMcpJson();
    assert.ok(snippet.includes('${workspaceFolder}'));
    assert.ok(snippet.includes('@qe-craft/mcp@latest'));
  });
});

describe('getPackageRoot', () => {
  it('resolves to package directory containing skills/', () => {
    const root = getPackageRoot();
    assert.ok(root.endsWith('mcp'));
  });
});

describe('runSetup integration', () => {
  let projectDir: string;
  let pluginDir: string;

  before(async () => {
    projectDir = await mkdtemp(join(tmpdir(), 'qe-setup-run-'));
    pluginDir = join(projectDir, 'plugin');
  });

  after(async () => {
    await rm(projectDir, { recursive: true, force: true });
  });

  it('writes .vscode/mcp.json for --ide vscode --project', async () => {
    const code = await runSetup(['--ide', 'vscode', '--project', projectDir, '--force']);
    assert.equal(code, 0);
    const content = await readFile(join(projectDir, '.vscode', 'mcp.json'), 'utf8');
    assert.ok(content.includes('qe-craft'));
    assert.ok(content.includes('${workspaceFolder}'));
  });

  it('errors for --ide vscode without --project', async () => {
    const code = await runSetup(['--ide', 'vscode']);
    assert.equal(code, 1);
  });

  it('syncs skills into --plugin-dir', async () => {
    const code = await runSetup(['--plugin-dir', pluginDir, '--force']);
    assert.equal(code, 0);
    const skill = await readFile(join(pluginDir, 'skills', 'qe-refinement', 'SKILL.md'), 'utf8');
    assert.ok(skill.includes('qe_intel_refinement'));
    const mcp = await readFile(join(pluginDir, 'mcp.json'), 'utf8');
    assert.ok(mcp.includes('qe-craft'));
  });

  it('dry-run for --ide all writes nothing', async () => {
    const freshDir = await mkdtemp(join(tmpdir(), 'qe-setup-dry-'));
    try {
      const code = await runSetup([
        '--ide',
        'all',
        '--dry-run',
        '--project',
        freshDir,
        '--plugin-dir',
        join(freshDir, 'plugin'),
      ]);
      assert.equal(code, 0);
      await assert.rejects(() => readFile(join(freshDir, '.vscode', 'mcp.json')));
      await assert.rejects(() => readFile(join(freshDir, '.cursor', 'skills', 'qe-analysis', 'SKILL.md')));
    } finally {
      await rm(freshDir, { recursive: true, force: true });
    }
  });

  it('init alias behaves like setup --ide cursor', async () => {
    const initDir = await mkdtemp(join(tmpdir(), 'qe-init-alias-'));
    try {
      const code = await runInit(['--project', initDir, '--force']);
      assert.equal(code, 0);
      const content = await readFile(
        join(initDir, '.cursor', 'skills', 'qe-analysis', 'SKILL.md'),
        'utf8',
      );
      assert.ok(content.length > 0);
    } finally {
      await rm(initDir, { recursive: true, force: true });
    }
  });
});
