import { z } from 'zod';
import { QE_MODES } from './types.js';

export const REPORT_SCHEMA_VERSION = '1.0.0';

const qeModeValues = QE_MODES;

export const confidenceLevelSchema = z.enum(['HIGH', 'MEDIUM', 'LOW']);
export const impactSchema = z.enum(['P0', 'P1', 'P2']);
export const likelihoodSchema = z.enum(['High', 'Medium', 'Low']);
export const detectionSchema = z.enum(['Easy', 'Hard']);
export const evidenceTypeSchema = z.enum(['code', 'spec', 'assumed']);
export const scenarioLayerSchema = z.enum([
  'API',
  'UI',
  'Unit',
  'Integration',
  'UI + API',
]);
export const automationLayerSchema = z.enum([
  'API',
  'UI',
  'Unit',
  'Integration',
]);
export const goNoGoDecisionSchema = z.enum(['GO', 'NO-GO', 'CONDITIONAL GO']);
export const repoCandidateConfidenceSchema = z.enum(['High', 'Med', 'Low']);
export const scopeCertaintySchema = z.enum(['confirmed', 'inferred']);
export const scanDepthSchema = z.enum(['shallow', 'deep']);
export const ledgerStatusSchema = z.enum([
  'scanned',
  'not_scanned',
  'blocked',
]);
export const droppedScenarioReasonSchema = z.enum([
  'duplicate_coverage',
  'low_confidence',
  'other',
]);

export const reportConfidenceSchema = z.object({
  level: confidenceLevelSchema,
  reason: z.string().min(1),
});

export const reportGapSchema = z.object({
  text: z.string().min(1),
  assumed: z.boolean(),
});

export const reportRiskSchema = z.object({
  title: z.string().min(1),
  impact: impactSchema,
  likelihood: likelihoodSchema,
  detection: detectionSchema,
  mitigation: z.string().min(1),
});

export const scenarioEvidenceSchema = z.object({
  text: z.string().min(1),
  type: evidenceTypeSchema,
});

export const reportScenarioSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  exploration: z.string().min(1),
  evidence: scenarioEvidenceSchema,
  why: z.string().min(1),
  layer: scenarioLayerSchema,
  confidence: confidenceLevelSchema,
});

export const automationNoteSchema = z.object({
  layer: automationLayerSchema,
  note: z.string().min(1),
});

export const nonfunctionalSchema = z.object({
  performance: z.string().min(1),
  security: z.string().min(1),
  accessibility: z.string().min(1),
  observability: z.string().min(1),
});

export const modeOutputSchema = z.object({
  content: z.string().min(1),
});

export const repoCandidateSchema = z.object({
  candidate: z.string().min(1),
  evidence: z.string().min(1),
  confidence: repoCandidateConfidenceSchema,
  verifyHow: z.string().min(1),
});

export const repoLedgerEntrySchema = z.object({
  repo: z.string().min(1),
  role: z.string().min(1),
  scopeCertainty: scopeCertaintySchema,
  requestedDepth: scanDepthSchema,
  status: ledgerStatusSchema,
  evidenceOrReason: z.string().min(1),
});

export const coverageGapSchema = z.object({
  text: z.string().min(1),
  reason: z.string().optional(),
});

export const goNoGoSchema = z.object({
  decision: goNoGoDecisionSchema,
  reason: z.string().min(1),
});

export const droppedScenarioSchema = z.object({
  name: z.string().min(1),
  reason: droppedScenarioReasonSchema,
});

export const qeReportJsonSchema = z.object({
  mode: z.enum(qeModeValues),
  title: z.string().min(1),
  generated: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'generated must be YYYY-MM-DD'),
  confidence: reportConfidenceSchema,
  understanding: z.array(z.string().min(1)).max(3),
  gaps: z.array(reportGapSchema),
  risks: z.array(reportRiskSchema).min(1).max(7),
  questions: z.array(z.string().min(1)),
  scenarios: z.array(reportScenarioSchema),
  automation: z.array(automationNoteSchema),
  nonfunctional: nonfunctionalSchema,
  modeOutput: modeOutputSchema,
  outOfScope: z.array(z.string().min(1)),
  coverageGaps: z.array(coverageGapSchema).default([]),
  repoCandidates: z.array(repoCandidateSchema).default([]),
  repoLedger: z.array(repoLedgerEntrySchema).default([]),
  goNoGo: goNoGoSchema.optional(),
  repoSelfCritique: z.array(z.string().min(1)).max(3).optional(),
  droppedScenarios: z.array(droppedScenarioSchema).optional(),
});

export const qeReportEnvelopeSchema = z.object({
  reportSchemaVersion: z.string().min(1),
  promptVersion: z.string().min(1),
  report: qeReportJsonSchema,
  validationWarnings: z.array(z.string()),
});

export type ConfidenceLevel = z.infer<typeof confidenceLevelSchema>;
export type EvidenceType = z.infer<typeof evidenceTypeSchema>;
export type QeReportJson = z.infer<typeof qeReportJsonSchema>;
export type QeReportEnvelope = z.infer<typeof qeReportEnvelopeSchema>;

/** JSON schema excerpt for model prompts (excludes server-only envelope fields). */
export const REPORT_JSON_SCHEMA_DESCRIPTION = `{
  "mode": "REFINEMENT | UAT | REPO_UAT | BUG | REGRESSION",
  "title": "short human title",
  "generated": "YYYY-MM-DD",
  "confidence": {
    "level": "HIGH | MEDIUM | LOW",
    "reason": "one line"
  },
  "understanding": ["bullet 1", "bullet 2", "max 3 bullets"],
  "gaps": [
    { "text": "gap description", "assumed": true }
  ],
  "risks": [
    {
      "title": "one line risk",
      "impact": "P0 | P1 | P2",
      "likelihood": "High | Medium | Low",
      "detection": "Easy | Hard",
      "mitigation": "one line"
    }
  ],
  "questions": ["crisp specific question"],
  "scenarios": [
    {
      "id": "01",
      "name": "short scenario name",
      "exploration": "what to vary / observe / disprove",
      "evidence": {
        "text": "file:line or route or flag or Assumed: explanation",
        "type": "code | spec | assumed"
      },
      "why": "one line why it matters",
      "layer": "API | UI | Unit | Integration | UI + API",
      "confidence": "HIGH | MEDIUM | LOW"
    }
  ],
  "automation": [
    { "layer": "API | UI | Unit | Integration", "note": "what to automate and why" }
  ],
  "nonfunctional": {
    "performance": "specific concern or N/A",
    "security": "specific concern or N/A",
    "accessibility": "specific concern or N/A",
    "observability": "specific concern or N/A"
  },
  "modeOutput": {
    "content": "mode-specific section 7 content as plain text"
  },
  "outOfScope": ["item explicitly not tested"],
  "coverageGaps": [
    { "text": "gap not covered by this analysis", "reason": "optional one line" }
  ],
  "repoCandidates": [
    {
      "candidate": "repo or deployable name",
      "evidence": "one line from workspace or input",
      "confidence": "High | Med | Low",
      "verifyHow": "owner, catalog link, or search to run"
    }
  ],
  "repoLedger": [
    {
      "repo": "repo or unit name",
      "role": "API | UI | worker | E2E | infra | lib",
      "scopeCertainty": "confirmed | inferred",
      "requestedDepth": "shallow | deep",
      "status": "scanned | not_scanned | blocked",
      "evidenceOrReason": "one line evidence or why not scanned"
    }
  ],
  "goNoGo": {
    "decision": "GO | NO-GO | CONDITIONAL GO",
    "reason": "one line (UAT and REPO_UAT when applicable)"
  },
  "repoSelfCritique": [
    "exactly 3 bullets when repoLedger is a full table; omit otherwise"
  ],
  "droppedScenarios": [
    { "name": "scenario name", "reason": "duplicate_coverage | low_confidence | other" }
  ]
}`;
