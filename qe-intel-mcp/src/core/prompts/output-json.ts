import { REPORT_JSON_SCHEMA_DESCRIPTION } from '../report-schema.js';

export const OUTPUT_JSON = `## Output Format (STRICT) — JSON only

Return **ONLY** valid JSON matching the schema below. No Markdown, no preamble, no code fences, no trailing commentary. The root object is the report — **not** wrapped in \`report\` or \`validationWarnings\` (those are added server-side).

### Section mapping (Markdown parity)

| Markdown section | JSON field(s) |
|------------------|---------------|
| 1 Understanding | \`understanding\` (max 3 strings) |
| 2 Gaps | \`gaps[]\` with \`{ text, assumed }\` |
| 3 Risks | \`risks[]\` |
| 4 Questions | \`questions[]\` |
| 5 Scenarios | \`scenarios[]\` — each row equivalent to the Markdown table |
| 6 Non-functional | \`nonfunctional\` object (four keys) |
| 7 Mode-specific | \`modeOutput.content\` (plain text) **and** \`goNoGo\` when MODE is UAT or REPO_UAT |
| 8 Automation | \`automation[]\` |
| 9 Out of scope | \`outOfScope[]\` — product/test boundaries **not** examined |
| 9b Coverage gaps | \`coverageGaps[]\` — test/analysis blind spots **within** scope but not covered this run |
| 10 Confidence | \`confidence\` |
| 11a Candidates | \`repoCandidates[]\` |
| 11b Ledger | \`repoLedger[]\` |
| 11 self-critique | \`repoSelfCritique\` (exactly 3 strings when ledger is a full table) |
| Dropped scenarios | \`droppedScenarios[]\` (auditable cuts) |

### Field rules

- Set \`mode\` to the run's MODE; \`title\` and \`generated\` (YYYY-MM-DD) are required.
- \`scenarios[].evidence.type\`: \`code\` only when \`evidence.text\` cites proof from the evidence bundle; else \`spec\` or \`assumed\` per evidence rules.
- \`scenarios[].confidence\`: \`HIGH\` | \`MEDIUM\` | \`LOW\` — must align with evidence type and text.
- \`gaps[].assumed\`: \`true\` when the gap is inferred, not stated in input.
- \`outOfScope\` vs \`coverageGaps\`: out of scope = intentionally excluded product areas; coverage gaps = areas you **should** test but this analysis did not cover (missing automation, thin repo pass, blocked unit).
- \`goNoGo\`: required for UAT and REPO_UAT; omit for other modes. Use \`CONDITIONAL GO\` when open \`Assumed:\` items or \`blocked\` deep units remain.
- \`modeOutput.content\`: mode-specific bullets (REFINEMENT improvements, BUG root causes, etc.) — do not duplicate the entire report here.
- \`repoCandidates\`, \`repoLedger\`, \`coverageGaps\`: populate when multi-repo scope applies (see Multi-repo supplement when included); otherwise **empty arrays** \`[]\`, not omitted.
- \`repoSelfCritique\`: include **exactly 3** strings when \`repoLedger\` is a full table (≥1 user-listed or inferred row with real ledger semantics); omit the key when section 11 would be \`N/A\`.
- \`droppedScenarios\`: use when omitting duplicate, low-confidence, or redundant scenarios — reasons: \`duplicate_coverage\` | \`low_confidence\` | \`other\`.

Schema (model output only — no \`validationWarnings\`, no envelope wrapper):

${REPORT_JSON_SCHEMA_DESCRIPTION}`;
