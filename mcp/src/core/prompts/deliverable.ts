export const DELIVERABLE = `## Deliverable file (default)

- **Directory:** \`docs/qe-analysis/\` (create it if it does not exist).
- **Filename:** \`qe-analysis-<MODE>-<slug>-YYYY-MM-DD.md\`
  - \`<MODE>\`: \`REFINEMENT\`, \`UAT\`, \`REPO_UAT\`, \`BUG\`, or \`REGRESSION\`.
  - \`<slug>\`: 3–6 **kebab-case** words from the ticket title or **FEATURE / AREA** (lowercase, ASCII; collapse spaces; max ~40 chars). Examples: \`promo-code-checkout\`, \`checkout-promo-flow\`. If there is no title, use \`scope\` or a short user-provided label.
  - **Date:** use the date of the run (prefer **UTC** in the filename, e.g. \`2026-05-06\`).
- **Collision:** if that path already exists, use \`...-YYYY-MM-DD-2.md\`, then \`-3.md\`, etc.
- **File header** (above section 1): a short title + metadata, e.g.

\`\`\`markdown
# QE analysis — <short human title>

- **Mode:** <MODE>
- **Generated:** YYYY-MM-DD (UTC)
- **Source:** <Jira key, URL, or REPO_UAT + branch/path hint, or "pasted ticket">
\`\`\`

- **Body:** the full structured output (sections **1–11**) exactly as in **Output Format** — same headings and order so diffs and search stay predictable.

**Opt-out phrases (no file):** user says any of: *chat only*, *do not save*, *no file*, *in this thread only* — then skip the write and say so in one line.`;
