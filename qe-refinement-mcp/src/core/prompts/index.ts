import type { OutputFormat, QeMode } from '../types.js';
import { DELIVERABLE } from './deliverable.js';
import { EVIDENCE_RULES } from './evidence-rules.js';
import { INPUT_TEMPLATES } from './input-templates.js';
import { INSTRUCTIONS } from './instructions.js';
import { MULTI_REPO } from './multi-repo.js';
import { OUTPUT_JSON } from './output-json.js';
import { OUTPUT_MARKDOWN } from './output-markdown.js';
import { REPO_UAT } from './repo-uat.js';
import { ROLE } from './role.js';

const CHUNK_SEPARATOR = '\n\n---\n\n';

export const PROMPT_CHUNK_IDS = [
  'role',
  'input-templates',
  'evidence-rules',
  'instructions',
  'deliverable',
  'output-markdown',
  'output-json',
  'repo-uat',
  'multi-repo',
] as const;

export type PromptChunkId = (typeof PROMPT_CHUNK_IDS)[number];

export interface PromptContext {
  outputFormat: OutputFormat;
  mode: QeMode;
  /** Include multi-repo inference ladder and scan strategy. */
  includeMultiRepo: boolean;
  /** Include REPO_UAT repository-grounding supplement. */
  includeRepoUat: boolean;
}

export function resolvePromptContext(
  mode: QeMode,
  options: {
    outputFormat?: OutputFormat;
    relatedRepos?: string;
    scopeUnknown?: boolean;
  } = {},
): PromptContext {
  const relatedRepos = options.relatedRepos?.trim() ?? '';

  return {
    outputFormat: options.outputFormat ?? 'markdown',
    mode,
    includeMultiRepo: Boolean(options.scopeUnknown || relatedRepos),
    includeRepoUat: mode === 'REPO_UAT',
  };
}

/** Which prompt chunks are included for the given context (for tests and debugging). */
export function getIncludedChunkIds(ctx: PromptContext): PromptChunkId[] {
  const ids: PromptChunkId[] = [
    'role',
    'input-templates',
    'evidence-rules',
    'instructions',
    'deliverable',
    ctx.outputFormat === 'json' ? 'output-json' : 'output-markdown',
  ];
  if (ctx.includeRepoUat) {
    ids.push('repo-uat');
  }
  if (ctx.includeMultiRepo) {
    ids.push('multi-repo');
  }
  return ids;
}

/**
 * Assembles the system prompt from conditional chunks.
 * Never includes both output-markdown and output-json.
 */
export function buildSystemPrompt(ctx: PromptContext): string {
  const parts: string[] = [
    ROLE,
    INPUT_TEMPLATES,
    EVIDENCE_RULES,
    INSTRUCTIONS,
    DELIVERABLE,
    ctx.outputFormat === 'json' ? OUTPUT_JSON : OUTPUT_MARKDOWN,
  ];

  if (ctx.includeRepoUat) {
    parts.push(REPO_UAT);
  }
  if (ctx.includeMultiRepo) {
    parts.push(MULTI_REPO);
  }

  return parts.join(CHUNK_SEPARATOR);
}

/** @deprecated Use buildSystemPrompt(resolvePromptContext(...)) at call sites. */
export const QE_ANALYSIS_SYSTEM_PROMPT = buildSystemPrompt({
  outputFormat: 'markdown',
  mode: 'REFINEMENT',
  includeMultiRepo: true,
  includeRepoUat: true,
});
