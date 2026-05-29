import { copyFile, mkdir, readdir, readFile, writeFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROMPT_VERSION } from './core/constants.js';

const SKILL_FILE = 'SKILL.md';
const SHARED_DIR = 'shared';

export const VALID_IDES = ['cursor', 'claude', 'vscode', 'all'] as const;
export type IdeTarget = (typeof VALID_IDES)[number];

export type SetupOptions = {
  dryRun: boolean;
  force: boolean;
  project?: string;
  ide: IdeTarget;
  ideExplicit: boolean;
  pluginDir?: string;
};

/** @deprecated Use SetupOptions */
export type InitOptions = SetupOptions;

export type SkillInstallTarget = {
  skillName: string;
  sourceSkillPath: string;
  destSkillPath: string;
};

export type SetupPlan = {
  targets: SkillInstallTarget[];
  scope: 'global' | 'project' | 'plugin';
  project?: string;
  pluginDir?: string;
  packageVersion: string;
  promptVersion: string;
};

/** @deprecated Use SetupPlan */
export type InitPlan = SetupPlan;

export function getPackageRoot(): string {
  return join(dirname(fileURLToPath(import.meta.url)), '..');
}

function parseIdeValue(value: string): IdeTarget {
  if ((VALID_IDES as readonly string[]).includes(value)) {
    return value as IdeTarget;
  }
  throw new Error(
    `Unknown --ide value: ${value}\nValid values: ${VALID_IDES.join(', ')}`,
  );
}

export function parseSetupArgs(argv: string[]): SetupOptions {
  const options: SetupOptions = {
    dryRun: false,
    force: false,
    ide: 'cursor',
    ideExplicit: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--force') {
      options.force = true;
    } else if (arg === '--project') {
      const value = argv[i + 1];
      if (!value || value.startsWith('-')) {
        throw new Error('--project requires an absolute or relative path');
      }
      options.project = resolve(value);
      i += 1;
    } else if (arg === '--ide') {
      const value = argv[i + 1];
      if (!value || value.startsWith('-')) {
        throw new Error('--ide requires one of: cursor, claude, vscode, all');
      }
      options.ide = parseIdeValue(value);
      options.ideExplicit = true;
      i += 1;
    } else if (arg === '--plugin-dir') {
      const value = argv[i + 1];
      if (!value || value.startsWith('-')) {
        throw new Error('--plugin-dir requires an absolute or relative path');
      }
      options.pluginDir = resolve(value);
      i += 1;
    } else if (arg === '--help' || arg === '-h') {
      printSetupHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown setup option: ${arg}`);
    }
  }

  return options;
}

/** @deprecated Use parseSetupArgs */
export const parseInitArgs = parseSetupArgs;

function resolveCursorSkillsBase(options: SetupOptions): string {
  return options.project
    ? join(options.project, '.cursor', 'skills')
    : join(homedir(), '.cursor', 'skills');
}

function resolvePluginSkillsBase(pluginDir: string): string {
  return join(pluginDir, 'skills');
}

export async function discoverSkillTargets(
  packageRoot: string,
  skillsBase: string,
): Promise<SkillInstallTarget[]> {
  const skillsRoot = join(packageRoot, 'skills');
  const entries = await readdir(skillsRoot, { withFileTypes: true });
  const targets: SkillInstallTarget[] = [];

  for (const ent of entries) {
    if (!ent.isDirectory() || ent.name === SHARED_DIR) continue;
    const sourceSkillPath = join(skillsRoot, ent.name, SKILL_FILE);
    try {
      await access(sourceSkillPath, constants.F_OK);
    } catch {
      continue;
    }
    targets.push({
      skillName: ent.name,
      sourceSkillPath,
      destSkillPath: join(skillsBase, ent.name, SKILL_FILE),
    });
  }

  targets.sort((a, b) => a.skillName.localeCompare(b.skillName));
  if (targets.length === 0) {
    throw new Error(`No skills found under ${skillsRoot}`);
  }
  return targets;
}

async function readPackageVersion(packageRoot: string): Promise<string> {
  try {
    const raw = await readFile(join(packageRoot, 'package.json'), 'utf8');
    const pkg = JSON.parse(raw) as { version?: string };
    return pkg.version ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

export async function buildSetupPlan(
  options: SetupOptions,
  skillsBase: string,
  scope: SetupPlan['scope'],
): Promise<SetupPlan> {
  const packageRoot = getPackageRoot();
  const targets = await discoverSkillTargets(packageRoot, skillsBase);

  return {
    targets,
    scope,
    project: options.project,
    pluginDir: options.pluginDir,
    packageVersion: await readPackageVersion(packageRoot),
    promptVersion: PROMPT_VERSION,
  };
}

/** @deprecated Use buildSetupPlan */
export async function buildInitPlan(options: SetupOptions): Promise<SetupPlan> {
  return buildSetupPlan(options, resolveCursorSkillsBase(options), options.project ? 'project' : 'global');
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export function formatMcpJsonSnippet(
  repoRootPlaceholder = '/absolute/path/to/your/target-repo',
): string {
  return `{
  "mcpServers": {
    "qe-craft": {
      "command": "npx",
      "args": ["-y", "@qe-craft/mcp@latest"],
      "env": {
        "REPO_ROOT": "${repoRootPlaceholder}"
      }
    }
  }
}`;
}

export function formatVscodeMcpJson(): string {
  return `{
  "mcpServers": {
    "qe-craft": {
      "command": "npx",
      "args": ["-y", "@qe-craft/mcp@latest"],
      "env": {
        "REPO_ROOT": "\${workspaceFolder}"
      }
    }
  }
}`;
}

export async function executeSkillInstall(
  plan: SetupPlan,
  options: SetupOptions,
  label: string,
): Promise<void> {
  for (const target of plan.targets) {
    if (!(await pathExists(target.sourceSkillPath))) {
      throw new Error(
        `Bundled skill not found at ${target.sourceSkillPath}. Reinstall @qe-craft/mcp.`,
      );
    }

    const destExists = await pathExists(target.destSkillPath);

    if (destExists && !options.force && !options.dryRun) {
      throw new Error(
        `Skill already exists: ${target.destSkillPath}\nRe-run with --force to overwrite, or use --dry-run to preview.`,
      );
    }
  }

  if (options.dryRun) {
    console.log(`[dry-run] Would install QE Craft skills (${label}):`);
    for (const target of plan.targets) {
      console.log(`  ${target.skillName}`);
      console.log(`    from: ${target.sourceSkillPath}`);
      console.log(`    to:   ${target.destSkillPath}`);
    }
    console.log(`  scope: ${plan.scope}`);
    return;
  }

  for (const target of plan.targets) {
    await mkdir(dirname(target.destSkillPath), { recursive: true });
    await copyFile(target.sourceSkillPath, target.destSkillPath);
  }
}

/** @deprecated Use executeSkillInstall */
export async function executeInit(plan: SetupPlan, options: SetupOptions): Promise<void> {
  return executeSkillInstall(plan, options, 'cursor');
}

async function setupCursor(options: SetupOptions): Promise<void> {
  const plan = await buildSetupPlan(
    options,
    resolveCursorSkillsBase(options),
    options.project ? 'project' : 'global',
  );
  await executeSkillInstall(plan, options, 'cursor');
  if (!options.dryRun) {
    printCursorSuccess(plan);
  } else {
    printCursorDryRun(plan);
  }
}

function printCursorDryRun(plan: SetupPlan): void {
  console.log('');
  console.log('Cursor MCP snippet (add manually after install):');
  console.log('');
  console.log(
    formatMcpJsonSnippet(
      plan.scope === 'project' ? plan.project! : '/absolute/path/to/your/target-repo',
    ),
  );
}

function printCursorSuccess(plan: SetupPlan): void {
  const repoHint =
    plan.scope === 'project' ? plan.project! : '/absolute/path/to/your/target-repo';

  console.log(`Installed ${plan.targets.length} QE Craft skills (${plan.scope}, cursor)`);
  console.log(`  package: @qe-craft/mcp@${plan.packageVersion}`);
  console.log(`  prompt:  ${plan.promptVersion}`);
  for (const t of plan.targets) {
    console.log(`  - ${t.skillName} → ${t.destSkillPath}`);
  }
  console.log('');
  console.log('Next steps (Cursor):');
  console.log('  1. Add MCP to ~/.cursor/mcp.json (or project .cursor/mcp.json):');
  console.log('');
  console.log(formatMcpJsonSnippet(repoHint));
  console.log('');
  console.log('  2. Reload Cursor and enable the qe-craft MCP server.');
  console.log('  3. Prefer the Cursor Marketplace plugin when available; setup is for power users.');
  console.log('  4. In chat, describe your QE task — agent calls qe_intel_* (e.g. qe_intel_refinement).');
}

async function setupPluginDir(options: SetupOptions): Promise<void> {
  const pluginDir = options.pluginDir!;
  const plan = await buildSetupPlan(options, resolvePluginSkillsBase(pluginDir), 'plugin');
  await executeSkillInstall(plan, options, 'plugin-dir');
  const mcpJsonPath = join(pluginDir, 'mcp.json');

  if (options.dryRun) {
    console.log(`[dry-run] Would ensure ${mcpJsonPath} (skip if exists without --force)`);
    return;
  }

  const mcpExists = await pathExists(mcpJsonPath);
  if (mcpExists && !options.force) {
    console.log(`  plugin: kept existing ${mcpJsonPath}`);
    return;
  }

  await mkdir(pluginDir, { recursive: true });
  await writeFile(mcpJsonPath, `${formatVscodeMcpJson()}\n`, 'utf8');
  console.log(`  plugin: wrote ${mcpJsonPath}`);
}

async function setupClaude(options: SetupOptions): Promise<void> {
  if (options.pluginDir) {
    return;
  }

  console.log('');
  console.log('Claude Code — install the QE Craft plugin (skills + MCP bundled):');
  console.log('  • Marketplace: https://claude.ai/settings/plugins');
  console.log('  • Local test:  claude --plugin-dir ./plugin');
  console.log('  • Dev sync:    qe-craft-mcp setup --plugin-dir ./plugin');
  console.log('');
  console.log('Skills are namespaced at runtime, e.g. /qe-craft:qe-refinement.');
}

async function setupVscode(options: SetupOptions): Promise<void> {
  if (!options.project) {
    throw new Error(
      '--ide vscode requires --project <path> so .vscode/mcp.json is written under your repo',
    );
  }

  const destPath = join(options.project, '.vscode', 'mcp.json');

  if (!options.dryRun && (await pathExists(destPath)) && !options.force) {
    throw new Error(
      `MCP config already exists: ${destPath}\nRe-run with --force to overwrite, or use --dry-run to preview.`,
    );
  }

  if (options.dryRun) {
    console.log('[dry-run] Would write VS Code MCP config:');
    console.log(`  to: ${destPath}`);
    console.log('');
    console.log(formatVscodeMcpJson());
    return;
  }

  await mkdir(dirname(destPath), { recursive: true });
  await writeFile(destPath, `${formatVscodeMcpJson()}\n`, 'utf8');
  console.log(`Wrote VS Code MCP config → ${destPath}`);
  console.log('  Reload VS Code / enable MCP; set REPO_ROOT if workspace ≠ target repo.');
}

function resolveIdes(options: SetupOptions): IdeTarget[] {
  if (options.ide === 'all') {
    return ['cursor', 'claude', 'vscode'];
  }
  return [options.ide];
}

export function printSetupHelp(): void {
  console.log(`@qe-craft/mcp setup — install QE Craft skills and MCP config for your IDE

Usage:
  npx @qe-craft/mcp setup [options]

Options:
  --ide <target>      cursor (default), claude, vscode, or all
  --project <path>    Project root (required for --ide vscode; optional for cursor project install)
  --plugin-dir <path> Sync skills (+ mcp.json) into a plugin directory for local dev
  --force             Overwrite existing SKILL.md or mcp.json files
  --dry-run           Print paths only; do not write files
  -h, --help          Show this help

Installs: qe-analysis (router), qe-refinement, qe-uat-gate, qe-repo-charter, qe-incident, qe-regression-impact, qe-automate

Primary install path: Cursor or Claude marketplace plugin. setup is for power users and contributors.

Legacy alias: npx @qe-craft/mcp init (same as setup --ide cursor)
`);
}

export async function runSetup(argv: string[]): Promise<number> {
  try {
    const options = parseSetupArgs(argv);

    if (options.pluginDir) {
      await setupPluginDir(options);
    }

    const runIdes = options.ideExplicit || !options.pluginDir;
    if (runIdes) {
      for (const ide of resolveIdes(options)) {
        if (ide === 'cursor') {
          await setupCursor(options);
        } else if (ide === 'claude') {
          await setupClaude(options);
        } else if (ide === 'vscode') {
          await setupVscode(options);
        }
      }
    }

    return 0;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`setup failed: ${message}`);
    return 1;
  }
}

/** @deprecated Use runSetup — init defaults to --ide cursor */
export async function runInit(argv: string[]): Promise<number> {
  return runSetup(argv);
}

/** @deprecated Use printSetupHelp */
export const printInitHelp = printSetupHelp;

/** @deprecated Use printCursorSuccess */
export const printInitSuccess = printCursorSuccess;
