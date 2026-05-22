import { readdir, readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { join, relative } from 'node:path';
import { ENV_REPO_ROOT } from '../core/constants.js';

const SEARCH_ROOTS = [
  'src',
  'apps',
  'packages',
  'lib',
  'api',
  'services',
  'tests',
  'test',
  'e2e',
] as const;

const MAX_HINTS = 12;
const MAX_KEYWORDS = 5;
const MAX_DEPTH = 4;

export function resolveRepoRoot(): string {
  return process.env[ENV_REPO_ROOT]?.trim() || process.cwd();
}

export function extractKeywords(feature: string, repoHints?: string): string[] {
  const fromHints =
    repoHints
      ?.split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 2 && !s.startsWith('-')) ?? [];

  const words = feature
    .toLowerCase()
    .replace(/[^a-z0-9\s/-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w));

  const unique = [...new Set([...fromHints.slice(0, 3), ...words])];
  return unique.slice(0, MAX_KEYWORDS);
}

const STOP_WORDS = new Set([
  'that',
  'this',
  'with',
  'from',
  'have',
  'will',
  'when',
  'what',
  'user',
  'want',
  'need',
  'should',
  'ticket',
  'feature',
  'story',
]);

function runRg(repoRoot: string, pattern: string): Promise<string[]> {
  return new Promise((resolve) => {
    const child = spawn(
      'rg',
      ['-l', '--max-count', '1', '-i', pattern, ...SEARCH_ROOTS],
      { cwd: repoRoot, timeout: 8000 },
    );
    const lines: string[] = [];
    let out = '';
    child.stdout?.on('data', (chunk: Buffer) => {
      out += chunk.toString();
    });
    child.on('error', () => resolve([]));
    child.on('close', (code) => {
      if (code !== 0 && !out) {
        resolve([]);
        return;
      }
      for (const line of out.split('\n')) {
        const t = line.trim();
        if (t) lines.push(t);
      }
      resolve(lines.slice(0, MAX_HINTS));
    });
  });
}

async function walkFilenameHints(
  repoRoot: string,
  keywords: string[],
): Promise<string[]> {
  const hits: string[] = [];

  async function walk(dir: string, depth: number): Promise<void> {
    if (depth > MAX_DEPTH || hits.length >= MAX_HINTS) return;
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      if (hits.length >= MAX_HINTS) return;
      if (ent.name.startsWith('.') || ent.name === 'node_modules') continue;
      const full = join(dir, ent.name);
      const rel = relative(repoRoot, full);
      if (ent.isDirectory()) {
        await walk(full, depth + 1);
      } else if (ent.isFile()) {
        const lower = ent.name.toLowerCase();
        if (
          keywords.some((k) => lower.includes(k.toLowerCase())) &&
          /\.(ts|tsx|js|jsx|py|go|java|rb|vue|md)$/.test(lower)
        ) {
          hits.push(rel);
        }
      }
    }
  }

  for (const root of SEARCH_ROOTS) {
    const p = join(repoRoot, root);
    try {
      await walk(p, 0);
    } catch {
      // root missing
    }
  }
  return hits;
}

async function readPackageWorkspaces(repoRoot: string): Promise<string[]> {
  try {
    const raw = await readFile(join(repoRoot, 'package.json'), 'utf8');
    const pkg = JSON.parse(raw) as { workspaces?: string[] | string };
    const ws = pkg.workspaces;
    if (Array.isArray(ws)) return ws.slice(0, 5).map((w) => `package workspace: ${w}`);
    if (typeof ws === 'string') return [`package workspace: ${ws}`];
  } catch {
    // no package.json
  }
  return [];
}

/** Phase 3: lightweight where-to-look hints under REPO_ROOT. */
export async function gatherWhereToLook(
  feature: string,
  repoHints?: string,
): Promise<{ repoRoot: string; hints: string[]; scanNote: string }> {
  const repoRoot = resolveRepoRoot();
  const keywords = extractKeywords(feature, repoHints);
  const hints: string[] = [];

  if (repoHints?.trim()) {
    for (const line of repoHints.split('\n')) {
      const t = line.trim().replace(/^-\s*/, '');
      if (t) hints.push(t);
    }
  }

  const workspaces = await readPackageWorkspaces(repoRoot);
  hints.push(...workspaces);

  for (const kw of keywords) {
    const rgHits = await runRg(repoRoot, kw);
    for (const h of rgHits) {
      if (!hints.includes(h)) hints.push(h);
    }
  }

  if (hints.length < 3 && keywords.length > 0) {
    const walked = await walkFilenameHints(repoRoot, keywords);
    for (const h of walked) {
      if (!hints.includes(h)) hints.push(h);
    }
  }

  const defaultRoots = SEARCH_ROOTS.filter((r) => hints.some((h) => h.startsWith(r)));
  if (defaultRoots.length === 0) {
    hints.push(
      ...SEARCH_ROOTS.slice(0, 4).map((r) => `Scan top-level \`${r}/\` if present`),
    );
  }

  const scanNote =
    hints.length > 0
      ? `Repo scan under \`${repoRoot}\` (keywords: ${keywords.join(', ') || 'none'}). Verify each path exists before citing.`
      : `Could not match keywords in \`${repoRoot}\` — ask the user for entry paths.`;

  return {
    repoRoot,
    hints: [...new Set(hints)].slice(0, MAX_HINTS),
    scanNote,
  };
}

export function formatWhereToLookSection(
  hints: string[],
  scanNote: string,
): string {
  if (hints.length === 0) {
    return `${scanNote}\n- Ask the user which module or URL owns this behaviour.`;
  }
  const bullets = hints.map((h) => `- ${h}`).join('\n');
  return `${scanNote}\n${bullets}`;
}
