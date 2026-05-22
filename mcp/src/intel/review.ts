import type { IntelReviewArgs } from './types.js';

function countScenarioRows(draft: string): number {
  const tableRows = draft.match(/^\|\s*\d+/gm);
  if (tableRows) return tableRows.length;
  const numbered = draft.match(/^\d+\.\s+/gm);
  return numbered?.length ?? 0;
}

export function buildIntelReview(args: IntelReviewArgs): string {
  const mode = args.mode;
  const draft = args.draft_text.trim();
  const scenarios = countScenarioRows(draft);
  const hasAssumed = /assumed:/i.test(draft);
  const hasEvidence =
    Boolean(args.evidence_context?.trim()) ||
    /src\/|apps\/|packages\/|\.ts:|\.tsx:|path:/i.test(draft);
  const genericPerf = /ensure good performance|make it accessible|test security/i.test(
    draft,
  );
  const happyOnly = /happy path with valid|valid input only/i.test(draft);

  const issues: string[] = [];
  const strengths: string[] = [];

  if (scenarios === 0) {
    issues.push('No numbered scenarios or table rows — add at least 3 concrete cases.');
  } else if (scenarios < 3) {
    issues.push(
      'Only ~' + String(scenarios) + ' scenarios — add negative, timeout, or state-change cases.',
    );
  } else {
    strengths.push(String(scenarios) + ' scenarios listed — good start.');
  }

  if (!hasEvidence && mode !== 'REFINEMENT') {
    issues.push(
      'No repo evidence cited — add path:line finding bullets or grep before claiming coverage.',
    );
  }

  if (hasAssumed) {
    strengths.push('Uses Assumed: labels — confirm open assumptions with the user.');
  }

  if (genericPerf) {
    issues.push(
      'Generic NFR fluff detected — replace with a specific budget, endpoint, or WCAG criterion.',
    );
  }

  if (happyOnly) {
    issues.push('Happy-path-only wording — add failure, timeout, or concurrent-use cases.');
  }

  if (mode === 'UAT' || mode === 'REPO_UAT') {
    if (!/GO|NO-GO|CONDITIONAL/i.test(draft)) {
      issues.push('Missing GO / NO-GO / CONDITIONAL recommendation for release gate.');
    }
  }

  if (mode === 'REFINEMENT') {
    if (!/acceptance criteria|AC\b|missing/i.test(draft)) {
      issues.push('Refinement draft should call out missing or weak acceptance criteria.');
    }
  }

  if (mode === 'BUG') {
    if (!/root cause|repro|regression/i.test(draft)) {
      issues.push('Bug draft should cover repro, root-cause hypotheses, and regression after fix.');
    }
  }

  if (mode === 'REGRESSION') {
    if (!/impacted|retest|automation|suite/i.test(draft)) {
      issues.push('Regression draft should name impacted areas and what to re-run.');
    }
  }

  let verdict: string;
  if (issues.length === 0) {
    verdict = '**Verdict:** Ready to share with the team or proceed to Phase E save.';
  } else if (issues.length <= 2) {
    verdict = '**Verdict:** Close — fix the issues below, then optional save.';
  } else {
    verdict = '**Verdict:** Not ready — rework Phase B–C before saving a formal report.';
  }

  const lines: string[] = [
    '# QE Intel review — ' + mode,
    '',
    verdict,
    '',
  ];

  if (strengths.length > 0) {
    lines.push('**Strengths:**');
    for (const s of strengths) lines.push('- ' + s);
    lines.push('');
  }

  lines.push('**Improve:**');
  if (issues.length > 0) {
    for (const i of issues) lines.push('- ' + i);
  } else {
    lines.push('- None flagged.');
  }
  lines.push('');
  lines.push('## Next step');
  lines.push('');
  lines.push('- Revise the draft in chat (coach tier).');
  lines.push(
    '- When solid: qe_intel_review again or move to Phase E (qe_save_markdown / validate + qe_save_report).',
  );

  if (args.feature?.trim()) {
    lines.push('');
    lines.push('**Scope:** ' + args.feature.trim().slice(0, 200));
  }

  return lines.join('\n');
}
