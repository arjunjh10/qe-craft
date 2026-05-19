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
  type SaveArtifactKind,
  type SaveArtifactsParams,
} from './core/index.js';
import { renderReportHtml } from './report-renderer.js';

const ARTIFACT_EXTENSIONS: Record<SaveArtifactKind, string> = {
  markdown: '.md',
  json: '.json',
  html: '.html',
  raw: '.raw.txt',
};

const ARTIFACT_EXTENSIONS_LIST = Object.values(ARTIFACT_EXTENSIONS);

export function getRepoRoot(): string {
  return resolve(process.env[ENV_REPO_ROOT] ?? process.cwd());
}

function artifactExists(dir: string, stem: string, ext: string): boolean {
  return existsSync(join(dir, `${stem}${ext}`));
}

function anyArtifactExists(dir: string, stem: string): boolean {
  return ARTIFACT_EXTENSIONS_LIST.some((ext) =>
    artifactExists(dir, stem, ext),
  );
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

export type SaveArtifactsResult =
  | { stem: string; paths: Partial<Record<SaveArtifactKind, string>> }
  | { error: string };

/** Write one or more artifacts sharing the same collision-resolved stem. */
export async function saveArtifacts(
  params: SaveArtifactsParams,
): Promise<SaveArtifactsResult> {
  try {
    const { dir, baseStem } = buildArtifactPaths(params);
    const stem = resolveAvailableStem(dir, baseStem);
    const paths: Partial<Record<SaveArtifactKind, string>> = {};

    for (const entry of params.entries) {
      const ext = ARTIFACT_EXTENSIONS[entry.kind];
      paths[entry.kind] = await writeArtifact(dir, stem, ext, entry.content);
    }

    return { stem, paths };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('saveArtifacts failed:', message);
    return { error: message };
  }
}

export async function saveAnalysis(
  params: SaveAnalysisParams,
): Promise<SaveAnalysisResult> {
  const header = `# QE analysis — ${params.title}

- **Mode:** ${params.mode}
- **Generated:** ${params.dateUtc} (UTC)
- **Source:** ${ANALYSIS_SOURCE_LABEL}

`;

  const result = await saveArtifacts({
    mode: params.mode,
    title: params.title,
    dateUtc: params.dateUtc,
    entries: [{ kind: 'markdown', content: header + params.body }],
  });

  if ('error' in result) {
    return { error: result.error };
  }

  const relativePath = result.paths.markdown;
  if (!relativePath) {
    return { error: 'markdown path missing after save' };
  }
  return { relativePath };
}

export async function saveRawFailure(params: {
  mode: SaveAnalysisParams['mode'];
  title: string;
  dateUtc: string;
  rawText: string;
}): Promise<SaveAnalysisResult> {
  const result = await saveArtifacts({
    mode: params.mode,
    title: params.title,
    dateUtc: params.dateUtc,
    entries: [{ kind: 'raw', content: params.rawText }],
  });

  if ('error' in result) {
    return { error: result.error };
  }

  const relativePath = result.paths.raw;
  if (!relativePath) {
    return { error: 'raw path missing after save' };
  }
  return { relativePath };
}

export type SaveReportEnvelopeResult =
  | { stem: string; jsonPath: string; htmlPath: string }
  | { error: string };

export async function saveReportEnvelope(params: {
  mode: SaveAnalysisParams['mode'];
  title: string;
  dateUtc: string;
  envelope: QeReportEnvelope;
}): Promise<SaveReportEnvelopeResult> {
  const jsonContent = `${JSON.stringify(params.envelope, null, 2)}\n`;
  const htmlContent = renderReportHtml(params.envelope);

  const result = await saveArtifacts({
    mode: params.mode,
    title: params.title,
    dateUtc: params.dateUtc,
    entries: [
      { kind: 'json', content: jsonContent },
      { kind: 'html', content: htmlContent },
    ],
  });

  if ('error' in result) {
    return { error: result.error };
  }

  const jsonPath = result.paths.json;
  const htmlPath = result.paths.html;
  if (!jsonPath || !htmlPath) {
    return { error: 'json or html path missing after save' };
  }

  return { stem: result.stem, jsonPath, htmlPath };
}
