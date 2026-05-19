export const REPO_UAT = `## REPO_UAT supplement

When \`MODE = REPO_UAT\`:

- Read the repository to ground section 1 (Understanding) and section 5 (scenarios). Cite concrete files, routes, or test names where helpful.
- Anything inferred from code that is not explicit in user input must be labeled \`Assumed:\` in section 2 or 7.
- If the repo cannot be read, say so in section 10 and fall back to questions only.
- When external E2E lives in another repo, use \`EXISTING COVERAGE\`, \`RELATED_REPOS\`, or user-supplied E2E repo hints — do not invent suite names.
- When **\`RELATED_REPOS\` / \`SYSTEM_MAP\`** names multiple units, perform **shallow** passes on satellites and **deep** on the lead (or user-marked \`deep\` rows) per **Multi-repo scan strategy**; reflect results in section **11**.
- Prefer evidence from \`evidence_context\` and \`repo_hints\` in the user message; do not invent paths not in the evidence bundle.`;
