# QE Intel — guided run (primary)

**Start here:** call the mode tool, execute phases in chat, save only if asked.

| Mode | MCP tool |
|------|----------|
| Story grooming | `qe_intel_refinement` |
| Release UAT | `qe_intel_uat` |
| No ticket / repo charter | `qe_intel_repo_uat` |
| Production bug | `qe_intel_bug` |
| PR / change impact | `qe_intel_regression` |

## Default contract

- **output_tier:** `coach` (default) — phases A–D in chat; plain language.
- **output_tier:** `full` — embed senior prompt + Phase E save rules.
- **save_file:** default `false` for coach.

## Phases (agent executes in Cursor)

1. **A — Understand** — repo scan hints + user questions if input thin.
2. **B — Gaps & risks** — concrete, not generic NFR fluff.
3. **C — Scenarios** — short table (max ~5 in coach).
4. **D — Mode decision** — AC gaps / GO-NO-GO / root cause / retest list.
5. **E — Team record** — optional; see [artifact-run.md](./artifact-run.md).

## Quality mid-flight

Call **`qe_intel_review`** with draft scenarios before Phase E.

## MCP does not

- Read the repo (you do, using “Where to look” hints from the tool).
- Call an external LLM API.
