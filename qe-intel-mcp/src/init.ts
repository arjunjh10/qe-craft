import { copyFile, mkdir, readdir, readFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROMPT_VERSION } from './core/constants.js';

const SKILL_FILE = 'SKILL.md';
const SHARED_DIR = 'shared';

export type InitOptions = {
  dryRun: boolean;
  force: boolean;
  project?: string;
};

export type SkillInstallTarget = {
  skillName: string;
  sourceSkillPath: string;
  destSkillPath: string;
};

export type InitPlan = {
  targets: SkillInstallTarget[];
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

export async function discoverSkillTargets(
  packageRoot: string,
  options: InitOptions,
): Promise<SkillInstallTarget[]> {
  const skillsRoot = join(packageRoot, 'skills');
  const entries = await readdir(skillsRoot, { withFileTypes: true });
  const targets: SkillInstallTarget[] = [];

  const skillsBase = options.project
    ? join(options.project, '.cursor', 'skills')
    : join(homedir(), '.cursor', 'skills');

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

export async function buildInitPlan(options: InitOptions): Promise<InitPlan> {
  const packageRoot = getPackageRoot();
  const targets = await discoverSkillTargets(packageRoot, options);

  let packageVersion = 'unknown';
  try {
    const raw = await readFile(join(packageRoot, 'package.json'), 'utf8');
    const pkg = JSON.parse(raw) as { version?: string };
    packageVersion = pkg.version ?? 'unknown';
  } catch {
    // keep unknown
  }

  return {
    targets,
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
    "qe-intel": {
      "command": "npx",
      "args": ["-y", "qe-intel-mcp@latest"],
      "env": {
        "REPO_ROOT": "${repoRootPlaceholder}"
      }
    }
  }
}`;
}

export async function executeInit(plan: InitPlan, options: InitOptions): Promise<void> {
  for (const target of plan.targets) {
    if (!(await pathExists(target.sourceSkillPath))) {
      throw new Error(
        `Bundled skill not found at ${target.sourceSkillPath}. Reinstall qe-intel-mcp.`,
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
    console.log('[dry-run] Would install QE Intel skills:');
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

export function printInitSuccess(plan: InitPlan): void {
  const repoHint =
    plan.scope === 'project' ? plan.project! : '/absolute/path/to/your/target-repo';

  console.log(`Installed ${plan.targets.length} QE Intel skills (${plan.scope})`);
  console.log(`  package: qe-intel-mcp@${plan.packageVersion}`);
  console.log(`  prompt:  ${plan.promptVersion}`);
  for (const t of plan.targets) {
    console.log(`  - ${t.skillName} → ${t.destSkillPath}`);
  }
  console.log('');
  console.log('Next steps:');
  console.log('  1. Add MCP to ~/.cursor/mcp.json (or project .cursor/mcp.json):');
  console.log('');
  console.log(formatMcpJsonSnippet(repoHint));
  console.log('');
  console.log('  2. Restart Cursor.');
  console.log('  3. In chat, describe your QE task — agent calls qe_intel_* (e.g. qe_intel_refinement).');
  console.log('     Coach output in chat is the default; save artifacts only when asked.');
}

export function printInitHelp(): void {
  console.log(`qe-intel-mcp init — install QE Intel Cursor skills from this package

Usage:
  npx qe-intel-mcp init [options]

Options:
  --project <path>  Install into <path>/.cursor/skills/<skill-name>/ (team repos)
  --force           Overwrite existing SKILL.md files
  --dry-run         Print paths only; do not write files
  -h, --help        Show this help

Installs: qe-analysis (router), qe-refinement, qe-uat-gate, qe-repo-charter, qe-incident, qe-regression-impact

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
