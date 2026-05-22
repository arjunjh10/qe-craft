import type { QeReportJson } from './report-schema.js';

export interface ReportValidationContext {
  evidenceContext?: string;
  apiContext?: string;
  systemContext?: string;
  userContext?: string;
  repoHints?: string;
  relatedRepos?: string;
  feature?: string;
  existingCoverage?: string;
}

export interface GuardedReportResult {
  report: QeReportJson;
  validationWarnings: string[];
}

function buildEvidenceCorpus(ctx: ReportValidationContext): string {
  return [
    ctx.evidenceContext,
    ctx.apiContext,
    ctx.systemContext,
    ctx.userContext,
    ctx.repoHints,
    ctx.relatedRepos,
    ctx.feature,
  ]
    .filter((part) => part?.trim())
    .join('\n')
    .toLowerCase();
}

/** Primary citation token before em/en dash separators. */
function citationToken(evidenceText: string): string {
  const beforeDash = evidenceText.split(/\s*[—–]\s*/)[0]?.trim();
  return (beforeDash ?? evidenceText).toLowerCase();
}

function citationAppearsInContext(evidenceText: string, corpus: string): boolean {
  if (!corpus.trim()) return false;

  const token = citationToken(evidenceText);
  if (token.length >= 3 && corpus.includes(token)) {
    return true;
  }

  const pathMatch = evidenceText.match(
    /[\w./@-]+\.(?:ts|tsx|js|jsx|py|go|java|rb|rs|vue|sql|yaml|yml|json|md)(?::\d+)?/i,
  );
  if (pathMatch && corpus.includes(pathMatch[0].toLowerCase())) {
    return true;
  }

  return corpus.includes(evidenceText.trim().toLowerCase());
}

function scenarioOverlapsCoverage(
  scenarioName: string,
  existingCoverage: string,
): boolean {
  const name = scenarioName.trim().toLowerCase();
  const coverage = existingCoverage.toLowerCase();
  if (name.length < 4) return false;
  return coverage.includes(name);
}

function applyEvidenceGuards(
  report: QeReportJson,
  corpus: string,
  warnings: string[],
): QeReportJson {
  const scenarios = report.scenarios.map((scenario) => {
    if (scenario.evidence.type !== 'code') {
      return scenario;
    }

    if (citationAppearsInContext(scenario.evidence.text, corpus)) {
      return scenario;
    }

    warnings.push(
      `Scenario "${scenario.name}": evidence.type downgraded code → assumed (citation not found in context)`,
    );

    return {
      ...scenario,
      evidence: {
        ...scenario.evidence,
        type: 'assumed' as const,
      },
      confidence: scenario.confidence === 'HIGH' ? ('MEDIUM' as const) : scenario.confidence,
    };
  });

  return { ...report, scenarios };
}

function applyCoverageDedupe(
  report: QeReportJson,
  existingCoverage: string | undefined,
  warnings: string[],
): QeReportJson {
  if (!existingCoverage?.trim()) {
    return report;
  }

  const kept = [];
  const dropped = [...(report.droppedScenarios ?? [])];

  for (const scenario of report.scenarios) {
    if (scenarioOverlapsCoverage(scenario.name, existingCoverage)) {
      dropped.push({ name: scenario.name, reason: 'duplicate_coverage' });
      warnings.push(
        `Scenario "${scenario.name}" dropped: overlaps existing_coverage`,
      );
      continue;
    }
    kept.push(scenario);
  }

  return {
    ...report,
    scenarios: kept,
    droppedScenarios: dropped.length > 0 ? dropped : report.droppedScenarios,
  };
}

/** Server-side guards: evidence substring check and coverage dedupe. */
export function applyReportGuards(
  report: QeReportJson,
  ctx: ReportValidationContext,
): GuardedReportResult {
  const validationWarnings: string[] = [];
  const corpus = buildEvidenceCorpus(ctx);

  let guarded = applyEvidenceGuards(report, corpus, validationWarnings);
  guarded = applyCoverageDedupe(guarded, ctx.existingCoverage, validationWarnings);

  return { report: guarded, validationWarnings };
}
