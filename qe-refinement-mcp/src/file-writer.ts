import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import {
  ANALYSIS_DIR_SEGMENTS,
  ANALYSIS_SOURCE_LABEL,
  ENV_REPO_ROOT,
  buildArtifactStem,
  titleToSlug,
  type QeReportEnvelope,
  type SaveAnalysisParams,
  type SaveAnalysisResult,
} from './core/index.js';

const ARTIFACT_EXTENSIONS = ['.md', '.json', '.html', '.raw.txt'] as const;

export function getRepoRoot(): string {
  return resolve(process.env[ENV_REPO_ROOT] ?? process.cwd());
}

function artifactExists(dir: string, stem: string, ext: string): boolean {
  return existsSync(join(dir, `${stem}${ext}`));
}

function anyArtifactExists(dir: string, stem: string): boolean {
  return ARTIFACT_EXTENSIONS.some((ext) => artifactExists(dir, stem, ext));
}

/** Resolve a collision-free stem shared by sibling artifact extensions. */
export function resolveAvailableStem(
  dir: string,
  baseStem: string,
): string {
  if (!anyArtifactExists(dir, baseStem)) {
    return baseStem;
  }

  let suffix = 2;
  while (anyArtifactExists(dir, `${baseStem}-${suffix}`)) {
    suffix += 1;
  }
  return `${baseStem}-${suffix}`;
}

export function buildArtifactPaths(params: {
  mode: SaveAnalysisParams['mode'];
  title: string;
  dateUtc: string;
}): { dir: string; baseStem: string } {
  const repoRoot = getRepoRoot();
  const dir = join(repoRoot, ...ANALYSIS_DIR_SEGMENTS);
  const slug = titleToSlug(params.title);
  const baseStem = buildArtifactStem(params.mode, slug, params.dateUtc);
  return { dir, baseStem };
}

async function writeArtifact(
  dir: string,
  stem: string,
  ext: string,
  content: string,
): Promise<string> {
  await mkdir(dir, { recursive: true });
  const filePath = join(dir, `${stem}${ext}`);
  await writeFile(filePath, content, 'utf8');
  const repoRoot = getRepoRoot();
  return filePath.slice(repoRoot.length + 1);
}

export async function saveAnalysis(
  params: SaveAnalysisParams,
): Promise<SaveAnalysisResult> {
  try {
    const { dir, baseStem } = buildArtifactPaths(params);
    const stem = resolveAvailableStem(dir, baseStem);

    const header = `# QE analysis — ${params.title}

- **Mode:** ${params.mode}
- **Generated:** ${params.dateUtc} (UTC)
- **Source:** ${ANALYSIS_SOURCE_LABEL}

`;

    const relativePath = await writeArtifact(
      dir,
      stem,
      '.md',
      header + params.body,
    );
    return { relativePath };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('saveAnalysis failed:', message);
    return { error: message };
  }
}

export async function saveRawFailure(params: {
  mode: SaveAnalysisParams['mode'];
  title: string;
  dateUtc: string;
  rawText: string;
}): Promise<SaveAnalysisResult> {
  try {
    const { dir, baseStem } = buildArtifactPaths(params);
    const stem = resolveAvailableStem(dir, baseStem);
    const relativePath = await writeArtifact(
      dir,
      stem,
      '.raw.txt',
      params.rawText,
    );
    return { relativePath };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('saveRawFailure failed:', message);
    return { error: message };
  }
}

export async function saveReportEnvelope(params: {
  mode: SaveAnalysisParams['mode'];
  title: string;
  dateUtc: string;
  envelope: QeReportEnvelope;
}): Promise<SaveAnalysisResult & { stem?: string }> {
  try {
    const { dir, baseStem } = buildArtifactPaths(params);
    const stem = resolveAvailableStem(dir, baseStem);
    const relativePath = await writeArtifact(
      dir,
      stem,
      '.json',
      `${JSON.stringify(params.envelope, null, 2)}\n`,
    );
    return { relativePath, stem };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('saveReportEnvelope failed:', message);
    return { error: message };
  }
}
