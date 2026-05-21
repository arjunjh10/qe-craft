export const EVIDENCE_RULES = `## Evidence over imagination

- Ground scenarios in **evidence** from the user message, \`evidence_context\`, \`api_context\`, \`repo_hints\`, or pasted citations — not invention.
- The MCP server does **not** read the repo; only what the calling agent passes in the user message counts as workspace proof.
- **\`evidence_context\` (when present):** use summarized citations only — one finding per line, e.g. \`src/api/promo.ts:42 — POST /checkout/promo handler\`. Do not paste whole files. Prefer bullets over prose walls.
- If a path, route, flag, or behaviour is **not** supported by supplied evidence, label it \`Assumed:\` and set scenario **Confidence** to **LOW** (Markdown) or \`"confidence": "LOW"\` with \`"type": "assumed"\` (JSON).
- **HIGH** confidence requires a concrete citation (\`file:line\`, route, flag key, test name, or explicit ticket text).
- **MEDIUM** confidence: plausible from partial context but not directly cited.
- **LOW** confidence: hypothesis only — must be traceable to an open question in section 4.

## Evidence types (JSON \`scenarios[].evidence.type\`)

| Type | When to use |
|------|-------------|
| \`code\` | \`evidence.text\` cites a path, line, symbol, route, or flag **present** in \`evidence_context\`, \`repo_hints\`, \`api_context\`, or the user message |
| \`spec\` | Grounded in ticket/AC text, OpenAPI snippet, or pasted requirement — not a repo file citation |
| \`assumed\` | Hypothesis, convention guess, or anything not in the evidence bundle — pair with \`LOW\` confidence |

Markdown section 5 **Evidence** column: use \`file:line\`, route, flag, or \`Assumed: …\` (no separate \`type\` column).

## Hallucination rules (STRICT)

- **Never** invent file paths, directory listings, test suite names, or API contracts not present in input or evidence bundle.
- **Never** duplicate scenarios already covered under \`EXISTING COVERAGE\` — skip the row (Markdown) or record in \`droppedScenarios\` with reason \`duplicate_coverage\` (JSON).
- **Never** pad sections with generic advice; use \`N/A\` with a one-line reason.
- **Never** claim \`scanned\` ledger status for repos outside the workspace — use \`blocked\` with an honest reason.
- Do not fabricate acceptance criteria; prefix with \`Assumed:\` when inferring.
- Do not label \`code\` evidence for paths the server cannot verify — the post-parse guard may downgrade to \`assumed\`.

## Evidence scoring (section 5 / \`scenarios\`)

Each scenario must include:
- **Evidence** (Markdown column or JSON \`evidence.text\`): \`file:line\`, route, flag, event name, ticket quote, or \`Assumed: …\`.
- **Confidence**: \`HIGH\` | \`MEDIUM\` | \`LOW\` aligned with the rules above.

Cut or demote rather than pad: omit low-value rows (Markdown) or list them in \`droppedScenarios\` with reason \`low_confidence\` (JSON).

## Assumed → question mapping

Every \`Assumed:\` item in section 2 (gaps) or scenario evidence should have a matching crisp question in section 4 (or \`questions[]\` in JSON), or be called out in mode-specific GO/NO-GO reasoning (\`goNoGo\` for UAT / REPO_UAT).`;
