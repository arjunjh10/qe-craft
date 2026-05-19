import type { QeMode } from './types.js';

export const PROMPT_VERSION = 'skill-v2-evidence-json';

export const MCP_SERVER_NAME = 'qe-refinement';
export const MCP_SERVER_VERSION = '1.0.0';

export const ANTHROPIC_MODEL = 'claude-haiku-4-5-20251001';
export const ANTHROPIC_MODEL_JSON = 'claude-sonnet-4-6';
export const ANTHROPIC_MAX_TOKENS = 4000;
export const ANTHROPIC_MAX_TOKENS_JSON = 8000;

export const EVIDENCE_CONTEXT_MAX_CHARS = 10_000;

export const ANALYSIS_DIR_SEGMENTS = ['docs', 'qe-analysis'] as const;
export const ANALYSIS_FILENAME_PREFIX = 'qe-analysis';
export const ANALYSIS_SOURCE_LABEL = 'pasted input';

export const SLUG_MIN_WORDS = 3;
export const SLUG_MAX_WORDS = 6;
export const SLUG_MAX_LENGTH = 40;
export const SLUG_DEFAULT = 'scope';

export const ENV_ANTHROPIC_API_KEY = 'ANTHROPIC_API_KEY';
export const ENV_REPO_ROOT = 'REPO_ROOT';

export const API_KEY_MISSING_MESSAGE =
  'ANTHROPIC_API_KEY is not set. Copy qe-refinement-mcp/.env.example to .env and add your key.';

export const ANTHROPIC_NO_TEXT_ERROR = 'Anthropic returned no text content';

export const CHAT_ONLY_FOOTER = '\n\n---\nChat-only mode (save_file=false).';

export function savedToFooter(relativePath: string): string {
  return `\n\n---\nSaved to: \`${relativePath}\``;
}

export function saveFailedFooter(error: string): string {
  return `\n\n---\nWarning: could not save file — ${error}`;
}

export const QE_TOOL_DEFINITIONS: ReadonlyArray<{
  name: string;
  mode: QeMode;
  description: string;
  schemaKey: 'context' | 'uat' | 'repoUat' | 'regression';
}> = [
  {
    name: 'qe_refinement',
    mode: 'REFINEMENT',
    description:
      'Senior QE backlog refinement: gaps, risks, test scenarios, and missing acceptance criteria for a feature or ticket.',
    schemaKey: 'context',
  },
  {
    name: 'qe_uat',
    mode: 'UAT',
    description:
      'Sprint UAT / release readiness review with GO/NO-GO, execution plan, and release-risk focus.',
    schemaKey: 'uat',
  },
  {
    name: 'qe_repo_uat',
    mode: 'REPO_UAT',
    description:
      'Repository-first UAT when there is no Jira ticket: scope from feature narrative, repo hints, and optional related repos.',
    schemaKey: 'repoUat',
  },
  {
    name: 'qe_bug',
    mode: 'BUG',
    description:
      'Bug triage: likely root causes, missed coverage, and regression risks.',
    schemaKey: 'context',
  },
  {
    name: 'qe_regression',
    mode: 'REGRESSION',
    description:
      'Regression impact analysis: impacted areas, priority retest targets, and automation to run.',
    schemaKey: 'regression',
  },
] as const;
