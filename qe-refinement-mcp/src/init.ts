import { copyFile, mkdir, readFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROMPT_VERSION } from './core/constants.js';

const SKILL_DIR_NAME = 'qe-analysis';
const SKILL_FILE = 'SKILL.md';

export type InitOptions = {
  dryRun: boolean;
  force: boolean;
  project?: string;
};

export type InitPlan = {
  sourceSkillPath: string;
  destSkillPath: string;
  scope: 'global' | 'project';
  project?: string;
  packageVersion: string;
  promptVersion: string;
};

export function getPackageRoot(): string {
  return join(dirname(fileURLToPath(import.meta.url)), '..');
}

export function parseInitArgs(argv: string[]): InitOptions {
  const options: InitOptions = { dryRun: false, force: false };

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
    } else if (arg === '--help' || arg === '-h') {
      printInitHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown init option: ${arg}`);
    }
  }

  return options;
}

export async function buildInitPlan(options: InitOptions): Promise<InitPlan> {
  const packageRoot = getPackageRoot();
  const sourceSkillPath = join(packageRoot, 'skills', SKILL_DIR_NAME, SKILL_FILE);

  const destSkillPath = options.project
    ? join(options.project, '.cursor', 'skills', SKILL_DIR_NAME, SKILL_FILE)
    : join(homedir(), '.cursor', 'skills', SKILL_DIR_NAME, SKILL_FILE);

  let packageVersion = 'unknown';
  try {
    const raw = await readFile(join(packageRoot, 'package.json'), 'utf8');
    const pkg = JSON.parse(raw) as { version?: string };
    packageVersion = pkg.version ?? 'unknown';
  } catch {
    // keep unknown
  }

  return {
    sourceSkillPath,
    destSkillPath,
    scope: options.project ? 'project' : 'global',
    project: options.project,
    packageVersion,
    promptVersion: PROMPT_VERSION,
  };
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export function formatMcpJsonSnippet(repoRootPlaceholder = '/absolute/path/to/your/target-repo'): string {
  return `{
  "mcpServers": {
    "qe-refinement": {
      "command": "npx",
      "args": ["-y", "qe-refinement-mcp@latest"],
      "env": {
        "REPO_ROOT": "${repoRootPlaceholder}"
      }
    }
  }
}`;
}

export async function executeInit(plan: InitPlan, options: InitOptions): Promise<void> {
  if (!(await pathExists(plan.sourceSkillPath))) {
    throw new Error(
      `Bundled skill not found at ${plan.sourceSkillPath}. Reinstall qe-refinement-mcp.`,
    );
  }

  const destExists = await pathExists(plan.destSkillPath);

  if (destExists && !options.force && !options.dryRun) {
    throw new Error(
      `Skill already exists: ${plan.destSkillPath}\nRe-run with --force to overwrite, or use --dry-run to preview.`,
    );
  }

  if (options.dryRun) {
    console.log('[dry-run] Would install qe-analysis skill:');
    console.log(`  from: ${plan.sourceSkillPath}`);
    console.log(`  to:   ${plan.destSkillPath}`);
    console.log(`  scope: ${plan.scope}`);
    return;
  }

  await mkdir(dirname(plan.destSkillPath), { recursive: true });
  await copyFile(plan.sourceSkillPath, plan.destSkillPath);
}

export function printInitSuccess(plan: InitPlan): void {
  const repoHint =
    plan.scope === 'project' ? plan.project! : '/absolute/path/to/your/target-repo';

  console.log(`Installed qe-analysis skill (${plan.scope})`);
  console.log(`  package: qe-refinement-mcp@${plan.packageVersion}`);
  console.log(`  prompt:  ${plan.promptVersion}`);
  console.log(`  path:    ${plan.destSkillPath}`);
  console.log('');
  console.log('Next steps:');
  console.log('  1. Add MCP to ~/.cursor/mcp.json (or project .cursor/mcp.json):');
  console.log('');
  console.log(formatMcpJsonSnippet(repoHint));
  console.log('');
  console.log('  2. Restart Cursor.');
  console.log('  3. In chat, paste a MODE / FEATURE block (see skill) — the agent should');
  console.log('     follow the runbook and call qe_get_system_prompt, qe_validate_report,');
  console.log('     qe_save_report when output_format=json.');
}

export function printInitHelp(): void {
  console.log(`qe-refinement-mcp init — install the qe-analysis Cursor skill from this package

Usage:
  npx qe-refinement-mcp init [options]

Options:
  --project <path>  Install into <path>/.cursor/skills/qe-analysis/ (team repos)
  --force           Overwrite existing SKILL.md
  --dry-run         Print paths only; do not write files
  -h, --help        Show this help

Global default (no --project): ~/.cursor/skills/qe-analysis/SKILL.md

Does not edit mcp.json — copy the snippet printed after a successful install.
`);
}

export async function runInit(argv: string[]): Promise<number> {
  try {
    const options = parseInitArgs(argv);
    const plan = await buildInitPlan(options);
    await executeInit(plan, options);
    if (!options.dryRun) {
      printInitSuccess(plan);
    } else {
      console.log('');
      console.log('MCP snippet (add manually after install):');
      console.log('');
      console.log(
        formatMcpJsonSnippet(
          plan.scope === 'project' ? plan.project! : '/absolute/path/to/your/target-repo',
        ),
      );
    }
    return 0;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`init failed: ${message}`);
    return 1;
  }
}
