import type { QeMode } from '../core/types.js';
import type { IntelInputStatus } from './types.js';

export interface ThinInputResult {
  status: IntelInputStatus;
  gaps: string[];
  phaseAQuestions: string[];
}

const MIN_FEATURE_LEN: Record<QeMode, number> = {
  REFINEMENT: 40,
  UAT: 40,
  REPO_UAT: 12,
  BUG: 25,
  REGRESSION: 20,
};

function hasReleaseBlock(args: {
  release?: {
    type?: string;
    timeline?: string;
    rollback?: string;
    monitoring?: string;
  };
  feature: string;
}): boolean {
  if (args.release) {
    const r = args.release;
    if (r.type?.trim() || r.timeline?.trim() || r.rollback?.trim() || r.monitoring?.trim()) {
      return true;
    }
  }
  return /release|rollback|monitoring|timeline/i.test(args.feature);
}

function isRepoUatPlaceholder(feature: string): boolean {
  const t = feature.trim().toLowerCase();
  return (
    t === 'n/a' ||
    t === 'n/a — no ticket' ||
    t.startsWith('n/a —') && t.length < 30
  );
}

export function assessThinInput(
  mode: QeMode,
  args: {
    feature: string;
    release?: {
      type?: string;
      timeline?: string;
      rollback?: string;
      monitoring?: string;
    };
    repo_hints?: string;
  },
): ThinInputResult {
  const gaps: string[] = [];
  const phaseAQuestions: string[] = [];
  const feature = args.feature.trim();
  const minLen = MIN_FEATURE_LEN[mode];

  if (mode === 'REPO_UAT') {
    if (isRepoUatPlaceholder(feature) || feature.length < minLen) {
      gaps.push('FEATURE / AREA is missing or too short — describe what to validate in plain language.');
      phaseAQuestions.push(
        'What user-visible behaviour are we validating (one sentence)?',
      );
    }
    if (!args.repo_hints?.trim()) {
      gaps.push('REPO HINTS empty — paths, packages, or entry URLs speed up Phase A.');
      phaseAQuestions.push(
        'Which folders, routes, or packages should we inspect first?',
      );
    }
  } else if (feature.length < minLen) {
    gaps.push(`Ticket / scope text is very short (under ~${minLen} chars) — add AC, flow, or impact.`);
    phaseAQuestions.push('What is the happy path in one sentence?');
    phaseAQuestions.push('Who is the user and what breaks if this fails?');
  }

  if (mode === 'UAT' && !hasReleaseBlock(args)) {
    gaps.push('RELEASE block missing — need rollback and monitoring before GO/NO-GO.');
    phaseAQuestions.push('What is the rollback plan if we ship and it fails?');
    phaseAQuestions.push('What metrics or alerts will tell us it failed in prod?');
  }

  if (mode === 'BUG') {
    if (!/repro|steps|stack|error|log|when/i.test(feature)) {
      gaps.push('No clear repro or symptom in input — add steps, error message, or frequency.');
      phaseAQuestions.push('What exact steps reproduce the issue (or how often does it happen)?');
    }
  }

  if (mode === 'REGRESSION') {
    if (!/pr|diff|changed|commit|release|file|path/i.test(feature)) {
      gaps.push('Change list unclear — paste PR summary, files touched, or release notes.');
      phaseAQuestions.push('Which services or user journeys did this change touch?');
    }
  }

  const status: IntelInputStatus =
    gaps.length > 0 ? 'needs_input' : 'ready';

  return { status, gaps, phaseAQuestions };
}
