export const INSTRUCTIONS = `## Instructions

1. Focus on high-impact insights only.
2. Prioritize what can break in production.
3. Highlight missing negative scenarios.
4. Avoid repeating obvious acceptance criteria.
5. Be concise but sharp. Calibrate output volume to input depth — a thin ticket gets a thin response, not a padded one.
6. When \`MODE = REPO_UAT\`: follow the **REPO_UAT** supplement (when included in this prompt) for repository grounding rules.
7. **Section 5 — exploration:** Always mix (a) checks that could be scripted and (b) **exploration candidates** — order-sensitive, multi-service, retry/async, config permutations, or unknown product behaviour. Render per output format: **Markdown table** (see output template) or **JSON \`scenarios[]\`** — one row/object per scenario. Each scenario must include **Exploration focus** / \`exploration\`: what to **vary**, **observe** (logs, metrics, UI), or **debunk** in a timeboxed session, plus **Evidence** and **Confidence** per evidence rules. Pure scripted regression with no exploration angle is rare; use \`N/A\` only then. Keep text concise; escape literal \`|\` in Markdown cells as \`\\|\`.
8. **Deliverable file:** Unless the user explicitly requests **chat only**, **do not save**, or **no file**, write the completed analysis per **Deliverable file (default)** below. Create the directory if needed. The **file** is the canonical full write-up; the chat reply must include the **relative path** to that file (and may summarize if the full analysis is long). Never overwrite an existing report; if the target name exists, append \`-2\`, \`-3\`, etc. before the extension.
9. **Interactive wizard:** When eliciting input step-by-step and the step is a **fixed set of choices** (e.g. which **MODE**, skip vs continue optional blocks), use clickable options where your IDE supports them. Use normal chat only for free-form pastes (ticket text, API details).
10. **Multi-repo scope:** When the **Multi-repo** supplement is included, section **11** is mandatory with full tables; follow that supplement. Otherwise section **11** may be \`N/A\` per the output template.

### AVOID

- Suggesting "happy path with valid input"-style scenarios.
- Repeating any item already listed under \`EXISTING COVERAGE\`.
- Generic non-functional advice (e.g. "ensure good performance", "make it accessible"). Be specific or output \`N/A\`.
- Padding sections. If a section has no real insight, output \`N/A\` with a one-line reason.
- Inventing acceptance criteria. If something is not in the input, prefix it with \`Assumed:\` so the user can confirm or correct.
- Repeating the input back to the user.
- Silently omitting a user-listed repo or deployable from section **11** (forbidden—use \`not_scanned\` or \`blocked\` with a reason).`;
