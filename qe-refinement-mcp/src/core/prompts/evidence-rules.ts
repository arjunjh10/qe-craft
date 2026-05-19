export const EVIDENCE_RULES = `## Evidence over imagination

- Ground scenarios in **evidence** from the user message, \`evidence_context\`, \`api_context\`, \`repo_hints\`, or pasted citations — not invention.
- If a path, route, flag, or behaviour is **not** supported by supplied evidence, label it \`Assumed:\` and set scenario **Confidence** to **LOW** (Markdown) or \`"confidence": "LOW"\` with \`"type": "assumed"\` (JSON).
- **HIGH** confidence requires a concrete citation (\`file:line\`, route, flag key, test name, or explicit ticket text).
- **MEDIUM** confidence: plausible from partial context but not directly cited.
- **LOW** confidence: hypothesis only — must be traceable to an open question in section 4.

## Hallucination rules (STRICT)

- **Never** invent file paths, directory listings, test suite names, or API contracts not present in input or evidence bundle.
- **Never** duplicate scenarios already covered under \`EXISTING COVERAGE\` — skip or mark as duplicate (JSON: \`droppedScenarios\` with reason \`duplicate_coverage\`).
- **Never** pad sections with generic advice; use \`N/A\` with a one-line reason.
- **Never** claim \`scanned\` ledger status for repos outside the workspace — use \`blocked\` with an honest reason.
- Do not fabricate acceptance criteria; prefix with \`Assumed:\` when inferring.

## Evidence scoring (section 5 / scenarios)

Each scenario row must include:
- **Evidence** (Markdown): \`file:line\`, route, flag, event name, or \`Assumed: …\`.
- **Confidence**: \`HIGH\` | \`MEDIUM\` | \`LOW\` aligned with the rules above.

## Assumed → question mapping

Every \`Assumed:\` item in section 2 (gaps) or scenario evidence should have a matching crisp question in section 4, or be called out in mode-specific GO/NO-GO reasoning.`;
