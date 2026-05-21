import { ZodError } from 'zod';
import { PROMPT_VERSION } from './constants.js';
import {
  REPORT_SCHEMA_VERSION,
  qeReportJsonSchema,
  type QeReportEnvelope,
  type QeReportJson,
} from './report-schema.js';

export type ParseReportSuccess = {
  ok: true;
  report: QeReportJson;
};

export type ParseReportFailure = {
  ok: false;
  errors: string[];
};

export type ParseReportResult = ParseReportSuccess | ParseReportFailure;

/** Strip markdown fences and preamble; return the JSON object substring. */
export function extractJson(text: string): string {
  let trimmed = text.trim();

  const fenceMatch = trimmed.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/i);
  const fencedBody = fenceMatch?.[1];
  if (fencedBody !== undefined) {
    trimmed = fencedBody.trim();
  } else {
    trimmed = trimmed.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/, '');
  }

  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    return trimmed;
  }

  return trimmed.slice(start, end + 1);
}

export function formatZodErrors(error: ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
    return `${path}: ${issue.message}`;
  });
}

export function parseReportJson(text: string): ParseReportResult {
  const jsonText = extractJson(text);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, errors: [`JSON parse error: ${message}`] };
  }

  const result = qeReportJsonSchema.safeParse(parsed);
  if (!result.success) {
    return { ok: false, errors: formatZodErrors(result.error) };
  }

  return { ok: true, report: result.data };
}

export function buildEnvelope(
  report: QeReportJson,
  validationWarnings: string[],
): QeReportEnvelope {
  return {
    reportSchemaVersion: REPORT_SCHEMA_VERSION,
    promptVersion: PROMPT_VERSION,
    report,
    validationWarnings,
  };
}

export function buildJsonRetryUserMessage(
  originalUserMessage: string,
  invalidOutput: string,
  errors: string[],
): string {
  const errorList = errors.map((error) => `- ${error}`).join('\n');
  return `${originalUserMessage}

---
Your previous response was invalid JSON. Return **corrected JSON only** (no markdown fences, no preamble, no commentary). Fix these validation errors:
${errorList}

Invalid output:
${invalidOutput.trim()}`;
}
