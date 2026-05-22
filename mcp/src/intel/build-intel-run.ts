import { randomBytes } from 'node:crypto';
import { PROMPT_VERSION } from '../core/constants.js';
import {
  buildSystemPrompt,
  getIncludedChunkIds,
  resolvePromptContext,
} from '../core/index.js';
import { REPORT_JSON_SCHEMA_DESCRIPTION } from '../core/report-schema.js';
import type { QeMode } from '../core/types.js';
import { formatWhereToLookSection, gatherWhereToLook } from './repo-scan.js';
import { getModePhaseD, getPhaseAIntro, getSharedPhases } from './intel-phases.js';
import { assessThinInput } from './thin-input.js';
import type { IntelRunArgs, OutputTier } from './types.js';
import { MODE_TO_INTEL_TOOL } from './types.js';

export function deriveTitle(feature: string, title?: string): string {
  if (title?.trim()) return title.trim().slice(0, 80);
  const first = feature.trim().split('\n').find((l) => l.trim().length > 0) ?? 'QE scope';
  return first.replace(/^#+\s*/, '').slice(0, 80);
}

function makeRunId(mode: QeMode): string {
  const slug = mode.toLowerCase().replace('_', '-');
  const date = new Date().toISOString().slice(0, 10);
  const suffix = randomBytes(3).toString('hex');
  return `intel-${slug}-${date}-${suffix}`;
}

function summarizeInput(feature: string): string {
  const lines = feature.trim().split('\n');
  const preview = lines.slice(0, 6).join('\n');
  const more = lines.length > 6 ? `\n… (${lines.length - 6} more lines)` : '';
  return preview + more;
}

function formatContextBlock(args: IntelRunArgs): string {
  const parts: string[] = [];
  const push = (label: string, value?: string) => {
    if (value?.trim()) parts.push(`**${label}:**\n${value.trim()}`);
  };
  push('API', args.api_context);
  push('System', args.system_context);
  push('User', args.user_context);
  push('Risks', args.risks);
  push('Coverage', args.existing_coverage);
  push('Repo hints', args.repo_hints);
  push('Related repos', args.related_repos);
  if ('release' in args && args.release) {
    const r = args.release;
    const rel = [r.type, r.timeline, r.rollback, r.monitoring]
      .filter(Boolean)
      .join(' | ');
    if (rel) push('Release', rel);
  }
  if (args.completeness?.trim()) push('Completeness', args.completeness);
  return parts.length ? parts.join('\n\n') : '_No optional context blocks provided._';
}

async function buildReferenceAppendix(
  mode: QeMode,
  tier: OutputTier,
  args: IntelRunArgs,
): Promise<string> {
  if (tier !== 'full') {
    return `## Reference (full tier only)

Re-run this tool with \`output_tier: "full"\` to embed the complete senior-QE prompt and section 1–11 rules.
Tools: \`qe_get_system_prompt\`, \`qe_get_json_schema\` (if JSON).`;
  }

  const ctx = resolvePromptContext(mode, {
    outputFormat: args.output_format,
    relatedRepos: args.related_repos,
    scopeUnknown: args.scope_unknown,
  });
  const chunkIds = getIncludedChunkIds(ctx);
  const systemPrompt = buildSystemPrompt(ctx);

  const schemaBlock =
    args.output_format === 'json'
      ? `\n\n### JSON schema\n\n${REPORT_JSON_SCHEMA_DESCRIPTION}`
      : '';

  return `## Reference — full report rules

- promptVersion: \`${PROMPT_VERSION}\`
- chunks: ${chunkIds.join(', ')}

${systemPrompt}${schemaBlock}`;
}

export async function buildIntelRun(
  mode: QeMode,
  args: IntelRunArgs,
): Promise<string> {
  const tier: OutputTier = args.output_tier ?? 'coach';
  const title = deriveTitle(args.feature, args.title);
  const runId = makeRunId(mode);
  const toolName = MODE_TO_INTEL_TOOL[mode];

  const thin = assessThinInput(mode, {
    feature: args.feature,
    release: 'release' in args ? args.release : undefined,
    repo_hints: args.repo_hints,
  });

  const where = await gatherWhereToLook(args.feature, args.repo_hints);
  const phaseD = getModePhaseD(mode);
  const shared = getSharedPhases(mode, tier);

  const statusLine =
    thin.status === 'needs_input'
      ? `**input_status:** \`needs_input\` — complete Phase A questions before deep scenarios.`
      : `**input_status:** \`ready\``;

  const gapBlock =
    thin.gaps.length > 0
      ? `\n**Input gaps:**\n${thin.gaps.map((g) => `- ${g}`).join('\n')}\n`
      : '';

  const questionBlock =
    thin.phaseAQuestions.length > 0
      ? `\n**Ask the user (Phase A):**\n${thin.phaseAQuestions.map((q) => `- ${q}`).join('\n')}\n`
      : '';

  const whereSection = formatWhereToLookSection(where.hints, where.scanNote);

  const sections = [
    `# QE Intel run — ${mode}`,
    '',
    `**tool:** \`${toolName}\``,
    `**run_id:** \`${runId}\``,
    `**mode:** ${mode}`,
    `**output_tier:** ${tier}`,
    `**output_format:** ${args.output_format ?? 'markdown'}`,
    `**audience:** low-QE OK — plain language, stop rules, no jargon without explanation`,
    statusLine,
    '',
    '---',
    '',
    '## Input received',
    '',
    `**Title:** ${title}`,
    '',
    '```text',
    summarizeInput(args.feature),
    '```',
    gapBlock,
    questionBlock,
    '',
    formatContextBlock(args),
    '',
    '---',
    '',
    getPhaseAIntro(mode),
    '',
    '### Where to look (repo scan)',
    '',
    whereSection,
    '',
    '---',
    '',
    shared.phaseB,
    '',
    '---',
    '',
    shared.phaseC,
    '',
    '---',
    '',
    `## Phase D — ${phaseD.heading}`,
    '',
    phaseD.bullets.map((b) => `- ${b}`).join('\n'),
    '',
    `**Stop when:** ${phaseD.stopWhen}`,
    '',
    '---',
    '',
    shared.phaseE,
    '',
    '---',
    '',
    await buildReferenceAppendix(mode, tier, args),
    '',
    '---',
    '',
    '## Done criteria (this run)',
    '',
    tier === 'coach'
      ? '- User got clearer risks, questions, and a short scenario table in **chat**.\n- Optional file save only if they asked.\n- Do **not** call validate/save unless Phase E applies.'
      : '- Full report produced and saved under `docs/qe-analysis/` when `save_file` is true.\n- Validate JSON before save.',
    '',
    `**MCP does not read the repo** — you explored under \`${where.repoRoot}\` and must cite real paths.`,
  ];

  return sections.join('\n');
}
