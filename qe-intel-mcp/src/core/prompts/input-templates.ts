export const INPUT_TEMPLATES = `## Input Template (ticket or written requirements)

\`\`\`
MODE: REFINEMENT | UAT | REPO_UAT | BUG | REGRESSION

FEATURE / TICKET:
<paste here>

OPTIONAL CONTEXT:

API:
- Endpoint:
- Method:
- Request:
- Response:
- Validations:

SYSTEM:
- Services involved:
- Data flow:
- Integrations:

USER:
- User types:
- Critical journeys:

RISKS:
- Known flaky areas:
- Past bugs:
- Recently changed components:

EXISTING COVERAGE:
- Unit:
- API/Contract:
- E2E:
- E2E repo / suite (if not in this repo):
- Manual regression suite:
- Known coverage gaps:

RELEASE (for UAT and REPO_UAT):
- Type:
- Timeline:
- Rollback:
- Monitoring:

RELATED_REPOS / SYSTEM_MAP (optional — multi-repo or multi-deployable scope):

| Repo or deployable unit | Role (API / UI / worker / E2E / infra / lib) | Scan depth (shallow / deep) | Entry hints (paths, packages, search tokens) |
| --- | --- | --- | --- |
| <name> | <role> | <shallow or deep> | <hints> |

Short form (same columns, one row per line):
- \`<repo or unit> | <role> | <shallow | deep> | <hints>\`

SCOPE_UNKNOWN: true   # optional — set when repo boundaries are unclear; agent runs the inference ladder first (output: candidate table + questions; still no verification outside workspace)

COMPLETENESS (optional): e.g. "Require section 11 repo ledger; do not claim GO if any user-marked deep unit is missing from workspace."
\`\`\`

## Input Template (no ticket — repository-first, \`REPO_UAT\` only)

Use when you have a feature area or release slice to validate but no formal ticket. The agent should read the codebase (routes, UI flows, configs, tests) and treat anything not proven in code as \`Assumed:\` until you confirm.

\`\`\`
MODE: REPO_UAT

FEATURE / TICKET:
N/A — no ticket

FEATURE / AREA (plain language):
<what you are validating, e.g. "checkout promo application end-to-end">

REPO HINTS (optional but high value):
- Paths / packages / modules to inspect:
- E2E repo / suite (if separate from this repo):
- Branch or PR (if relevant):
- Entry points you already know (URLs, CLI, jobs):

RELATED_REPOS / SYSTEM_MAP (optional; recommended when more than one repo or deployable is in play):

| Repo or deployable unit | Role (API / UI / worker / E2E / infra / lib) | Scan depth (shallow / deep) | Entry hints (paths, packages, search tokens) |
| --- | --- | --- | --- |
| <name> | <role> | <shallow or deep> | <hints> |

Short form (same columns, one row per line):
- \`<repo or unit> | <role> | <shallow | deep> | <hints>\`

SCOPE_UNKNOWN: true   # optional — agent infers candidate repos from this workspace, then proceeds (candidates are not exhaustive without service catalog / ADR confirmation)

OPTIONAL CONTEXT:
(copy API / SYSTEM / USER / RISKS / EXISTING COVERAGE / RELEASE blocks from the main template as much as you know)
\`\`\``;
