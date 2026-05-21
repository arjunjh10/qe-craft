export const PROMPT_VERSION = 'skill-v2-evidence-json';

export const MCP_SERVER_NAME = 'qe-intel';
export const MCP_SERVER_VERSION = '1.0.0';

export const EVIDENCE_CONTEXT_MAX_CHARS = 10_000;

export const ANALYSIS_DIR_SEGMENTS = ['docs', 'qe-analysis'] as const;
export const ANALYSIS_FILENAME_PREFIX = 'qe-analysis';
export const ANALYSIS_SOURCE_LABEL = 'pasted input';

export const SLUG_MIN_WORDS = 3;
export const SLUG_MAX_WORDS = 6;
export const SLUG_MAX_LENGTH = 40;
export const SLUG_DEFAULT = 'scope';

export const ENV_REPO_ROOT = 'REPO_ROOT';

export const CHAT_ONLY_FOOTER = '\n\n---\nChat-only mode (save_file=false).';

export function savedToFooter(relativePath: string): string {
  return `\n\n---\nSaved to: \`${relativePath}\``;
}

export function saveFailedFooter(error: string): string {
  return `\n\n---\nWarning: could not save file — ${error}`;
}
