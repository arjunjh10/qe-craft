import { saveAnalysis, saveRawFailure, saveReportEnvelope } from './file-writer.js';
import {
  buildValidationContextFromInputs,
  formatJsonReportFailureMessage,
  formatJsonReportSuccessSummary,
  parseValidateAndEnvelope,
} from './json-report-pipeline.js';
import {
  CHAT_ONLY_FOOTER,
  PROMPT_VERSION,
  REPORT_JSON_SCHEMA_DESCRIPTION,
  buildSystemPrompt,
  getIncludedChunkIds,
  resolvePromptContext,
  saveFailedFooter,
  savedToFooter,
} from './core/index.js';
import type { z } from 'zod';
import type {
  getSystemPromptSchema,
  saveMarkdownSchema,
  saveReportSchema,
  validateReportSchema,
} from './core/schemas.js';

type TextToolResult = { content: [{ type: 'text'; text: string }] };

function textResult(text: string): TextToolResult {
  return { content: [{ type: 'text', text }] };
}

export function handleGetSystemPrompt(
  args: z.infer<typeof getSystemPromptSchema>,
): TextToolResult {
  const promptContext = resolvePromptContext(args.mode, {
    outputFormat: args.output_format,
    relatedRepos: args.related_repos,
    scopeUnknown: args.scope_unknown,
  });
  const chunkIds = getIncludedChunkIds(promptContext);
  const systemPrompt = buildSystemPrompt(promptContext);

  const header = [
    `**QE system prompt** — ${args.mode} (${args.output_format})`,
    `- promptVersion: \`${PROMPT_VERSION}\``,
    `- chunks: ${chunkIds.join(', ')}`,
    '',
    '---',
    '',
  ].join('\n');

  return textResult(header + systemPrompt);
}

export function handleGetJsonSchema(): TextToolResult {
  return textResult(REPORT_JSON_SCHEMA_DESCRIPTION);
}

export async function handleValidateReport(
  args: z.input<typeof validateReportSchema>,
): Promise<TextToolResult> {
  const validationContext = buildValidationContextFromInputs(args);
  const result = parseValidateAndEnvelope(args.report_json, validationContext);

  if (!result.ok) {
    let failureMessage = formatJsonReportFailureMessage(result.errors);
    const saveFile = args.save_file !== false;

    if (saveFile && args.mode && args.title) {
      const dateUtc = new Date().toISOString().slice(0, 10);
      const saved = await saveRawFailure({
        mode: args.mode,
        title: args.title,
        dateUtc,
        rawText: result.rawText,
      });

      if ('relativePath' in saved) {
        failureMessage = formatJsonReportFailureMessage(
          result.errors,
          saved.relativePath,
        );
      } else {
        failureMessage += saveFailedFooter(saved.error);
      }
    }

    return textResult(failureMessage);
  }

  const summary = formatJsonReportSuccessSummary(result.envelope);
  const envelopeJson = JSON.stringify(result.envelope, null, 2);
  return textResult(
    `${summary}\n\n---\nValidated envelope (pass to qe_save_report):\n\`\`\`json\n${envelopeJson}\n\`\`\``,
  );
}

export async function handleSaveReport(
  args: z.infer<typeof saveReportSchema>,
): Promise<TextToolResult> {
  const envelope = args.envelope;
  const dateUtc = new Date().toISOString().slice(0, 10);
  const saveFile = args.save_file !== false;

  let responseText = formatJsonReportSuccessSummary(envelope);

  if (!saveFile) {
    return textResult(responseText + CHAT_ONLY_FOOTER);
  }

  const saved = await saveReportEnvelope({
    mode: args.mode,
    title: args.title,
    dateUtc,
    envelope,
  });

  if ('jsonPath' in saved) {
    responseText = formatJsonReportSuccessSummary(
      envelope,
      saved.jsonPath,
      saved.htmlPath,
    );
  } else {
    responseText += saveFailedFooter(saved.error);
  }

  return textResult(responseText);
}

export async function handleSaveMarkdown(
  args: z.infer<typeof saveMarkdownSchema>,
): Promise<TextToolResult> {
  const dateUtc = new Date().toISOString().slice(0, 10);
  const saveFile = args.save_file !== false;

  if (!saveFile) {
    return textResult(
      `**QE analysis (markdown)** — ${args.mode}\n- Title: ${args.title}${CHAT_ONLY_FOOTER}`,
    );
  }

  const saved = await saveAnalysis({
    mode: args.mode,
    title: args.title,
    body: args.body,
    dateUtc,
  });

  let responseText = `**QE analysis (markdown)** — ${args.mode}\n- Title: ${args.title}`;
  if ('relativePath' in saved) {
    responseText += savedToFooter(saved.relativePath);
  } else {
    responseText += saveFailedFooter(saved.error);
  }

  return textResult(responseText);
}
