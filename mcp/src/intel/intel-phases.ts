import type { QeMode } from '../core/types.js';
import type { OutputTier } from './types.js';

export interface ModePhaseD {
  heading: string;
  bullets: string[];
  stopWhen: string;
}

export function getModePhaseD(mode: QeMode): ModePhaseD {
  switch (mode) {
    case 'REFINEMENT':
      return {
        heading: 'Refinement decisions',
        bullets: [
          'List **missing acceptance criteria** (max 5) — behaviour, errors, limits, integrations.',
          'Suggest **2–3 AC improvements** in plain language the team can paste into the ticket.',
          'Flag anything you marked `Assumed:` that blocks development or test design.',
        ],
        stopWhen: 'User can update the ticket without guessing edge cases.',
      };
    case 'UAT':
      return {
        heading: 'Release gate (UAT)',
        bullets: [
          'State **GO**, **NO-GO**, or **CONDITIONAL** in one line each with a one-sentence reason.',
          'List **top 3 release risks** still open after your scenarios.',
          'Name what must be tested **before prod** vs what can follow in a patch.',
        ],
        stopWhen: 'A release owner could decide deploy/cancel from your summary alone.',
      };
    case 'REPO_UAT':
      return {
        heading: 'Repo-informed gate',
        bullets: [
          'Bullet **3–5 evidence items** from code you actually read (`path` or route).',
          'Same GO / NO-GO / CONDITIONAL as UAT — say if GO depends on open `Assumed:` items.',
          'Order manual checks by risk using your scenario list.',
        ],
        stopWhen: 'Scope is grounded in repo facts, not only user narrative.',
      };
    case 'BUG':
      return {
        heading: 'Incident lens',
        bullets: [
          'Top **3 likely root causes** (hypothesis, not conviction) tied to evidence or `Assumed:`.',
          'What **test or monitor** should have caught this — be specific on layer (unit/API/E2E).',
          '**Regression after fix** — what to re-run so the hotfix does not break neighbours.',
        ],
        stopWhen: 'Engineering knows what to fix and what to add to prevent recurrence.',
      };
    case 'REGRESSION':
      return {
        heading: 'Retest scope',
        bullets: [
          'List **impacted areas** mapped to the change (service, route, UI, job).',
          '**Priority 1–5 retest list** — manual vs automated, with suite names if known.',
          'Call out **blind spots** (no coverage, shallow scan, blocked repo).',
        ],
        stopWhen: 'Someone can execute retest without reading the whole PR again.',
      };
  }
}

export function getSharedPhases(mode: QeMode, tier: OutputTier): {
  phaseB: string;
  phaseC: string;
  phaseE: string;
} {
  const maxScenarios = tier === 'coach' ? 5 : 8;

  const phaseB = `## Phase B — Gaps & risks (before scenarios)

Work in plain language. Do **not** paste generic advice.

Checklist:
- What happens on **invalid input**, **timeouts**, and **retries**?
- **State changes** after the main action (cart, session, async job)?
- **Integration** hand-offs — who owns errors?
- Anything in EXISTING COVERAGE — **do not** re-list as gaps.

**Bad example:** "Test performance and security."
**Good example:** "If promotions-service times out on apply, checkout must not charge with a stale discount."

Stop when: you have **3–7 real risks** with Impact (P0–P2) and one-line mitigation.`;

  const phaseC = `## Phase C — Scenarios (max ${maxScenarios})

Use a **short table** in chat — not a report appendix.

| # | What to try | Why it matters |
|---|-------------|----------------|
| 1 | … | … |

Rules:
- Mix **scriptable** checks and **exploratory** sessions (vary order, concurrency, config).
- Tie to code paths when you have them; else label \`Assumed:\`.
- For ${mode === 'REPO_UAT' ? 'REPO_UAT' : 'this mode'}, ${mode === 'REFINEMENT' ? 'focus on AC gaps the ticket should close.' : mode === 'BUG' ? 'focus on repro and detection gaps.' : 'focus on what could break in prod.'}

Stop when: a junior tester could run the table without reading the whole codebase.`;

  const phaseE =
    tier === 'coach'
      ? `## Phase E — Team record (optional)

Only if the user asks to **save**, **share**, or produce **HTML/JSON** for stakeholders:

1. Switch to \`output_tier: full\` and re-run the same \`qe_intel_*\` tool, **or**
2. Produce full sections 1–11 (markdown) / JSON per schema, then:
   - \`qe_validate_report\` → \`qe_save_report\` (json), or
   - \`qe_save_markdown\` (markdown)

See \`skills/shared/artifact-run.md\` in the package. **Coach output in chat is the default success.**`
      : `## Phase E — Team record (full tier)

Produce the **full** report (sections 1–11 markdown or JSON per \`output_format\`).

Then:
- JSON: \`qe_get_json_schema\` if needed → draft → \`qe_validate_report\` → \`qe_save_report\`
- Markdown: \`qe_save_markdown\`

Pass \`evidence_context\` from Phase A into validate. Tell the user file paths under \`docs/qe-analysis/\`.`;

  return { phaseB, phaseC, phaseE };
}

export function getPhaseAIntro(mode: QeMode): string {
  const explore =
    mode === 'REPO_UAT'
      ? 'Read routes, UI entry points, flags, and tests **before** claiming behaviour.'
      : 'Skim code for handlers, tests, and config tied to the ticket — even a shallow pass beats guesswork.';

  return `## Phase A — Understand (do this first)

${explore}

Deliver in chat (brief):
- **2 bullets** — what the feature does and the critical flow
- **Open questions** for PM/dev if input was thin (use AskQuestion when choices are finite)

Stop when: you can explain the flow to a teammate without reading the ticket again.`;
}
