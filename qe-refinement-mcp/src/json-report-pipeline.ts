import { runQeAnalysis } from './anthropic-client.js';
import {
  applyReportGuards,
  buildEnvelope,
  buildJsonRetryUserMessage,
  parseReportJson,
  type PromptContext,
  type QeReportEnvelope,
  type ReportValidationContext,
} from './core/index.js';

export type JsonReportSuccess = {
  ok: true;
  envelope: QeReportEnvelope;
  rawText: string;
};

export type JsonReportFailure = {
  ok: false;
  errors: string[];
  rawText: string;
};

export type JsonReportResult = JsonReportSuccess | JsonReportFailure;

export function parseValidateAndEnvelope(
  rawText: string,
  validationContext: ReportValidationContext,
): JsonReportResult {
  const parsed = parseReportJson(rawText);
  if (!parsed.ok) {
    return { ok: false, errors: parsed.errors, rawText };
  }

  const { report, validationWarnings } = applyReportGuards(
    parsed.report,
    validationContext,
  );

  return {
    ok: true,
    envelope: buildEnvelope(report, validationWarnings),
    rawText,
  };
}

export async function runJsonReportPipeline(params: {
  userMessage: string;
  promptContext: PromptContext;
  validationContext: ReportValidationContext;
}): Promise<JsonReportResult> {
  let rawText = await runQeAnalysis(params.userMessage, params.promptContext);
  let result = parseValidateAndEnvelope(rawText, params.validationContext);

  if (result.ok) {
    return result;
  }

  const retryMessage = buildJsonRetryUserMessage(
    params.userMessage,
    rawText,
    result.errors,
  );
  rawText = await runQeAnalysis(retryMessage, params.promptContext);
  result = parseValidateAndEnvelope(rawText, params.validationContext);

  if (result.ok) {
    return result;
  }

  return { ok: false, errors: result.errors, rawText };
}

export function buildValidationContextFromInputs(inputs: {
  feature: string;
  api_context?: string;
  system_context?: string;
  user_context?: string;
  repo_hints?: string;
  related_repos?: string;
  existing_coverage?: string;
  evidence_context?: string;
}): ReportValidationContext {
  return {
    feature: inputs.feature,
    apiContext: inputs.api_context,
    systemContext: inputs.system_context,
    userContext: inputs.user_context,
    repoHints: inputs.repo_hints,
    relatedRepos: inputs.related_repos,
    existingCoverage: inputs.existing_coverage,
    evidenceContext: inputs.evidence_context,
  };
}

export function formatJsonReportFailureMessage(
  errors: string[],
  rawPath?: string,
): string {
  const errorList = errors.map((error) => `- ${error}`).join('\n');
  const lines = [
    'JSON report validation failed after one retry.',
    '',
    'Validation errors:',
    errorList,
  ];

  if (rawPath) {
    lines.push('', `Raw model output saved to: \`${rawPath}\``);
  }

  return lines.join('\n');
}

export function formatJsonReportSuccessSummary(
  envelope: QeReportEnvelope,
  jsonPath?: string,
  htmlPath?: string,
): string {
  const { report, validationWarnings } = envelope;
  const scenarioCounts = { HIGH: 0, MEDIUM: 0, LOW: 0 };
  for (const scenario of report.scenarios) {
    scenarioCounts[scenario.confidence] += 1;
  }

  const lines = [
    `**QE analysis (JSON)** — ${report.mode}`,
    `- Confidence: ${report.confidence.level} — ${report.confidence.reason}`,
    `- Risks: ${report.risks.length}`,
    `- Scenarios: ${report.scenarios.length} (HIGH ${scenarioCounts.HIGH}, MEDIUM ${scenarioCounts.MEDIUM}, LOW ${scenarioCounts.LOW})`,
  ];

  if (validationWarnings.length > 0) {
    lines.push(`- Validation warnings: ${validationWarnings.length}`);
  }

  if (jsonPath) {
    lines.push(`- JSON: \`${jsonPath}\``);
  }
  if (htmlPath) {
    lines.push(`- HTML: \`${htmlPath}\``);
  }

  return lines.join('\n');
}
