import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import {
  ANALYSIS_DIR_SEGMENTS,
  ANALYSIS_SOURCE_LABEL,
  ENV_REPO_ROOT,
  buildAnalysisFilename,
  titleToSlug,
  type SaveAnalysisParams,
  type SaveAnalysisResult,
} from './core/index.js';

export function getRepoRoot(): string {
  return resolve(process.env[ENV_REPO_ROOT] ?? process.cwd());
}

export async function saveAnalysis(
  params: SaveAnalysisParams,
): Promise<SaveAnalysisResult> {
  try {
    const repoRoot = getRepoRoot();
    const dir = join(repoRoot, ...ANALYSIS_DIR_SEGMENTS);
    await mkdir(dir, { recursive: true });

    const slug = titleToSlug(params.title);
    const baseName = buildAnalysisFilename(params.mode, slug, params.dateUtc);
    const basePath = join(dir, baseName);

    let filePath = basePath;
    if (existsSync(filePath)) {
      const stem = baseName.replace(/\.md$/, '');
      let suffix = 2;
      while (existsSync(filePath)) {
        filePath = join(dir, `${stem}-${suffix}.md`);
        suffix += 1;
      }
    }

    const header = `# QE analysis — ${params.title}

- **Mode:** ${params.mode}
- **Generated:** ${params.dateUtc} (UTC)
- **Source:** ${ANALYSIS_SOURCE_LABEL}

`;

    await writeFile(filePath, header + params.body, 'utf8');

    const relativePath = filePath.slice(repoRoot.length + 1);
    return { relativePath };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('saveAnalysis failed:', message);
    return { error: message };
  }
}
