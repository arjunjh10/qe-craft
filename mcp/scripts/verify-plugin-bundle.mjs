/**
 * Validate plugin/ bundle structure, manifests, and skill sync integrity.
 * Invoked by build:plugin and npm run verify:plugin.
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const KEBAB_NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---/;
const SHARED_DIR = 'shared';
const FORBIDDEN_SKILL_STRINGS = ['Cursor only'];

export function verifyPluginBundle({
  repoRoot,
  mcpRoot = join(repoRoot, 'mcp'),
  pluginRoot = join(repoRoot, 'plugin'),
} = {}) {
  const errors = [];

  if (!repoRoot) {
    throw new Error('verifyPluginBundle requires repoRoot');
  }

  const pkg = JSON.parse(readFileSync(join(mcpRoot, 'package.json'), 'utf8'));
  const expectedVersion = pkg.version;

  for (const manifestRel of ['.cursor-plugin/plugin.json', '.claude-plugin/plugin.json']) {
    const manifestPath = join(pluginRoot, manifestRel);
    let manifest;
    try {
      manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    } catch (err) {
      errors.push(`${manifestRel}: ${err.message}`);
      continue;
    }
    if (manifest.name !== 'qe-craft') {
      errors.push(`${manifestRel}: name must be "qe-craft", got "${manifest.name}"`);
    }
    if (!KEBAB_NAME.test(manifest.name ?? '')) {
      errors.push(`${manifestRel}: name must be kebab-case`);
    }
    if (manifest.version !== expectedVersion) {
      errors.push(
        `${manifestRel}: version ${manifest.version} !== mcp/package.json ${expectedVersion}`,
      );
    }
  }

  for (const mcpFile of ['mcp.json', '.mcp.json']) {
    const mcpPath = join(pluginRoot, mcpFile);
    let mcpConfig;
    try {
      mcpConfig = JSON.parse(readFileSync(mcpPath, 'utf8'));
    } catch (err) {
      errors.push(`${mcpFile}: ${err.message}`);
      continue;
    }
    const server = mcpConfig?.mcpServers?.['qe-craft'];
    if (!server) {
      errors.push(`${mcpFile}: missing mcpServers.qe-craft`);
      continue;
    }
    if (server.command !== 'npx') {
      errors.push(`${mcpFile}: command must be "npx"`);
    }
    const args = server.args ?? [];
    if (!args.some((a) => String(a).includes('@qe-craft/mcp'))) {
      errors.push(`${mcpFile}: args must reference @qe-craft/mcp`);
    }
    if (!server.env?.REPO_ROOT) {
      errors.push(`${mcpFile}: env.REPO_ROOT is required`);
    }
  }

  const readmePath = join(pluginRoot, 'README.md');
  try {
    const readme = readFileSync(readmePath, 'utf8');
    if (!readme.includes('data-handling.md')) {
      errors.push('README.md must link to docs/data-handling.md');
    }
  } catch {
    errors.push('README.md is missing');
  }

  verifySkillsSync(mcpRoot, pluginRoot, errors);
  verifySkillFrontmatter(pluginRoot, errors);

  if (errors.length > 0) {
    throw new Error(
      `Plugin bundle verification failed:\n${errors.map((e) => `  - ${e}`).join('\n')}`,
    );
  }
}

function hashTreeSync(root) {
  const digest = createHash('sha256');
  const entries = [];

  function walk(dir, prefix = '') {
    const names = readdirSync(dir).sort();
    for (const name of names) {
      const full = join(dir, name);
      const rel = prefix ? `${prefix}/${name}` : name;
      const info = statSync(full);
      if (info.isDirectory()) {
        walk(full, rel);
      } else {
        entries.push({ rel, content: readFileSync(full) });
      }
    }
  }

  walk(root);
  for (const { rel, content } of entries) {
    digest.update(rel);
    digest.update('\0');
    digest.update(content);
    digest.update('\0');
  }
  return digest.digest('hex');
}

function verifySkillsSync(mcpRoot, pluginRoot, errors) {
  const src = join(mcpRoot, 'skills');
  const dest = join(pluginRoot, 'skills');

  try {
    const srcHash = hashTreeSync(src);
    const destHash = hashTreeSync(dest);
    if (srcHash !== destHash) {
      errors.push(
        'plugin/skills is out of sync with mcp/skills — run npm run build:plugin',
      );
    }
  } catch (err) {
    errors.push(`skills sync: ${err.message}`);
  }
}

function verifySkillFrontmatter(pluginRoot, errors) {
  const skillsRoot = join(pluginRoot, 'skills');
  if (!existsSync(skillsRoot)) {
    errors.push('plugin/skills directory is missing');
    return;
  }

  let skillCount = 0;

  for (const name of readdirSync(skillsRoot)) {
    if (name === SHARED_DIR) continue;
    const skillPath = join(skillsRoot, name, 'SKILL.md');
    if (!existsSync(skillPath)) continue;

    skillCount += 1;
    const content = readFileSync(skillPath, 'utf8');

    for (const forbidden of FORBIDDEN_SKILL_STRINGS) {
      if (content.includes(forbidden)) {
        errors.push(`${name}/SKILL.md contains forbidden string "${forbidden}"`);
      }
    }

    const match = content.match(FRONTMATTER);
    if (!match) {
      errors.push(`${name}/SKILL.md missing YAML frontmatter`);
      continue;
    }
    const fm = match[1];
    const nameLine = fm.match(/^name:\s*(.+)$/m);
    const descLine = fm.match(/^description:\s*(.+)$/m);
    if (!nameLine?.[1]?.trim()) {
      errors.push(`${name}/SKILL.md frontmatter missing name`);
    }
    if (!descLine?.[1]?.trim()) {
      errors.push(`${name}/SKILL.md frontmatter missing description`);
    }
  }

  if (skillCount !== 7) {
    errors.push(`expected 7 discoverable skills, found ${skillCount}`);
  }
}

const isMain = import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
  try {
    verifyPluginBundle({ repoRoot });
    console.log('verify:plugin OK');
  } catch (err) {
    console.error(err.message ?? err);
    process.exit(1);
  }
}
