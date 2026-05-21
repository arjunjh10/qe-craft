export const MULTI_REPO = `## Multi-repo supplement

### When this supplement applies

Section **11** is **mandatory with full tables** when \`RELATED_REPOS\` / \`SYSTEM_MAP\` lists **two or more** units, \`SCOPE_UNKNOWN: true\`, or the user asks for a repo ledger / completeness audit. **Never silently omit** a user-listed unit — use \`not_scanned\` or \`blocked\` with a one-line reason.

For a single monorepo workspace, treat major \`applications/*\` or \`packages/*\` roots as ledger rows when they behave like separate deployables.

**Out-of-workspace honesty:** you can only read files in the user's current workspace(s). Anything else is **not verified in workspace** — cite user-supplied links or questions only; do not fabricate directory listings.

### Section 11 — Markdown vs JSON

| Markdown | JSON field | Notes |
|----------|------------|-------|
| ### 11a table | \`repoCandidates[]\` | Inferred siblings/deployables; map columns to \`candidate\`, \`evidence\`, \`confidence\`, \`verifyHow\` |
| ### 11b table | \`repoLedger[]\` | Every user-listed unit + labeled inferred rows; map to \`repo\`, \`role\`, \`scopeCertainty\`, \`requestedDepth\`, \`status\`, \`evidenceOrReason\` |
| Self-critique bullets | \`repoSelfCritique\` | Exactly 3 strings when 11b is a full table |
| (no separate section) | \`coverageGaps[]\` | Cross-unit test blind spots not captured in \`outOfScope\` |

When section 11 would be \`N/A\` (single-repo, no \`SCOPE_UNKNOWN\`): Markdown uses one-line \`N/A\` per subsection; JSON uses empty \`repoCandidates\` and \`repoLedger\` arrays and omits \`repoSelfCritique\`.

### Inference ladder (when repo list is unknown or \`SCOPE_UNKNOWN: true\`)

Run in order; note at each step *found / not found*. Final repo list is **never** guaranteed exhaustive from narrative alone — label outputs **Inferred candidates** vs **Confirmed scope** (user- or catalog-confirmed).

1. **Integration class (hypothesis):** From verbs/nouns (e.g. UI change → frontend + API; async/webhook → worker; email/PDF → adapter)—states *class* of system, not a repo name.
2. **Outbound signals in workspace (shallow):** Ripgrep-style passes—internal package names (\`@scope/...\`), HTTP client base URLs, OpenAPI paths, event/topic strings, CDK queue/Step Function hints, feature-flag keys that reference other services.
3. **Monorepo shrink:** If one workspace tree, prefer package/app roots as ledger rows over guessing sibling repos.
4. **Docs / ADRs / diagrams:** \`docs/\`, RFC links from the ticket, C4—map explicit service names to likely repos using **org naming only with \`Assumed:\`** if convention-based.
5. **CI / deploy:** Pipelines that check out other repos, build matrices, cross-repo triggers—evidence for sibling repos.
6. **Ownership signals:** \`CODEOWNERS\`, PR links the user provides—optional corroboration.
7. If **no** usable signals: set Confidence in section 10 to **Low** and put **repo-discovery** questions first in section 4 (owning service names, deployables, E2E home repo).

### Multi-repo scan strategy (time + tokens)

| Phase | What to do |
|--------|------------|
| **Lead unit** | The user's primary workspace (or the single row marked \`deep\`)—routes, handlers, flags, tests; this is the only default **deep** pass. |
| **Satellite units** | Default **shallow**: \`package.json\` / workspace refs, targeted grep for imports, env vars, HTTP clients, event names, shared package versions—**not** full-tree reads unless the user marks \`deep\` or you hit a dead end. |
| **Parallelism** | Run independent shallow greps / reads in parallel when the agent runtime allows; cap total breadth before going deeper on any satellite. |
| **Evidence rule** | Repos not in workspace: ledger status **\`blocked\`** (no workspace); analysis may reference user URLs or public docs as **unverified**. |
| **Caps (defaults)** | Prefer **≤5** RELATED rows and **≤2** \`deep\` rows per run unless the user expands the list; state in section 11 / \`repoLedger\` if the cap forced \`not_scanned\` for lower-priority units.`;
