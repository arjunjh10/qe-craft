export const OUTPUT_MARKDOWN = `## Output Format (STRICT) — Markdown

Use these section headings exactly. Sections **1–8** always; **9–10** always; **11** always present (use full tables when multi-unit scope applies; otherwise \`N/A\` with one line per section 11 rules). The **file** under \`docs/qe-analysis/\` must contain the **full** sections **1–11**. The chat reply may be a **short summary** plus the file path, or the full text — choose based on length, but always include the **relative path** to the saved file.

\`\`\`
## 1. Understanding (max 3 bullets)
- What this feature does
- Critical flow

## 2. Gaps & Ambiguities
- Missing or unclear requirements
- Hidden assumptions

## 3. Top Risks (3–7, scaled to complexity)
For each:
- Risk: <one line>
- Impact: P0 | P1 | P2
- Likelihood: High | Medium | Low
- Detection difficulty: Easy | Hard
- Mitigation: <one line>

## 4. Questions to Ask
- Crisp, specific, non-obvious

## 5. Test Scenarios (High Value Only)
Include both scriptable checks and **exploration candidates** (seams, variability, unknowns — good charter fodder). Use a **Markdown table** (not a bullet list).

| # | Scenario | Exploration focus | Evidence | Confidence | Why it matters | Layer |
|---|----------|-------------------|----------|------------|----------------|-------|
| 1 | <short scenario name> | <vary / observe / disprove> | <file:line, route, flag, or Assumed: …> | HIGH \\| MEDIUM \\| LOW | <one line> | API / UI / Integration |
| 2 | ... | ... | ... | ... | ... | ... |

Rules: one scenario per row; increment \`#\`; keep cells **brief**. **Evidence** and **Confidence** are mandatory per evidence rules. If a cell needs a literal pipe, escape as \`\\|\`.

## 6. Non-Functional Concerns
- Performance
- Security
- Accessibility
- Observability

## 7. Mode-Specific Output

IF MODE = REFINEMENT:
- Missing acceptance criteria
- Suggested improvements

IF MODE = UAT:
- Execution plan (what to test first); prioritise section 5 **table** rows with the richest **Exploration focus** for human timeboxed sessions where automation is thin
- Release risks
- GO / NO-GO recommendation with reason

IF MODE = REPO_UAT:
- Evidence from repo (short bullets: key files, routes, flags, tests found — not a file dump)
- Execution plan ordered by risk (repo-informed); lead with the richest **Exploration focus** rows from the section 5 table (grounded in code you read)
- Release risks
- GO / NO-GO recommendation with reason (state if GO is conditional on open \`Assumed:\` items). If the user required completeness in input (e.g. no GO when a \`deep\` unit is **blocked**), honour that and cite section **11** status columns.

IF MODE = BUG:
- Possible root causes
- Missed test coverage
- Regression risks

IF MODE = REGRESSION:
- Impacted areas
- Priority test areas
- Automation to run

## 8. Automation Notes
- What should be automated
- At which layer (unit / API / UI)
- Any gaps in current coverage (cross-reference EXISTING COVERAGE)
- For multi-unit scope: name **which repo/unit** should own each automation gap when known (ties to section **11** ledger)

## 9. Out of Scope & Coverage Gaps
- **Out of scope:** what is explicitly NOT being tested in this analysis and why; boundary conditions deferred to other tickets/teams
- **Coverage gaps (optional bullets):** in-scope areas this run did **not** cover — missing automation, thin repo pass, or a \`blocked\` / \`not_scanned\` unit (tie to section **11** when relevant). Distinct from out-of-scope product boundaries.
- Per-repo **scan** status belongs in section **11**, not here

## 10. Confidence Level
- High | Medium | Low
- One-line reason, citing which input fields were thin or missing
- When section **11** used full tables: add one line tying confidence to **how many units were \`scanned\` vs \`blocked\` / \`not_scanned\`** and whether candidates were **inferred** vs **confirmed**

## 11. Scope & repo coverage
Rules:
- **Full tables (11a + 11b required; no \`N/A\` for the tables themselves):** when \`RELATED_REPOS\` / \`SYSTEM_MAP\` lists **two or more** units, \`SCOPE_UNKNOWN: true\`, or the user explicitly asks for a repo ledger / completeness audit in input.
- **Otherwise:** output subsection headings **11a** and **11b** each as \`N/A\` with a single line (e.g. "Single-repo ticket; no RELATED rows.").

### 11a. Candidate systems / repos (inferred)
Markdown table:

| Candidate | Evidence (1 line from this workspace or pasted input) | Confidence (High / Med / Low) | Verify how (owner, catalog link, or search to run) |
| --- | --- | --- | --- |

Use this table for **inferred** siblings or deployables. If nothing was inferred and scope is fully user-confirmed, one row stating that is enough.

### 11b. Repo coverage ledger
Markdown table (include **every** user-listed unit; add inferred rows only when clearly labeled \`inferred\`):

| Repo / unit | Role | Scope certainty (\`confirmed\` | \`inferred\`) | Requested depth (\`shallow\` | \`deep\`) | Status (\`scanned\` | \`not_scanned\` | \`blocked\`) | One-line evidence or reason |
| --- | --- | --- | --- | --- | --- |

- **\`scanned\`:** files read or grep-backed evidence collected in workspace for that unit.
- **\`not_scanned\`:** in workspace but skipped (cap, time, or user priority)—say why.
- **\`blocked\`:** not in Cursor workspace—**no** claimed file evidence; user links = unverified.

**Self-critique (when 11b is a full table):** exactly **3** bullets: (1) which repo gave **no** automation evidence, (2) which integration relied on an **assumption**, (3) which **layer** may still be blind after shallow passes.

**Traceability hint:** optionally add bullets mapping *behaviour* → *test idea* → *owning repo/unit* (or extend section 5 / 8 rows with an extra clause)—use when multi-repo hand-offs are non-obvious.
\`\`\``;
