import {
  ANALYSIS_FILENAME_PREFIX,
  SLUG_DEFAULT,
  SLUG_MAX_LENGTH,
  SLUG_MAX_WORDS,
  SLUG_MIN_WORDS,
} from './constants.js';
import type { QeMode, QeRelease, QeToolInputs } from './types.js';

function section(label: string, body: string | undefined): string {
  if (!body?.trim()) return '';
  return `${label}\n${body.trim()}\n`;
}

function formatRelease(release: QeRelease | undefined): string {
  if (!release) return '';
  const lines: string[] = [];
  if (release.type?.trim()) lines.push(`- Type: ${release.type.trim()}`);
  if (release.timeline?.trim()) lines.push(`- Timeline: ${release.timeline.trim()}`);
  if (release.rollback?.trim()) lines.push(`- Rollback: ${release.rollback.trim()}`);
  if (release.monitoring?.trim()) lines.push(`- Monitoring: ${release.monitoring.trim()}`);
  return lines.length > 0 ? lines.join('\n') : '';
}

export function buildUserMessage(mode: QeMode, inputs: QeToolInputs): string {
  const parts: string[] = [`MODE: ${mode}`];

  if (mode === 'REPO_UAT') {
    parts.push('FEATURE / TICKET:\nN/A — no ticket');
    parts.push(`FEATURE / AREA (plain language):\n${inputs.feature.trim()}`);
    parts.push(section('REPO HINTS:', inputs.repo_hints?.trim() || 'N/A'));
  } else {
    parts.push(`FEATURE / TICKET:\n${inputs.feature.trim()}`);
  }

  const optional = [
    section('API:', inputs.api_context),
    section('SYSTEM:', inputs.system_context),
    section('USER:', inputs.user_context),
    section('RISKS:', inputs.risks),
    section('EXISTING COVERAGE:', inputs.existing_coverage),
    section('RELEASE:', formatRelease(inputs.release)),
    section('RELATED_REPOS:', inputs.related_repos),
  ].filter(Boolean);

  if (optional.length > 0) {
    parts.push('OPTIONAL CONTEXT:\n' + optional.join('\n'));
  }

  if (inputs.scope_unknown === true) {
    parts.push('SCOPE_UNKNOWN: true');
  }

  if (inputs.completeness?.trim()) {
    parts.push(`COMPLETENESS: ${inputs.completeness.trim()}`);
  }

  return parts.filter(Boolean).join('\n\n');
}

/**
 * Slug algorithm: lowercase ASCII words from title, 3–6 words, max ~40 chars.
 */
export function titleToSlug(title: string): string {
  const words = title
    .toLowerCase()
    .replace(/[^\x00-\x7F]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 0);
  if (words.length === 0) return SLUG_DEFAULT;
  const count = Math.min(SLUG_MAX_WORDS, Math.max(SLUG_MIN_WORDS, words.length));
  let slug = words.slice(0, count).join('-');
  if (slug.length > SLUG_MAX_LENGTH) {
    slug = slug.slice(0, SLUG_MAX_LENGTH).replace(/-+$/, '');
  }
  return slug || SLUG_DEFAULT;
}

export function buildArtifactStem(
  mode: QeMode,
  slug: string,
  dateUtc: string,
): string {
  return `${ANALYSIS_FILENAME_PREFIX}-${mode}-${slug}-${dateUtc}`;
}

export function buildAnalysisFilename(
  mode: QeMode,
  slug: string,
  dateUtc: string,
): string {
  return `${buildArtifactStem(mode, slug, dateUtc)}.md`;
}
