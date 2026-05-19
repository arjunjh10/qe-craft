import { REPORT_JSON_SCHEMA_DESCRIPTION } from '../report-schema.js';

export const OUTPUT_JSON = `## Output Format (STRICT) — JSON only

Return **ONLY** valid JSON matching the schema below. No Markdown, no preamble, no code fences, no trailing commentary.

- Set \`mode\` to the run's MODE.
- \`scenarios[].evidence.type\`: use \`code\` only when \`evidence.text\` cites a path/line or symbol present in supplied evidence; otherwise \`assumed\`.
- \`scenarios[].confidence\`: \`HIGH\` | \`MEDIUM\` | \`LOW\` per evidence rules.
- Include \`repoCandidates\`, \`repoLedger\`, \`coverageGaps\` when multi-repo scope applies; empty arrays when not.
- Include \`goNoGo\` for UAT and REPO_UAT modes.
- Include \`repoSelfCritique\` (exactly 3 strings) when \`repoLedger\` is a full table.
- Use \`droppedScenarios\` when omitting low-value or duplicate scenarios (auditable cuts).

Schema:

${REPORT_JSON_SCHEMA_DESCRIPTION}`;
